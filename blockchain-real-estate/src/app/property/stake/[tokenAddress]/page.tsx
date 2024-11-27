'use client';

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useContractRead, useContractWrite } from "wagmi";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { propertyTokenABI } from "@/contracts";
import { formatUnits, parseUnits } from "viem";
import { stakingRewardsABI } from "@/contracts";

export default function StakeProperty() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState("");
  const [mounted, setMounted] = useState(false);
  const tokenAddress = params.tokenAddress as `0x${string}`;
  const stakingContractAddress = process.env.NEXT_PUBLIC_STAKING_REWARDS_ADDRESS as `0x${string}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Read property details
  const { data: propertyDetails } = useContractRead({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'propertyDetails',
  });

  // Read user's token balance
  const { data: balance } = useContractRead({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address,
  });

  // Read staking contract allowance
  const { data: allowance } = useContractRead({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'allowance',
    args: [address, stakingContractAddress],
    enabled: !!address,
  });

  // Contract write for approving tokens
  const { writeAsync: approveTokens } = useContractWrite({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'approve',
  });

  // Contract write for staking
  const { writeAsync: stake } = useContractWrite({
    address: stakingContractAddress,
    abi: stakingRewardsABI,
    functionName: 'stake',
  });

  const handleStake = async () => {
    if (!amount || !address) return;

    try {
      const amountToStake = parseUnits(amount, 18);

      // Check if we need to approve first
      if (allowance && allowance < amountToStake) {
        const tx = await approveTokens({
          args: [stakingContractAddress, amountToStake],
        });
        await tx.wait();
        toast({
          title: "Approval Successful",
          description: "You can now stake your tokens",
        });
      }

      // Stake the tokens
      const tx = await stake({
        args: [tokenAddress, amountToStake],
      });
      await tx.wait();

      toast({
        title: "Staking Successful",
        description: "Your tokens have been staked successfully",
      });

      // Redirect back to property details
      router.push(`/property/${tokenAddress}`);
    } catch (error) {
      console.error('Staking error:', error);
      toast({
        title: "Error",
        description: "Failed to stake tokens. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!mounted) return null;

  if (!isConnected) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to stake tokens
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const formattedBalance = balance ? formatUnits(balance, 18) : '0';

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Stake Property Tokens</CardTitle>
          <CardDescription>
            Stake your property tokens to earn rewards
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="balance">Your Balance</Label>
            <p className="text-2xl font-bold">{formattedBalance} Tokens</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Stake</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount to stake"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={formattedBalance}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push(`/property/${tokenAddress}`)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleStake}
            disabled={!amount || Number(amount) <= 0 || Number(amount) > Number(formattedBalance)}
          >
            Stake Tokens
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
