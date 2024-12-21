'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useWalletEvents } from "@/app/wallet-events-provider";
import { getStakingFactoryContract, getProvider, getSigner, getPropertyTokenContract, getEURCContract } from "@/lib/ethereum";
import { UseFormReturn } from "react-hook-form";
import { ethers } from "ethers";
import { formatUnits, parseUnits } from "viem";
import { EURC_TOKEN_ADDRESS } from "@/lib/constants";

interface StakingInitButtonProps {
  propertyId: string;
  form: UseFormReturn<any>;
}

export function StakingInitButton({ propertyId, form }: StakingInitButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { address, isConnected } = useWalletEvents();

  const handleInitStaking = async () => {
    try {
      setLoading(true);

      if (!isConnected) {
        throw new Error('Please connect your wallet first');
      }

      if (!address) {
        throw new Error('No wallet address available');
      }

      const tokenAddress = form.getValues('token_address');
      if (!tokenAddress) {
        throw new Error('No token address available');
      }

      console.log('Initializing staking for token:', tokenAddress);

      try {
        // Get signer and verify connection
        const signer = await getSigner();
        if (!signer) {
          throw new Error('No signer available');
        }

        // Get factory contract
        const factory = await getStakingFactoryContract(true);
        if (!factory) {
          throw new Error('Failed to get staking factory contract');
        }

        // Verify ownership
        const factoryOwner = await factory.owner();
        if (factoryOwner.toLowerCase() !== address.toLowerCase()) {
          throw new Error('Only the factory owner can initialize staking');
        }

        // Check if staking already exists
        const existingStaking = await factory.hasStakingRewards(tokenAddress);
        if (existingStaking) {
          throw new Error('Staking rewards already exists for this property token');
        }

        // Set staking parameters
        const rewardsDuration = 30 * 24 * 60 * 60; // 30 days in seconds
        const roi = form.getValues('roi');
        if (!roi) {
          throw new Error('No ROI percentage specified');
        }

        // Calculate reward rate based on ROI
        // Base rate is 1 EURC per second (1_000_000 units considering 6 decimals)
        const baseRewardRate = BigInt(1_000_000); // 1 EURC per second
        const rewardRate = (baseRewardRate * BigInt(roi)) / BigInt(100);

        // Calculate total rewards needed
        const totalRewards = rewardRate * BigInt(rewardsDuration);

        console.log('Creating staking with parameters:', {
          tokenAddress,
          rewardsDuration,
          rewardRate: rewardRate.toString(),
          totalRewardsEURC: formatUnits(totalRewards, 6),
          roiPercentage: roi
        });

        // Get the current nonce
        const provider = await getProvider();
        if (!provider) {
          throw new Error('No provider available');
        }
        const nonce = await provider.getTransactionCount(address);

        console.log('Creating staking with parameters:', {
          tokenAddress,
          rewardsDuration,
          rewardRate: rewardRate.toString(),
          totalRewardsEURC: formatUnits(totalRewards, 6),
          roiPercentage: roi,
          nonce
        });

        // Create staking contract
        const tx = await factory.createStakingRewards(
          tokenAddress,
          rewardsDuration,
          rewardRate,
          {
            gasLimit: 3000000, // Set a reasonable gas limit
            nonce // Add the nonce to ensure proper transaction ordering
          }
        );

        console.log('Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        
        // Get staking contract address from event
        const stakingCreatedEvent = receipt.logs.find(
          (log: any) => log.fragment?.name === 'StakingRewardsCreated'
        );

        if (stakingCreatedEvent) {
          const stakingAddress = stakingCreatedEvent.args[1]; // stakingRewards address is the second argument
          console.log('Staking contract deployed at:', stakingAddress);
        }

        toast({
          title: "Success",
          description: "Staking initialized successfully",
        });

        // Update status to staking
        await form.setValue('status', 'staking');
        await form.handleSubmit((values) => {
          console.log('Updating status to staking');
        })();
      } catch (error: any) {
        console.error('Error initializing staking:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to initialize staking",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error initializing staking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to initialize staking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleInitStaking}
      disabled={loading || !isConnected}
    >
      {loading ? (
        <>
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          Initializing Staking...
        </>
      ) : (
        'Initialize Staking'
      )}
    </Button>
  );
}
