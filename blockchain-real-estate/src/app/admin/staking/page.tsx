'use client';

import { useState } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { propertyTokenABI, stakingFactoryABI } from "@/contracts";

export default function AdminStaking() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const handleCreateStaking = async (tokenAddress: string) => {
    if (!walletClient || !isConnected) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
      });
      return;
    }

    try {
      setLoading(true);

      // Get property details to calculate rewards
      const propertyDetails = await publicClient.readContract({
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: "propertyDetails",
      });

      const propertyPrice = propertyDetails[4] as bigint; // Price is at index 4
      
      // Calculate rewards as 8.5% APR of property value
      const rewardsAmount = (propertyPrice * BigInt(85)) / BigInt(1000); // 8.5%
      const rewardsDuration = BigInt(90 * 24 * 60 * 60); // 3 months in seconds

      console.log("Creating staking contract with:", {
        propertyToken: tokenAddress,
        rewardsDuration: rewardsDuration.toString(),
        rewardsAmount: rewardsAmount.toString(),
      });

      const stakingFactoryAddress = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS as `0x${string}`;

      // Deploy staking contract through factory
      const { request: deployRequest } = await publicClient.simulateContract({
        address: stakingFactoryAddress,
        abi: stakingFactoryABI,
        functionName: "createStakingRewards",
        args: [
          tokenAddress,
          rewardsDuration,
          rewardsAmount
        ],
        account: address,
      });

      const deployHash = await walletClient.writeContract(deployRequest);
      console.log("Staking contract deployment hash:", deployHash);

      const deployReceipt = await publicClient.waitForTransactionReceipt({ 
        hash: deployHash,
        timeout: 60_000,
      });

      if (deployReceipt.status !== 'success') {
        throw new Error('Failed to deploy staking contract');
      }

      // Get the newly deployed address
      const newAddress = await publicClient.readContract({
        address: stakingFactoryAddress,
        abi: stakingFactoryABI,
        functionName: "getStakingRewards",
        args: [tokenAddress],
      });

      console.log("New staking contract deployed at:", newAddress);

      toast({
        title: "Success",
        description: "Successfully created staking contract",
      });

      setLoading(false);
    } catch (error: any) {
      console.error("Creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create staking contract",
      });
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Staking Contract Management</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Create Staking Contract</h2>
          <p className="text-sm text-gray-600 mb-4">
            Create a new staking contract for a property token. Only admin can perform this action.
          </p>
          <Button 
            onClick={() => handleCreateStaking("0x79E4D62d828379720db8E0E9511e10e6Bac05351")}
            disabled={loading}
            variant="secondary"
          >
            {loading ? "Creating..." : "Create Staking Contract"}
          </Button>
        </div>
      </div>
    </div>
  );
}
