'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { useToast } from "@/components/ui/use-toast";
import { ReloadIcon } from "@radix-ui/react-icons";
import { getStakingFactoryContract, getEURCContract } from "@/lib/ethereum";
import { parseUnits, formatUnits } from "ethers";

interface StakingFundButtonProps {
  propertyTokenAddress: string;
}

export function StakingFundButton({ propertyTokenAddress }: StakingFundButtonProps) {
  const { isConnected, address } = useAccount();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleFundStaking = async () => {
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
      // Get factory and EURC contracts
      const factory = await getStakingFactoryContract(true);
      const eurcToken = await getEURCContract(true);
      
      if (!factory || !eurcToken) {
        throw new Error('Failed to get contracts');
      }

      // Check if caller is the owner
      const owner = await factory.owner();
      if (owner.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Only the contract owner can fund staking contracts');
      }

      // Calculate funding amount (e.g., 1000 EURC)
      const fundingAmount = parseUnits("1000", 6); // EURC has 6 decimals

      // First approve EURC transfer
      console.log('Approving EURC transfer...');
      const approveTx = await eurcToken.approve(
        await factory.getAddress(),
        fundingAmount
      );
      await approveTx.wait();
      console.log('EURC transfer approved');

      // Fund the staking contract
      console.log('Funding staking contract...');
      const fundTx = await factory.fundStakingContract(
        propertyTokenAddress,
        fundingAmount
      );
      
      const receipt = await fundTx.wait();
      console.log('Staking contract funded in block:', receipt.blockNumber);

      toast({
        title: "Success",
        description: `Staking contract funded with ${formatUnits(fundingAmount, 6)} EURC`,
      });

    } catch (error: any) {
      console.error('Error funding staking contract:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fund staking contract",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleFundStaking}
      disabled={loading || !isConnected}
    >
      {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
      Fund Staking Contract
    </Button>
  );
}
