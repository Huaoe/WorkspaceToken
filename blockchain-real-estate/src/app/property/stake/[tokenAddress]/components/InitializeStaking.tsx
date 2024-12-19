'use client';

import { useState } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { propertyTokenABI, stakingRewardsABI } from "@/contracts";
import { type Abi } from 'viem';

interface InitializeStakingProps {
  stakingAddress: string;
  tokenAddress: string;
}

export function InitializeStaking({ stakingAddress, tokenAddress }: InitializeStakingProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const handleInitialize = async () => {
    if (!walletClient || !isConnected) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
      });
      return;
    }

    try {
      setLoading(true);

      // Get EURC token address from property token
      const eurcTokenAddress = await publicClient.readContract({
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: "getEURCToken",
      });

      console.log("EURC token address:", eurcTokenAddress);

      // Calculate rewards parameters
      const rewardsDuration = BigInt(365 * 24 * 60 * 60); // 1 year in seconds
      const rewardsAmount = BigInt(1000) * BigInt(10 ** 6); // 1000 EURC (6 decimals)

      // First approve EURC transfer
      const { request: approveRequest } = await publicClient.simulateContract({
        address: eurcTokenAddress,
        abi: propertyTokenABI,
        functionName: "approve",
        args: [stakingAddress, rewardsAmount],
        account: address,
      });

      const approveHash = await walletClient.writeContract(approveRequest);
      console.log("EURC approval hash:", approveHash);

      const approveReceipt = await publicClient.waitForTransactionReceipt({ 
        hash: approveHash,
        timeout: 60_000,
      });

      if (approveReceipt.status !== 'success') {
        throw new Error('EURC approval failed');
      }

      // Set rewards duration
      const { request: durationRequest } = await publicClient.simulateContract({
        address: stakingAddress,
        abi: stakingRewardsABI,
        functionName: "setRewardsDuration",
        args: [rewardsDuration],
        account: address,
      });

      const durationHash = await walletClient.writeContract(durationRequest);
      console.log("Set duration hash:", durationHash);

      const durationReceipt = await publicClient.waitForTransactionReceipt({ 
        hash: durationHash,
        timeout: 60_000,
      });

      if (durationReceipt.status !== 'success') {
        throw new Error('Failed to set rewards duration');
      }

      // Notify reward amount
      const { request: notifyRequest } = await publicClient.simulateContract({
        address: stakingAddress,
        abi: stakingRewardsABI,
        functionName: "notifyRewardAmount",
        args: [rewardsAmount],
        account: address,
      });

      const notifyHash = await walletClient.writeContract(notifyRequest);
      console.log("Notify rewards hash:", notifyHash);

      const notifyReceipt = await publicClient.waitForTransactionReceipt({ 
        hash: notifyHash,
        timeout: 60_000,
      });

      if (notifyReceipt.status !== 'success') {
        throw new Error('Failed to notify reward amount');
      }

      toast({
        title: "Success",
        description: "Successfully initialized staking rewards",
      });

      setLoading(false);
    } catch (error: any) {
      console.error("Initialization error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to initialize staking rewards",
      });
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleInitialize}
      disabled={loading}
      variant="secondary"
    >
      {loading ? "Initializing..." : "Initialize Staking Rewards"}
    </Button>
  );
}
