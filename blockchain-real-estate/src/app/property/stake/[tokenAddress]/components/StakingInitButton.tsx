'use client';

import { useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { stakingFactoryV2ABI, stakingRewardsV2ABI, propertyTokenABI, whitelistABI } from "@/lib/contracts";
import { formatUnits, parseUnits } from "viem";
import { Spinner } from "@/components/ui/spinner";

interface StakingInitButtonProps {
  propertyToken: `0x${string}`;
  stakingAddress: string | null;
  onStakingContractCreated?: () => void;
}

export function StakingInitButton({ propertyToken, stakingAddress, onStakingContractCreated }: StakingInitButtonProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleStake = async () => {
    if (!address || !walletClient || !publicClient || !stakingAddress) {
      toast({
        title: "Error",
        description: "Please connect your wallet and try again",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Check token balance first
      const userBalance = await publicClient.readContract({
        address: propertyToken,
        abi: propertyTokenABI,
        functionName: "balanceOf",
        args: [address],
      });

      const amountToStake = parseUnits("2", 18); // 2 tokens

      console.log("Token balance state:");
      console.log("- Current balance:", formatUnits(userBalance, 18), "tokens");
      console.log("- Amount to stake:", formatUnits(amountToStake, 18), "tokens");

      if (userBalance < amountToStake) {
        throw new Error(`Insufficient token balance. You have ${formatUnits(userBalance, 18)} tokens but trying to stake ${formatUnits(amountToStake, 18)} tokens`);
      }

      // Check if staking is active and reward rate is set
      const finishAt = await publicClient.readContract({
        address: stakingAddress,
        abi: stakingRewardsV2ABI,
        functionName: "finishAt",
      });

      const rewardRate = await publicClient.readContract({
        address: stakingAddress,
        abi: stakingRewardsV2ABI,
        functionName: "rewardRate",
      });

      const currentTime = Math.floor(Date.now() / 1000);

      console.log("Staking state:");
      console.log("- Finish time:", new Date(Number(finishAt) * 1000).toLocaleString());
      console.log("- Current time:", new Date(currentTime * 1000).toLocaleString());
      console.log("- Reward rate:", rewardRate);

      if (Number(finishAt) <= currentTime) {
        throw new Error("Staking period has ended");
      }

      if (rewardRate === 0n) {
        throw new Error("Reward rate not set");
      }

      // Check property status
      const propertyDetails = await publicClient.readContract({
        address: propertyToken,
        abi: propertyTokenABI,
        functionName: "propertyDetails",
      }) as { title: string; description: string; location: string; imageUrl: string; price: bigint; isActive: boolean };

      console.log("Property state:");
      console.log("- Is active:", propertyDetails.isActive);

      if (!propertyDetails.isActive) {
        throw new Error("Property is not active. Please contact the property owner to activate it.");
      }

      // Check whitelist status for property token
      const whitelistAddress = await publicClient.readContract({
        address: propertyToken,
        abi: propertyTokenABI,
        functionName: "whitelistContract",
      }) as `0x${string}`;

      console.log("Whitelist state:");
      console.log("- Whitelist contract:", whitelistAddress);

      // Check whitelist status for user and staking contract
      const [isUserWhitelisted, isStakingWhitelisted, whitelistOwner] = await Promise.all([
        publicClient.readContract({
          address: whitelistAddress,
          abi: whitelistABI,
          functionName: "isWhitelisted",
          args: [address],
        }),
        publicClient.readContract({
          address: whitelistAddress,
          abi: whitelistABI,
          functionName: "isWhitelisted",
          args: [stakingAddress],
        }),
        publicClient.readContract({
          address: whitelistAddress,
          abi: whitelistABI,
          functionName: "owner",
        }),
      ]);

      console.log("- User address:", address);
      console.log("- User whitelisted:", isUserWhitelisted);
      console.log("- Staking contract whitelisted:", isStakingWhitelisted);
      console.log("- Whitelist owner:", whitelistOwner);

      if (!isUserWhitelisted) {
        // If user is not whitelisted, add them to whitelist
        console.log("Adding user to whitelist...");
        const { request: whitelistRequest } = await publicClient.simulateContract({
          address: whitelistAddress,
          abi: whitelistABI,
          functionName: "addToWhitelist",
          args: [address],
          account: address,
        });

        const whitelistTx = await walletClient.writeContract(whitelistRequest);
        await publicClient.waitForTransactionReceipt({ hash: whitelistTx });
        console.log("User added to whitelist");
      }

      if (!isStakingWhitelisted) {
        // If staking contract is not whitelisted, whitelist it first
        console.log("Whitelisting staking contract...");
        const { request: whitelistRequest } = await publicClient.simulateContract({
          address: whitelistAddress,
          abi: whitelistABI,
          functionName: "addToWhitelist",
          args: [stakingAddress],
          account: address,
        });

        const whitelistTx = await walletClient.writeContract(whitelistRequest);
        await publicClient.waitForTransactionReceipt({ hash: whitelistTx });
        console.log("Staking contract whitelisted");
      }

      // Double check whitelist status after potential additions
      const [finalUserWhitelisted, finalStakingWhitelisted] = await Promise.all([
        publicClient.readContract({
          address: whitelistAddress,
          abi: whitelistABI,
          functionName: "isWhitelisted",
          args: [address],
        }),
        publicClient.readContract({
          address: whitelistAddress,
          abi: whitelistABI,
          functionName: "isWhitelisted",
          args: [stakingAddress],
        }),
      ]);

      console.log("Final whitelist state:");
      console.log("- User whitelisted:", finalUserWhitelisted);
      console.log("- Staking contract whitelisted:", finalStakingWhitelisted);

      // Check token approval
      const currentAllowance = await publicClient.readContract({
        address: propertyToken,
        abi: propertyTokenABI,
        functionName: "allowance",
        args: [address, stakingAddress],
      });

      console.log("Token approval state:");
      console.log("- Current allowance:", formatUnits(currentAllowance, 18), "tokens");
      console.log("- Required allowance:", formatUnits(amountToStake, 18), "tokens");

      // Approve tokens if needed
      if (currentAllowance < amountToStake) {
        console.log("Approving tokens for staking...");
        try {
          const { request: approveRequest } = await publicClient.simulateContract({
            address: propertyToken,
            abi: propertyTokenABI,
            functionName: "approve",
            args: [stakingAddress, amountToStake],
            account: address,
          });

          const approveTx = await walletClient.writeContract(approveRequest);
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
          console.log("Tokens approved");
        } catch (error: any) {
          console.error("Approval error:", error);
          if (error.message.includes("PropertyInactive")) {
            throw new Error("Property is not active. Please contact the property owner to activate it.");
          } else if (error.message.includes("NotWhitelisted")) {
            throw new Error("You must be whitelisted to approve tokens. Please try again.");
          } else {
            throw error;
          }
        }
      }

      // Execute staking transaction
      console.log("Staking tokens...");
      const { request: stakeRequest } = await publicClient.simulateContract({
        address: stakingAddress,
        abi: stakingRewardsV2ABI,
        functionName: "stake",
        args: [amountToStake],
        account: address,
      });

      const stakeTx = await walletClient.writeContract(stakeRequest);
      const stakeReceipt = await publicClient.waitForTransactionReceipt({ hash: stakeTx });
      console.log("Staking complete:", stakeReceipt);

      toast({
        title: "Success",
        description: `Successfully staked ${formatUnits(amountToStake, 18)} tokens`,
      });

      if (onStakingContractCreated) {
        onStakingContractCreated();
      }
    } catch (error: any) {
      console.error("Staking error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to stake tokens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleStake} disabled={loading}>
      {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
      {loading ? "Staking..." : "Stake Tokens"}
    </Button>
  );
}
