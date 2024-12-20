'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useWalletEvents } from "@/app/wallet-events-provider";
import { getPropertyTokenContract, getStakingRewardsContract } from "@/lib/ethereum";

interface InitializeStakingProps {
  stakingAddress: string;
  tokenAddress: string;
}

export function InitializeStaking({ stakingAddress, tokenAddress }: InitializeStakingProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { address, isConnected } = useWalletEvents();

  const handleInitialize = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
      });
      return;
    }

    try {
      setLoading(true);

      // Get EURC token address from property token
      const propertyToken = getPropertyTokenContract(tokenAddress);
      const eurcTokenAddress = await propertyToken.getEURCToken();
      console.log("EURC token address:", eurcTokenAddress);

      // Calculate rewards parameters
      const rewardsDuration = BigInt(365 * 24 * 60 * 60); // 1 year in seconds
      const rewardsAmount = BigInt(1000) * BigInt(10 ** 6); // 1000 EURC (6 decimals)

      // Get contract instances
      const stakingContract = getStakingRewardsContract(stakingAddress);
      const eurcToken = getPropertyTokenContract(eurcTokenAddress);

      // First approve EURC transfer
      const approveTx = await eurcToken.approve(stakingAddress, rewardsAmount);
      console.log("EURC approval transaction:", approveTx.hash);
      const approveReceipt = await approveTx.wait();

      if (approveReceipt.status === 1) {
        toast({
          title: "✨ EURC Approved! ✨",
          description: "Successfully approved EURC tokens for staking rewards 🎉",
        });
      } else {
        throw new Error('EURC approval failed');
      }

      // Set rewards duration
      const durationTx = await stakingContract.setRewardsDuration(rewardsDuration);
      console.log("Set duration transaction:", durationTx.hash);
      const durationReceipt = await durationTx.wait();

      if (durationReceipt.status === 1) {
        toast({
          title: "⏳ Duration Set! ⌛",
          description: "Successfully configured staking duration 🎯",
        });
      } else {
        throw new Error('Failed to set rewards duration');
      }

      // Notify reward amount
      const notifyTx = await stakingContract.notifyRewardAmount(rewardsAmount);
      console.log("Notify rewards transaction:", notifyTx.hash);
      const notifyReceipt = await notifyTx.wait();

      if (notifyReceipt.status === 1) {
        toast({
          title: "💎 Rewards Ready! 💎",
          description: "Successfully configured staking rewards 🌟",
        });
      } else {
        throw new Error('Failed to notify reward amount');
      }

      toast({
        title: "🎊 Staking Initialized! 🎊",
        description: `
          ✨ Your property is ready for staking! ✨
          💫 Start staking to earn rewards! 💫
        `,
      });
    } catch (error: any) {
      console.error("Initialization error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to initialize staking rewards",
      });
    } finally {
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
