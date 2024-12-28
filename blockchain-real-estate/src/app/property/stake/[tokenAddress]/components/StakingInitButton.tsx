import { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { stakingFactoryV2ABI } from "@/lib/contracts";
import { formatUnits, parseUnits } from "viem";

export function StakingInitButton({ stakingContractAddress }: { stakingContractAddress: string }) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleInitialize = async () => {
    if (!address || !walletClient || !publicClient) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your wallet",
      });
      return;
    }

    try {
      setIsLoading(true);

      const factoryAddress = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
      if (!factoryAddress) throw new Error("Staking factory address not configured");

      // Get factory owner
      const factoryOwner = await publicClient.readContract({
        address: factoryAddress as `0x${string}`,
        abi: stakingFactoryV2ABI,
        functionName: "owner",
      });

      // Check if caller is factory owner
      if (factoryOwner.toLowerCase() !== address.toLowerCase()) {
        throw new Error("Only the factory owner can initialize staking");
      }

      // Set parameters
      const duration = BigInt(30 * 24 * 60 * 60); // 30 days in seconds
      const rewardRate = parseUnits("0.000385", 6); // Approximately 1000 EURC over 30 days

      console.log("Creating staking contract...");
      console.log("Parameters:");
      console.log("- Property Token:", stakingContractAddress);
      console.log("- Duration:", duration.toString(), "seconds");
      console.log("- Reward Rate:", formatUnits(rewardRate, 6), "EURC/second");

      // Create staking contract through factory
      const { request } = await publicClient.simulateContract({
        account: address,
        address: factoryAddress as `0x${string}`,
        abi: stakingFactoryV2ABI,
        functionName: "createStakingContract",
        args: [stakingContractAddress, rewardRate, duration],
      });

      const hash = await walletClient.writeContract(request);
      console.log("Creation transaction sent:", hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      // Get the created staking contract address from the event
      const event = receipt.logs.find(log => {
        try {
          const decoded = publicClient.decodeEventLog({
            abi: stakingFactoryV2ABI,
            data: log.data,
            topics: log.topics,
          });
          return decoded.eventName === "StakingContractCreated";
        } catch {
          return false;
        }
      });
      
      if (!event) {
        throw new Error("Could not find StakingContractCreated event");
      }

      const decoded = publicClient.decodeEventLog({
        abi: stakingFactoryV2ABI,
        data: event.data,
        topics: event.topics,
      });

      const newStakingAddress = decoded.args.stakingContract;
      console.log("New staking contract created at:", newStakingAddress);

      // Fund the contract with initial rewards (1000 EURC)
      const rewardAmount = parseUnits("1000", 6);
      console.log("Funding contract with:", formatUnits(rewardAmount, 6), "EURC");
      
      const { request: fundRequest } = await publicClient.simulateContract({
        account: address,
        address: factoryAddress as `0x${string}`,
        abi: stakingFactoryV2ABI,
        functionName: "fundStakingContract",
        args: [stakingContractAddress, rewardAmount],
      });

      const fundHash = await walletClient.writeContract(fundRequest);
      console.log("Funding transaction sent:", fundHash);
      await publicClient.waitForTransactionReceipt({ hash: fundHash });
      console.log("Contract funded successfully");

      toast({
        title: "Success",
        description: "Staking contract has been created and funded",
      });
    } catch (error: any) {
      console.error("Error initializing staking contract:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to initialize staking contract",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleInitialize}
      disabled={isLoading}
      variant="outline"
      className="w-full"
    >
      {isLoading ? "Initializing..." : "Initialize Staking"}
    </Button>
  );
}
