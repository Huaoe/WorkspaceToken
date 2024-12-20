'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import propertyFactoryJSON from '../../../../../contracts/abis/PropertyFactory.json';
import { type Abi, parseUnits, decodeEventLog } from "viem";

interface CreateTokenButtonProps {
  id: string;
  formData: {
    token_name: string;
    token_symbol: string;
    number_of_tokens: string;
    expected_price: string;
  };
}

export function CreateTokenButton({ id, formData }: CreateTokenButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const propertyFactoryABI = propertyFactoryJSON.abi as Abi;
  const propertyFactoryAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS as `0x${string}`;

  const handleCreateToken = async () => {
    if (!isConnected) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!walletClient) {
      toast({
        title: "Error",
        description: "Wallet client not initialized",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Parse the number of tokens and price
      const numberOfTokens = parseUnits(formData.number_of_tokens, 18);
      const pricePerToken = parseUnits(formData.expected_price, 18);

      console.log('Creating token with params:', {
        name: formData.token_name,
        symbol: formData.token_symbol,
        numberOfTokens: numberOfTokens.toString(),
        pricePerToken: pricePerToken.toString(),
      });

      // First simulate the transaction
      console.log('Simulating createPropertyToken transaction...');
      const { request } = await publicClient.simulateContract({
        address: propertyFactoryAddress,
        abi: propertyFactoryABI,
        functionName: 'createPropertyToken',
        args: [
          formData.token_name,
          formData.token_symbol,
          numberOfTokens,
          pricePerToken,
        ],
        account: address,
      });

      const txHash = await walletClient.writeContract(request);
      console.log('Create token tx hash:', txHash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      console.log('Create token receipt:', receipt);

      if (!receipt.status) {
        throw new Error('Failed to create property token');
      }

      // Find the PropertyTokenCreated event
      const propertyTokenCreatedEvent = receipt.logs.find(log => {
        try {
          const event = decodeEventLog({
            abi: propertyFactoryABI,
            data: log.data,
            topics: log.topics,
          });
          return event.eventName === 'PropertyTokenCreated';
        } catch {
          return false;
        }
      });

      if (!propertyTokenCreatedEvent) {
        throw new Error('PropertyTokenCreated event not found in transaction logs');
      }

      const decodedEvent = decodeEventLog({
        abi: propertyFactoryABI,
        data: propertyTokenCreatedEvent.data,
        topics: propertyTokenCreatedEvent.topics,
      });

      const tokenAddress = (decodedEvent.args as any).token as `0x${string}`;
      console.log('Property token created at:', tokenAddress);

      // Update the database with the token address
      const response = await fetch('/api/property-requests/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          token_address: tokenAddress,
          status: 'funding',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update property request');
      }

      toast({
        title: "Success",
        description: "Property token created successfully",
      });

      // Refresh the page to show the updated status
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating token:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create property token",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleCreateToken} disabled={loading || !isConnected}>
      {loading ? "Creating Token..." : "Create Property Token"}
    </Button>
  );
}
