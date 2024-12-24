'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useWalletEvents } from "@/app/wallet-events-provider";
import { getPropertyFactoryContract, getProvider, getSigner, getPropertyTokenContract, getEURCContract, getWhitelistContract } from "@/lib/ethereum";
import { UseFormReturn } from "react-hook-form";
import { ethers } from "ethers";
import { formatUnits, parseUnits } from "viem";
import { EURC_TOKEN_ADDRESS } from "@/lib/contracts";
import { supabase } from "@/lib/supabase/client";

interface FormValues {
  title: string;
  description: string;
  location: string;
  image_url: string;
  expected_price: string; 
  number_of_tokens: string;
  token_name: string;
  token_symbol: string;
  token_address: string;
  status: string;
}

interface CreateTokenButtonProps {
  propertyId: string;
  form: UseFormReturn<FormValues>;
}

export function CreateTokenButton({ propertyId, form }: CreateTokenButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleCreateToken = async () => {
    try {
      setLoading(true);

      // Get form data
      const formData = form.getValues();
      
      // Validate required fields
      if (!formData.title?.trim()) {
        throw new Error('Title is required');
      }
      if (!formData.description?.trim()) {
        throw new Error('Description is required');
      }
      if (!formData.location?.trim()) {
        throw new Error('Location is required');
      }
      if (!formData.image_url?.trim()) {
        throw new Error('Image URL is required');
      }
      if (!formData.expected_price?.trim()) {
        throw new Error('Price is required');
      }
      if (!formData.number_of_tokens?.trim()) {
        throw new Error('Number of tokens is required');
      }
      if (!formData.token_name?.trim()) {
        throw new Error('Token name is required');
      }
      if (!formData.token_symbol?.trim()) {
        throw new Error('Token symbol is required');
      }

      // Validate numeric fields
      const priceNumber = Number(formData.expected_price);
      if (isNaN(priceNumber) || priceNumber <= 0) {
        throw new Error('Price must be a positive number');
      }

      const tokensNumber = Number(formData.number_of_tokens);
      if (isNaN(tokensNumber) || tokensNumber <= 0) {
        throw new Error('Number of tokens must be a positive number');
      }

      // Get signer and verify connection
      const signer = await getSigner();
      if (!signer) {
        throw new Error('No signer available');
      }

      // Get user address
      const userAddress = await signer.getAddress();
      if (!userAddress) {
        throw new Error('No user address available');
      }

      // Get factory contract
      const factory = await getPropertyFactoryContract(true);
      if (!factory) {
        throw new Error('Failed to get property factory contract');
      }

      // Get factory address
      const factoryAddress = await factory.getAddress();
      if (!factoryAddress) {
        throw new Error('Failed to get factory address');
      }

      // Get EURC token address
      const eurcTokenAddress = await factory.eurcTokenAddress();
      if (!eurcTokenAddress) {
        throw new Error('Failed to get EURC token address');
      }

      // Get whitelist contract
      const whitelist = await getWhitelistContract(true);
      if (!whitelist) {
        throw new Error('Failed to get whitelist contract');
      }

      // Check if user is whitelisted
      const isWhitelisted = await whitelist.isWhitelisted(userAddress);
      if (!isWhitelisted) {
        throw new Error('You must be whitelisted to create a property token');
      }

      // Convert price to wei (6 decimals for EURC)
      const price = parseUnits(formData.expected_price, 6);

      // Convert number of tokens to wei (18 decimals for property token)
      const numberOfTokens = parseUnits(formData.number_of_tokens, 18);

      // Create parameters object
      const params = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        imageUrl: formData.image_url,
        price: BigInt(price.toString()),
        totalSupply: BigInt(numberOfTokens.toString()),
        tokenName: formData.token_name,
        tokenSymbol: formData.token_symbol
      };

      // Log contract addresses and parameters
      console.log('Contract addresses:', {
        factory: factoryAddress,
        eurc: eurcTokenAddress,
        whitelist: await whitelist.getAddress(),
        user: userAddress
      });

      console.log('Creating property with params:', {
        ...params,
        price: formatUnits(params.price, 6),
        totalSupply: formatUnits(params.totalSupply, 18),
        priceWei: params.price.toString(),
        totalSupplyWei: params.totalSupply.toString()
      });

      // Create property token
      console.log('Creating property with params:', params);
      const nonce = await signer.getNonce();
      const tx = await factory.createProperty(
        params.tokenName,
        params.tokenSymbol,
        params.title,
        params.description,
        params.location,
        params.imageUrl,
        params.price.toString(),
        params.totalSupply.toString(),
        {
          gasLimit: 5000000,
          nonce
        }
      );

      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Get the property token address from the transaction receipt
      const propertyAddress = receipt.logs.find(
        (log: any) => log.fragment?.name === 'PropertyCreated'
      )?.args?.propertyToken;

      console.log('Property token created at:', propertyAddress);

      // Verify property was added to factory
      const allProperties = await factory.getProperties();
      console.log('All properties after creation:', allProperties);

      const propertyExists = allProperties.some(
        (prop: any) => prop.tokenAddress.toLowerCase() === propertyAddress.toLowerCase()
      );
      console.log('Property exists in factory:', propertyExists);

      if (!propertyExists) {
        throw new Error('Property was not properly added to factory array');
      }

      // Update form with token address and status
      form.setValue('token_address', propertyAddress);
      form.setValue('status', 'onchain');

      // Save token address to database
      const { error: dbError } = await supabase
        .from("property_requests")
        .update({
          token_address: propertyAddress,
          status: 'onchain',
          updated_at: new Date().toISOString()
        })
        .eq("id", propertyId);

      if (dbError) {
        console.error('Failed to update database:', dbError);
        throw new Error('Failed to save token address to database');
      }

      // Show success message
      toast({
        title: 'Success',
        description: 'Property token created and saved successfully',
      });

    } catch (error: any) {
      console.error('Error creating property token:', error);

      // Try to extract revert reason if available
      let errorMessage = error.message || 'Failed to create property token';
      if (error.data) {
        try {
          // Try to decode the error data
          const iface = new ethers.Interface([
            'error NotWhitelisted(address account)',
            'error NotValidator(address account)',
            'error InvalidPropertyToken()',
            'error StakingAlreadyExists()',
            'error DurationMustBeGreaterThanZero()',
            'error RewardRateIsZero()'
          ]);
          const decodedError = iface.parseError(error.data);
          errorMessage = `Contract error: ${decodedError.name}`;
        } catch (decodeError) {
          // If we can't decode the error, just use the original message
          console.error('Failed to decode error:', decodeError);
        }
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCreateToken}
      disabled={loading}
      variant="outline"
    >
      {loading && (
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
      )}
      Create Token
    </Button>
  );
}
