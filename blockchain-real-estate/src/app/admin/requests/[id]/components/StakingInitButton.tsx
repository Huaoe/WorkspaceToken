'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { useToast } from "@/components/ui/use-toast";
import { ReloadIcon } from "@radix-ui/react-icons";
import { getStakingFactoryContract, getPropertyTokenContract, getEURCContract, getProvider, getSigner } from "@/lib/ethereum";
import { UseFormReturn } from "react-hook-form";
import { parseUnits, formatUnits } from "viem";

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

      // Get signer and initial nonce
      const signer = await getSigner();
      if (!signer) {
        throw new Error('No signer available');
      }
      let currentNonce = await signer.getNonce();
      console.log('Starting staking initialization with nonce:', currentNonce);

      // Get factory contract
      const factory = await getStakingFactoryContract(true);
      if (!factory) {
        throw new Error('Failed to get staking factory contract');
      }

      // Verify ownership
      const factoryOwner = await factory.owner();
      if (factoryOwner.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Only factory owner can initialize staking');
      }

      // Check if staking exists
      // const stakingInfo = await factory.stakingContracts(tokenAddress);
      // console.log('Staking info for token:', tokenAddress, stakingInfo);
      // if (stakingInfo.contractAddress !== '0x0000000000000000000000000000000000000000') {
      //   throw new Error('Staking already exists for this token');
      // }

      // Set staking parameters (from test file)
      const rewardsDuration = 365 * 24 * 60 * 60; // 1 year in seconds
      const rewardAmount = parseUnits("1", 18); // 1 EURC per year

      console.log('Creating staking contract with params:', {
        tokenAddress,
        rewardAmount: formatUnits(rewardAmount, 18),
        rewardsDuration,
        nonce: currentNonce,
      });

      // Create staking contract
      const tx = await factory.createStakingContract(
        tokenAddress,
        rewardAmount,
        rewardsDuration,
        {
          gasLimit: BigInt(5000000),
          nonce: currentNonce,
        }
      );
      
      console.log('Staking contract creation transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Staking contract creation confirmed in block:', receipt.blockNumber);

      // Get the new staking contract address from the event
      const stakingContractCreatedEvent = receipt.logs.find(
        (log: any) => log.fragment?.name === 'StakingContractCreated'
      );
      
      if (stakingContractCreatedEvent) {
        const stakingContractAddress = stakingContractCreatedEvent.args?.stakingContract;
        console.log('New staking contract deployed at:', stakingContractAddress);
      }
      
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
