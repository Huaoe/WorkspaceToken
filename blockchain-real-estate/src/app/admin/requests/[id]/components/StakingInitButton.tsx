'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { useToast } from "@/components/ui/use-toast";
import { ReloadIcon } from "@radix-ui/react-icons";
import { getStakingFactoryContract, getPropertyTokenContract, getEURCContract, getProvider } from "@/lib/ethereum";
import { UseFormReturn } from "react-hook-form";

interface StakingInitButtonProps {
  propertyId: string;
  form: UseFormReturn<any>;
}

export function StakingInitButton({ propertyId, form }: StakingInitButtonProps) {
  const { isConnected, address } = useAccount();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleInitStaking = async () => {
    if (!isConnected || !address) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Get token address from form
      const tokenAddress = form.getValues('token_address');
      if (!tokenAddress) {
        throw new Error('No token address available');
      }

      // Get contract instances with signer
      const factory = await getStakingFactoryContract(true);
      
      // Verify ownership
      const factoryOwner = await factory.owner();
      if (factoryOwner.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Only factory owner can initialize staking');
      }

      // Check if staking exists
      const stakingInfo = await factory.stakingContracts(tokenAddress);
      if (stakingInfo.contractAddress !== '0x0000000000000000000000000000000000000000') {
        throw new Error('Staking already exists for this token');
      }

      // Set staking parameters (from test file)
      const rewardsDuration = 365 * 24 * 60 * 60; // 1 year in seconds
      const rewardRate = 1000000000n; // 1 billion units per second
      const rewardsAmount = rewardRate * BigInt(rewardsDuration); // Total rewards needed

      // Create staking contract
      const createTx = await factory.createStakingContract(
        tokenAddress,
        rewardRate,
        rewardsDuration,
        { 
          gasLimit: 5000000 // Safe gas limit
        }
      );
      
      await createTx.wait();
      
      // Update form status
      form.setValue('status', 'staking');
      
      toast({
        title: "Success",
        description: "Staking initialized successfully"
      });

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to initialize staking",
        variant: "destructive"
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
      {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
      Initialize Staking
    </Button>
  );
}
