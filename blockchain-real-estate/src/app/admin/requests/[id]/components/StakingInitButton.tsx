'use client';

import { useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { EURC_TOKEN_ADDRESS, STAKING_FACTORY_ADDRESS, eurcABI, stakingFactoryABI, propertyTokenABI, stakingRewardsV2ABI } from "@/lib/contracts";
import { formatUnits, parseUnits, decodeEventLog, keccak256, toBytes } from "viem";
import { UseFormReturn } from "react-hook-form";
import { ReloadIcon } from "@radix-ui/react-icons";
import { supabase } from "@/lib/supabase";

interface StakingInitButtonProps {
  propertyTokenAddress: string;
  requestId: string;
  form: UseFormReturn<any>;
}

export function StakingInitButton({ propertyTokenAddress, requestId, form }: StakingInitButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const handleInitialize = async () => {
    if (!address || !walletClient) {
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

      // Get EURC decimals
      const eurcDecimals = await publicClient.readContract({
        address: EURC_TOKEN_ADDRESS as `0x${string}`,
        abi: eurcABI,
        functionName: "decimals",
      });

      console.log("EURC decimals:", eurcDecimals);

      // Validate factory address
      console.log("\nValidating factory contract...");
      const factoryCode = await publicClient.getBytecode({
        address: STAKING_FACTORY_ADDRESS as `0x${string}`,
      });

      if (!factoryCode || factoryCode === "0x") {
        throw new Error(`Factory contract not found at ${STAKING_FACTORY_ADDRESS}`);
      }

      // Check if it's a proxy by looking for the implementation slot
      const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
      const implementationAddress = await publicClient.getStorageAt({
        address: STAKING_FACTORY_ADDRESS as `0x${string}`,
        slot: implementationSlot as `0x${string}`,
      });

      // Format the implementation address (remove leading zeros)
      const formattedImplementation = implementationAddress ? 
        `0x${implementationAddress.slice(-40)}` : 
        "Not a proxy";

      // Get implementation bytecode if it's a proxy
      let implementationCode;
      if (formattedImplementation !== "Not a proxy") {
        implementationCode = await publicClient.getBytecode({
          address: formattedImplementation as `0x${string}`,
        });
      }

      console.log("Factory contract validation:");
      console.log("- Contract exists:", !!factoryCode);
      console.log("- Proxy bytecode length:", factoryCode.length);
      console.log("- Implementation address:", formattedImplementation);
      console.log("- Implementation bytecode length:", implementationCode?.length || "N/A");

      // Verify factory ownership
      const factoryOwner = await publicClient.readContract({
        address: STAKING_FACTORY_ADDRESS as `0x${string}`,
        abi: stakingFactoryABI,
        functionName: "owner",
      });

      console.log("- Owner:", factoryOwner);
      console.log("- Current account:", address);
      console.log("- Is owner:", factoryOwner.toLowerCase() === address?.toLowerCase());

      if (factoryOwner.toLowerCase() !== address?.toLowerCase()) {
        throw new Error("Only the factory owner can create staking contracts");
      }

      // Get staking implementation address
      const stakingImpl = await publicClient.readContract({
        address: STAKING_FACTORY_ADDRESS as `0x${string}`,
        abi: stakingFactoryABI,
        functionName: "stakingImplementation",
      });

      console.log("\nStaking implementation:");
      console.log("- Address:", stakingImpl);

      // Validate staking implementation
      const stakingImplCode = await publicClient.getBytecode({
        address: stakingImpl as `0x${string}`,
      });

      console.log("- Has bytecode:", !!stakingImplCode);
      console.log("- Bytecode length:", stakingImplCode?.length || 0);

      if (!stakingImplCode || stakingImplCode === "0x") {
        throw new Error("Staking implementation contract not found");
      }

      // Check if we're the owner
      const owner = await publicClient.readContract({
        address: STAKING_FACTORY_ADDRESS as `0x${string}`,
        abi: stakingFactoryABI,
        functionName: "owner",
      });

      console.log("\nStaking Factory ownership:");
      console.log("- Contract owner:", owner);
      console.log("- Current account:", address);

      if (owner.toLowerCase() !== address?.toLowerCase()) {
        throw new Error("Only the contract owner can create staking contracts");
      }

      // Check if staking contract already exists
      const stakingInfo: {
        contractAddress: string;
        rewardRate: bigint;
        duration: bigint;
        isActive: boolean;
      } = await publicClient.readContract({
        address: STAKING_FACTORY_ADDRESS as `0x${string}`,
        abi: stakingFactoryABI,
        functionName: "stakingContracts",
        args: [propertyTokenAddress],
      });

      console.log("\nExisting staking contract info:");
      console.log("- Contract address:", stakingInfo.contractAddress);
      console.log("- Reward rate:", stakingInfo.rewardRate.toString());
      console.log("- Duration:", stakingInfo.duration.toString());
      console.log("- Is active:", stakingInfo.isActive);

      if (stakingInfo.isActive) {
        throw new Error(`A staking contract already exists for this property token at ${stakingInfo.contractAddress}`);
      }

      // Get total supply of property tokens
      const totalSupply = await publicClient.readContract({
        address: propertyTokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: "totalSupply",
      });

      // Get property details to get the price
      const [title, description, location, imageUrl, price, isActive] = await publicClient.readContract({
        address: propertyTokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: "propertyDetails",
      });

      // Price is already in EURC (with decimals)
      const scaledPrice = price;

      console.log("\nRaw input values:");
      console.log("- Total supply:", totalSupply.toString(), "(18 decimals)");
      console.log("- Price:", price.toString(), `(${eurcDecimals} decimals)`);

      // Calculate total value in EURC
      // 1. Convert total supply to base units
      const totalSupplyBase = totalSupply / BigInt(1e18);
      // 2. Calculate total value (price is already in EURC with decimals)
      const totalValueInEurc = totalSupplyBase * scaledPrice;

      console.log("\nTotal value calculation:");
      console.log("- Total supply base:", totalSupplyBase.toString(), "tokens");
      console.log("- Total value:", totalValueInEurc.toString(), `(${eurcDecimals} decimals)`);
      console.log("- Total value (formatted):", formatUnits(totalValueInEurc, eurcDecimals), "EURC");

      // Calculate reward amount and duration
      const APR = 0.085; // 8.5%
      const SECONDS_PER_YEAR = 365n * 24n * 60n * 60n; // seconds in a year
      const duration = 30n * 24n * 60n * 60n; // 30 days in seconds

      // Calculate yearly reward (scaled to EURC decimals)
      const yearlyReward = (totalValueInEurc * BigInt(Math.floor(APR * 1e6))) / BigInt(1e6);
      
      // Calculate 30-day reward amount
      const totalRewardAmount = (yearlyReward * duration) / SECONDS_PER_YEAR;
      
      // Calculate per-second reward rate
      // We need to ensure this is in EURC decimals (6)
      const rewardRate = totalRewardAmount / duration;

      // Convert to human readable for logging
      const yearlyRewardHuman = Number(formatUnits(yearlyReward, eurcDecimals));
      const totalRewardAmountHuman = Number(formatUnits(totalRewardAmount, eurcDecimals));
      const rewardRateHuman = Number(formatUnits(rewardRate, eurcDecimals));

      console.log("\nReward calculations:");
      console.log("- Property value:", formatUnits(totalValueInEurc, eurcDecimals), "EURC");
      console.log("- APR:", APR * 100, "%");
      console.log("- Yearly reward:", yearlyRewardHuman, "EURC");
      console.log("- 30-day reward:", totalRewardAmountHuman, "EURC");
      console.log("- Per-second rate:", rewardRateHuman, "EURC/second");

      // Calculate total rewards needed (this is what we need to approve)
      const totalRewardsNeeded = rewardRate * BigInt(duration) * totalSupplyBase;
      console.log("\nReward calculation check:");
      console.log("- Reward rate (raw):", rewardRate.toString());
      console.log("- Reward rate (formatted):", formatUnits(rewardRate, 6), "EURC/second");
      console.log("- Duration:", duration, "seconds");
      console.log("- Total rewards needed (raw):", totalRewardsNeeded.toString());
      console.log("- Total rewards needed (formatted):", formatUnits(totalRewardsNeeded, 6), "EURC");

      // Approve EURC spending
      console.log("\nApproving EURC spending:");
      console.log("- Amount (raw):", totalRewardsNeeded.toString());
      console.log("- Amount (formatted):", formatUnits(totalRewardsNeeded, 6), "EURC");
      console.log("- Spender:", STAKING_FACTORY_ADDRESS);

      const approveTx = await walletClient.writeContract({
        address: EURC_TOKEN_ADDRESS as `0x${string}`,
        abi: eurcABI,
        functionName: "approve",
        args: [STAKING_FACTORY_ADDRESS, totalRewardsNeeded],
        account: address,
      });

      console.log("Waiting for approval transaction...");
      const approveReceipt = await publicClient.waitForTransactionReceipt({ 
        hash: approveTx,
        timeout: 30_000,
      });

      console.log("EURC approval complete:", {
        txHash: approveReceipt.transactionHash,
        status: approveReceipt.status,
      });

      // Verify new allowance
      const newAllowance = await publicClient.readContract({
        address: EURC_TOKEN_ADDRESS as `0x${string}`,
        abi: eurcABI,
        functionName: "allowance",
        args: [address, STAKING_FACTORY_ADDRESS],
      });

      console.log("New allowance (raw):", newAllowance.toString());
      console.log("New allowance (formatted):", formatUnits(newAllowance, 6), "EURC");

      if (newAllowance < totalRewardsNeeded) {
        throw new Error("Approval failed - allowance is still too low");
      }

      // Create staking contract
      console.log("\nCreating staking contract...");
      const createTx = await walletClient.writeContract({
        address: STAKING_FACTORY_ADDRESS as `0x${string}`,
        abi: stakingFactoryABI,
        functionName: "createStakingContract",
        args: [propertyTokenAddress, rewardRate, duration],
        account: address,
      });

      console.log("Transaction sent:", createTx);

      // Wait for the transaction with a longer timeout and more retries
      console.log("Waiting for transaction receipt...");
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: createTx,
        timeout: 60_000,
        retryCount: 5,
        pollingInterval: 1000,
      });

      console.log("Transaction mined! Receipt:", {
        status: receipt.status,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString(),
      });

      // Query the contract directly to get the staking contract address
      const stakingContractInfo = await publicClient.readContract({
        address: STAKING_FACTORY_ADDRESS as `0x${string}`,
        abi: stakingFactoryABI,
        functionName: "stakingContracts",
        args: [propertyTokenAddress],
      });

      console.log("Staking contract info:", stakingContractInfo);
      const stakingContractAddress = stakingContractInfo.contractAddress;

      if (stakingContractAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error("Failed to create staking contract - address is zero");
      }

      // Verify reward rate was set correctly
      const currentRewardRate = await publicClient.readContract({
        address: stakingContractAddress as `0x${string}`,
        abi: stakingRewardsV2ABI,
        functionName: "rewardRate",
      });

      console.log("\nReward rate verification:");
      console.log("- Current rate:", formatUnits(currentRewardRate, 6), "EURC/second");
      console.log("- Expected rate:", formatUnits(rewardRate, 6), "EURC/second");

      if (currentRewardRate !== rewardRate) {
        throw new Error("Reward rate was not set correctly by factory");
      }

      // Now fund the staking contract
      console.log("\nFunding staking contract...");
      const fundTx = await walletClient.writeContract({
        address: EURC_TOKEN_ADDRESS as `0x${string}`,
        abi: eurcABI,
        functionName: "transfer",
        args: [stakingContractAddress, totalRewardsNeeded],
        account: address,
      });

      console.log("Waiting for funding transaction...");
      await publicClient.waitForTransactionReceipt({ 
        hash: fundTx,
        timeout: 30_000,
      });

      console.log("Staking contract funded!");
      setIsLoading(false);
      toast({
        title: "Success",
        description: "Staking contract created and funded successfully!",
      });

      return stakingContractAddress;
    } catch (error: any) {
      console.error("Error creating staking contract:", error);
      if (error.cause?.data?.message) {
        console.error("Error message:", error.cause.data.message);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleInitialize} disabled={isLoading}>
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
