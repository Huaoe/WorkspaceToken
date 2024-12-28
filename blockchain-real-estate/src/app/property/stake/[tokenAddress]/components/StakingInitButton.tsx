import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { getStakingContract, getPropertyFactoryContract } from "@/lib/contracts";
import { EURC_TOKEN_ADDRESS } from "@/lib/constants";
import { formatUnits, parseUnits } from "ethers";

export function StakingInitButton({ stakingContractAddress }: { stakingContractAddress: string }) {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  const handleInitialize = async () => {
    if (!address) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your wallet",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Get factory contract to check ownership
      const factory = await getPropertyFactoryContract();
      const factoryOwner = await factory.owner();

      // Check if caller is factory owner
      if (factoryOwner.toLowerCase() !== address.toLowerCase()) {
        throw new Error("Only the factory owner can initialize staking");
      }

      // Set parameters
      const duration = 30 * 24 * 60 * 60; // 30 days in seconds
      const rewardRate = parseUnits("0.000385", 6); // Approximately 1000 EURC over 30 days

      console.log("Creating staking contract...");
      console.log("Parameters:");
      console.log("- Property Token:", stakingContractAddress);
      console.log("- Duration:", duration, "seconds");
      console.log("- Reward Rate:", formatUnits(rewardRate, 6), "EURC/second");

      // Create staking contract through factory
      const createTx = await factory.createStakingContract(
        stakingContractAddress,
        rewardRate,
        duration
      );

      console.log("Creation transaction sent:", createTx.hash);
      const receipt = await createTx.wait();
      
      // Get the created staking contract address from the event
      const event = receipt.logs.find(
        (log: any) => log.fragment?.name === "StakingContractCreated"
      );
      
      if (!event) {
        throw new Error("Could not find StakingContractCreated event");
      }

      const newStakingAddress = event.args.stakingContract;
      console.log("New staking contract created at:", newStakingAddress);

      // Fund the contract with initial rewards (1000 EURC)
      const rewardAmount = parseUnits("1000", 6);
      console.log("Funding contract with:", formatUnits(rewardAmount, 6), "EURC");
      
      const fundTx = await factory.fundStakingContract(stakingContractAddress, rewardAmount);
      console.log("Funding transaction sent:", fundTx.hash);
      await fundTx.wait();
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
