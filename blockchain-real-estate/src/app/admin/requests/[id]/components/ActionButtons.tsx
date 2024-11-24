'use client';

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { propertyFactoryABI } from "@/contracts/abis/propertyFactoryABI";
import { useAccount, useContractRead, usePublicClient, useWalletClient } from "wagmi";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

interface ActionButtonsProps {
  id: string;
  status: string;
  onSuccess?: () => void;
}

export function ActionButtons({ id, status, onSuccess }: ActionButtonsProps) {
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const { address } = useAccount();
  const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as `0x${string}`;
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Check if user is factory owner
  const { data: factoryOwner } = useContractRead({
    address: contractAddress,
    abi: propertyFactoryABI,
    functionName: 'owner',
  });

  const checkIsOwner = useCallback(() => {
    if (address && factoryOwner) {
      setIsOwner(factoryOwner.toLowerCase() === address.toLowerCase());
    }
  }, [address, factoryOwner]);

  useEffect(() => {
    checkIsOwner();
  }, [checkIsOwner]);

  const handleCreateToken = async () => {
    try {
      setCreating(true);

      if (!address || !walletClient) {
        toast({
          title: "Error",
          description: "Please connect your wallet",
          variant: "destructive",
        });
        return;
      }

      if (!isOwner) {
        toast({
          title: "Error",
          description: "Only the contract owner can create property tokens",
          variant: "destructive",
        });
        return;
      }

      // Get the property request data
      const { data: propertyData, error: fetchError } = await supabase
        .from('property_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (propertyData.status !== 'approved') {
        toast({
          title: "Error",
          description: "Property must be approved before creating a token",
          variant: "destructive",
        });
        return;
      }

      // Format data to meet contract requirements
      const title = propertyData.title.trim().slice(0, 20);
      const description = propertyData.description.trim().slice(0, 50);
      const location = propertyData.location
        .replace(/[,\n\r\t]/g, ' ')
        .split(' ')
        .filter(Boolean)
        .join(' ')
        .trim()
        .slice(0, 256);
      const imageUrl = propertyData.image_url?.trim().slice(0, 100) || '';
      
      // Convert price to EURC with 6 decimals (e.g., 1 EURC = 1000000)
      const priceInEurc = Number(propertyData.expected_price);
      if (isNaN(priceInEurc) || priceInEurc <= 0) {
        throw new Error('Invalid price value');
      }
      // Don't multiply by 1000000 as the input price is already in the smallest unit
      const price = BigInt(Math.floor(priceInEurc));

      // Log the exact arguments being passed
      const args = [title, description, location, imageUrl, price] as const;
      console.log('Creating property with args:', {
        title,
        description,
        location,
        imageUrl,
        price: price.toString(),
        priceInEurc,
        argsLength: args.length
      });

      // Create property token
      const { request } = await publicClient.simulateContract({
        account: address,
        address: contractAddress,
        abi: propertyFactoryABI,
        functionName: 'createProperty',
        args,
      });

      const hash = await walletClient.writeContract(request);
      console.log('Transaction hash:', hash);

      // Wait for transaction
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('Transaction receipt:', receipt);

      // Update status to onchain after successful token creation
      const { error: updateError } = await supabase
        .from('property_requests')
        .update({
          status: 'onchain',
          tokenized_at: new Date().toISOString()
        })
        .match({ id });

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Property token created successfully',
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error creating token:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create property token',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex justify-end space-x-2">
      {status === 'approved' && isOwner && (
        <Button
          type="button"
          onClick={handleCreateToken}
          disabled={creating}
        >
          {creating ? 'Creating Token...' : 'Create Property Token'}
        </Button>
      )}
    </div>
  );
}
