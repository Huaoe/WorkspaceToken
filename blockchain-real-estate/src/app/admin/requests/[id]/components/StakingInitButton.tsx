'use client';

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { getStakingFactoryContract as getFactory, getStakingContract, getEURCContract } from "@/lib/ethereum";
import { EURC_TOKEN_ADDRESS, STAKING_FACTORY_ADDRESS } from "@/lib/contracts";
import { formatUnits, parseUnits } from "viem";
import { UseFormReturn } from "react-hook-form";
import { ReloadIcon } from "@radix-ui/react-icons";

interface StakingInitButtonProps {
  propertyTokenAddress: string;
  form: UseFormReturn<any>;
}

export function StakingInitButton({ propertyTokenAddress, form }: StakingInitButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();

  const handleInitialize = async () => {
    if (!address) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your wallet",
      });
      return;
    }

    // Get property token address from form
    const propertyTokenAddress = form.getValues("token_address");
    if (!propertyTokenAddress) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Property token address not found. Please create and approve the token first.",
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log("Using property token address:", propertyTokenAddress);

      // Get contracts
      const factory = await getFactory(true);
      console.log("Got factory contract");
      const eurcContract = await getEURCContract(true);
      console.log("Got EURC contract");

      // Check if caller is factory owner
      const factoryOwner = await factory.owner();
      if (factoryOwner.toLowerCase() !== address.toLowerCase()) {
        throw new Error("Only the factory owner can initialize staking");
      }

      // Check user's EURC balance
      const userBalance = await eurcContract.balanceOf(address);
      console.log("User EURC balance:", formatUnits(userBalance, 6));
      
      // Define reward amount and duration
      const duration = 30 * 24 * 60 * 60; // 30 days in seconds
      const rewardAmount = parseUnits("1000", 6); // 1000 EURC in wei
      
      // Calculate reward rate for display
      const displayRate = Number(formatUnits(rewardAmount, 6)) / duration;
      console.log("Reward setup:");
      console.log("- Amount:", formatUnits(rewardAmount, 6), "EURC");
      console.log("- Duration:", duration, "seconds");
      console.log("- Rate:", displayRate.toFixed(6), "EURC/second");

      // Verify user has enough balance
      if (userBalance < rewardAmount) {
        throw new Error(`Insufficient EURC balance. You have ${formatUnits(userBalance, 6)} EURC but need ${formatUnits(rewardAmount, 6)} EURC`);
      }

      // Check if contract already exists
      const stakingInfo = await factory.stakingContracts(propertyTokenAddress);
      console.log("Staking contract info:", stakingInfo);

      if (stakingInfo.isActive) {
        console.log("Staking contract already exists at:", stakingInfo.contractAddress);
        console.log("Funding with:", formatUnits(rewardAmount, 6), "EURC");
        console.log("Duration:", stakingInfo.duration.toString(), "seconds");
        console.log("Estimated rate:", displayRate.toFixed(6), "EURC/second");

        // First approve factory to spend EURC
        console.log("Approving factory to spend EURC...");
        const factoryApproveTx = await eurcContract.approve(
          STAKING_FACTORY_ADDRESS,
          rewardAmount
        );
        await factoryApproveTx.wait();
        console.log("Factory approved");

        // Then approve staking contract
        console.log("Approving staking contract to spend EURC...");
        const stakingApproveTx = await eurcContract.approve(
          stakingInfo.contractAddress, 
          rewardAmount
        );
        await stakingApproveTx.wait();
        console.log("Staking contract approved");

        // Fund the contract with rewards
        console.log("Funding contract with:", formatUnits(rewardAmount, 6), "EURC");
        const fundTx = await factory.fundStakingContract(
          propertyTokenAddress, 
          rewardAmount
        );
        await fundTx.wait();
        console.log("Contract funded successfully");

        // Update form status
        form.setValue("status", "staking");
        
        toast({
          title: "Success",
          description: "Staking contract has been funded with rewards",
        });
        return;
      }

      // For new contract creation, calculate reward rate in wei
      const rewardRate = rewardAmount / BigInt(duration);
      console.log("Creating new staking contract...");
      console.log("Parameters:");
      console.log("- Property Token:", propertyTokenAddress);
      console.log("- Duration:", duration, "seconds");
      console.log("- Reward Amount:", formatUnits(rewardAmount, 6), "EURC");
      console.log("- Initial Rate:", formatUnits(rewardRate, 6), "EURC/second");

      // First approve factory to spend EURC
      console.log("Approving factory to spend EURC...");
      const factoryApproveTx = await eurcContract.approve(
        STAKING_FACTORY_ADDRESS,
        rewardAmount
      );
      await factoryApproveTx.wait();
      console.log("Factory approved");

      const createTx = await factory.createStakingContract(
        propertyTokenAddress,
        rewardRate,  // Pass reward rate in wei/second
        duration
      );

      console.log("Creation transaction sent:", createTx.hash);
      await createTx.wait();
      console.log("Staking contract created");

      // Get the new contract address
      const newStakingInfo = await factory.stakingContracts(propertyTokenAddress);
      console.log("New staking contract at:", newStakingInfo.contractAddress);

      // First approve EURC transfer
      console.log("Approving EURC transfer...");
      const approveTx = await eurcContract.approve(
        newStakingInfo.contractAddress, 
        rewardAmount
      );
      await approveTx.wait();
      console.log("EURC transfer approved");

      // Fund the contract with rewards
      console.log("Funding contract with:", formatUnits(rewardAmount, 6), "EURC");
      console.log("Contract duration:", newStakingInfo.duration.toString(), "seconds");
      const fundTx = await factory.fundStakingContract(
        propertyTokenAddress, 
        rewardAmount
      );
      await fundTx.wait();
      console.log("Contract funded successfully");

      // Update form status
      form.setValue("status", "staking");
      
      toast({
        title: "Success",
        description: "Staking contract has been created and funded with rewards",
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
      disabled={isLoading || !address || !form.getValues("token_address")}
      variant="outline"
      className="w-full"
    >
      {isLoading ? (
        <>
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          Initializing...
        </>
      ) : (
        "Initialize Staking"
      )}
    </Button>
  );
}
