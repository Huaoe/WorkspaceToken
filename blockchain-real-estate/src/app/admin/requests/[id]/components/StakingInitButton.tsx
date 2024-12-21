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
import { createClientComponentClient } from "@/lib/supabase";

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

      const formData = form.getValues();
      const tokenAddress = formData.token_address;
      console.log('Form data:', formData);
      console.log('Token address:', tokenAddress);

      if (!tokenAddress || tokenAddress === '') {
        toast({
          title: "Error",
          description: "Please create a property token first",
          variant: "destructive",
        });
        return;
      }

      console.log('Initializing staking for token:', tokenAddress);

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
      const rewardsDuration = formData.payout_duration * 24 * 60 * 60; // Convert days to seconds
      const roi = formData.roi;
      
      if (!roi || roi <= 0) {
        throw new Error('Please specify a valid ROI percentage');
      }

      if (!rewardsDuration || rewardsDuration <= 0) {
        throw new Error('Please specify a valid payout duration');
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

      // Get EURC contract
      const eurc = await getEURCContract(true);
      if (!eurc) {
        throw new Error('Failed to get EURC contract');
      }

      // Check EURC allowance
      const allowance = await eurc.allowance(address, await factory.getAddress());
      if (allowance < totalRewards) {
        console.log('Approving EURC spend...');
        const approveTx = await eurc.approve(await factory.getAddress(), totalRewards);
        await approveTx.wait();
        console.log('EURC approved');
      }

      // Initialize staking
      const tx = await factory.initializeStakingRewards(
        tokenAddress,
        EURC_TOKEN_ADDRESS,
        rewardsDuration,
        rewardRate,
        {
          gasLimit: 5000000
        }
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Staking initialized:', receipt.hash);

      // Update database status
      const supabase = createClientComponentClient();
      const { error: dbError } = await supabase
        .from('property_requests')
        .update({ status: 'staking' })
        .eq('id', propertyId);

      if (dbError) {
        console.error('Error updating database:', dbError);
        throw new Error('Failed to update database status');
      }

      toast({
        title: "Success",
        description: "Staking initialized successfully",
      });

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
      disabled={loading}
      variant="outline"
    >
      {loading ? (
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
      ) : null}
      Initialize Staking
    </Button>
  );
}
