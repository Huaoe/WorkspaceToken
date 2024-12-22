'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { getPropertyFactoryContract, getWhitelistContract, getSigner, getEURCContract } from "@/lib/ethereum";
import { useAccount } from "wagmi";
import { propertyFormSchema } from "./PropertyDetailsFields";
import { UseFormReturn } from "react-hook-form";
import { parseUnits, formatUnits } from "viem";
import { Loader2 } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/supabase/types";

const formSchema = propertyFormSchema.extend({
  location: z.string().min(2).max(256, {
    message: "Location must be between 2 and 256 characters.",
  }),
  token_address: z.string().optional(),
  roi: z.coerce.number().min(0, "ROI must be greater than 0"),
  payout_duration: z.coerce.number().min(0, "Duration must be greater than 0"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateTokenButtonProps {
  propertyId: string;
  form: UseFormReturn<FormValues>;
}

export function CreateTokenButton({ propertyId, form }: CreateTokenButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const supabase = createClientComponentClient<Database>();

  const validateInput = (input: string, maxLength: number, fieldName: string) => {
    if (!input || input.trim().length === 0) {
      throw new Error(`${fieldName} cannot be empty`);
    }
    if (input.trim().length > maxLength) {
      throw new Error(`${fieldName} too long (max ${maxLength} characters)`);
    }
  };

  const handleCreateToken = async () => {
    if (!isConnected) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const formData: FormValues = form.getValues();

      // Log all form data for debugging
      console.log('Form data received:', {
        ...formData,
        number_of_tokens_type: typeof formData.number_of_tokens,
        expected_price_type: typeof formData.expected_price,
      });

      // Get signer first
      const signer = await getSigner();
      if (!signer) {
        throw new Error('No signer available');
      }

      // Get current nonce
      const currentNonce = await signer.getNonce();
      console.log('Current nonce:', currentNonce);

      // Check if user is whitelisted first
      const whitelist = await getWhitelistContract(true);
      const userAddress = await signer.getAddress();
      console.log('Checking whitelist for address:', userAddress);
      
      const isWhitelisted = await whitelist.isWhitelisted(userAddress);
      console.log('Is whitelisted:', isWhitelisted);
      
      if (!isWhitelisted) {
        throw new Error('Your address is not whitelisted. Please complete KYC first.');
      }

      // Convert and validate numbers
      const numberOfTokens = (() => {
        try {
          const value = Number(formData.number_of_tokens);
          if (isNaN(value) || value <= 0) {
            throw new Error('Invalid number of tokens');
          }
          // Check if total supply exceeds maximum limit (1,000,000 tokens)
          if (value > 1000000) {
            throw new Error('Total supply exceeds maximum limit of 1,000,000 tokens');
          }
          const tokens = parseUnits(value.toString(), 18);
          console.log('Number of tokens (18 decimals):', tokens.toString());
          return tokens;
        } catch (error) {
          console.error('Error converting number of tokens:', error);
          throw error;
        }
      })();

      const expectedPrice = (() => {
        try {
          const value = Number(formData.expected_price);
          if (isNaN(value) || value <= 0) {
            throw new Error('Invalid price');
          }
          // Convert to EURC (6 decimals)
          const price = parseUnits(value.toString(), 6);
          console.log('Expected price (EURC - 6 decimals):', price.toString());
          return price;
        } catch (error) {
          console.error('Error converting expected price:', error);
          throw error;
        }
      })();

      // Get factory contract
      const factory = await getPropertyFactoryContract(true);
      if (!factory) {
        throw new Error('Could not get factory contract');
      }

      // Get EURC token contract
      const eurcTokenAddress = await factory.paymentToken.call();
      console.log('EURC token address:', eurcTokenAddress);
        
      if (!eurcTokenAddress) {
        throw new Error('EURC token address not set in factory');
      }
        
      const eurcContract = await getEURCContract(eurcTokenAddress, true);

      // Check EURC balance
      const eurcBalance = await eurcContract.balanceOf(userAddress);
      const eurcBalanceBigInt = BigInt(eurcBalance.toString());
      const expectedPriceBigInt = BigInt(expectedPrice.toString());
        
      console.log('EURC balance:', formatUnits(eurcBalanceBigInt, 6), 'EURC');

      if (eurcBalanceBigInt < expectedPriceBigInt) {
        throw new Error(`Insufficient EURC balance. You need ${formatUnits(expectedPriceBigInt, 6)} EURC but have ${formatUnits(eurcBalanceBigInt, 6)} EURC`);
      }

      // Check if PropertyFactory is approved to spend EURC
      const factoryAddress = await factory.getAddress();
      // const allowance = await eurcContract.allowance(userAddress, factoryAddress);
      // const allowanceBigInt = BigInt(allowance.toString());
      // console.log('Current EURC allowance:', formatUnits(allowanceBigInt, 6));

      // if (allowanceBigInt < expectedPriceBigInt) {
      //   console.log('Approving EURC spend...');
        
      //   // Prepare approval transaction
      //   const approveTx = await eurcContract.approve(
      //     factoryAddress,
      //     expectedPriceBigInt,
      //     {
      //       gasLimit: 100000, // Set a reasonable gas limit
      //       nonce: await signer.getNonce()
      //     }
      //   );
        
      //   console.log('Approval transaction sent:', approveTx.hash);
      //   await approveTx.wait();
      //   console.log('EURC approved for PropertyFactory');
      // }

      // Validate string lengths
      const validateStringLength = (str: string, maxLength: number, fieldName: string) => {
        const bytes = new TextEncoder().encode(str);
        if (bytes.length > maxLength) {
          throw new Error(`${fieldName} too long (max ${maxLength} bytes)`);
        }
      };

      validateStringLength(formData.token_name, 100, "Token name");
      validateStringLength(formData.token_symbol, 10, "Token symbol");
      validateStringLength(formData.title, 100, "Title");
      validateStringLength(formData.description, 500, "Description");
      validateStringLength(formData.location, 256, "Location");
      if (formData.image_url) {
        validateStringLength(formData.image_url, 500, "Image URL");
      }

      // Prepare parameters for createProperty
      const params = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        imageUrl: formData.image_url || "",
        price: expectedPriceBigInt,
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

      // Create property
      console.log('Creating property with transaction params:', {
        gasLimit: 5000000,
        nonce: await signer.getNonce()
      });
      
      const tx = await factory.createProperty(
        params.title,
        params.description,
        params.location,
        params.imageUrl,
        params.price,
        params.totalSupply,
        params.tokenName,
        params.tokenSymbol,
        {
          gasLimit: 5000000,
          nonce: await signer.getNonce()
        }
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);

      // Get property token address from event
      const propertyCreatedEvent = receipt.logs.find(
        (log: any) => log.fragment?.name === 'PropertyCreated'
      );

      if (!propertyCreatedEvent) {
        throw new Error('Property token address not found in event logs');
      }

      const [propertyToken, creator, title, location, price] = propertyCreatedEvent.args;
      console.log('Property token created:', {
        address: propertyToken,
        creator,
        title,
        location,
        price: formatUnits(BigInt(price.toString()), 6)
      });

      // Validate property token address
      if (!propertyToken || propertyToken === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid property token address received from event');
      }

      console.log('Updating database with token address:', propertyToken);
      
      // Update database with token address and status
      const { data: updateData, error: dbError } = await supabase
        .from('property_requests')
        .update({ 
          status: 'onchain', 
          token_address: propertyToken,
          updated_at: new Date().toISOString()
        })
        .eq('id', propertyId)
        .select()
        .single();

      if (dbError) {
        console.error('Error updating database:', dbError);
        throw new Error(`Error updating database: ${dbError.message}`);
      }

      console.log('Database updated successfully:', updateData);

      // Update form values
      form.setValue('status', 'onchain');
      form.setValue('token_address', propertyToken);

      // Verify form values were updated
      const formStatus = form.getValues('status');
      const formTokenAddress = form.getValues('token_address');
      console.log('Form values after update:', {
        status: formStatus,
        token_address: formTokenAddress
      });

      toast({
        title: 'Success',
        description: `Property token created successfully at address: ${propertyToken}`,
      });

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
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
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      Create Token
    </Button>
  );
}
