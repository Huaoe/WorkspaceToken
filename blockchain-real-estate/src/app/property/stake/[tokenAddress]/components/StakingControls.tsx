"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowUpIcon } from "lucide-react";
import { formatUnits, parseUnits } from "viem";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { usePublicClient } from "wagmi";
import { propertyTokenABI, stakingRewardsV2ABI } from "@/lib/contracts";

interface StakingControlsProps {
  tokenBalance: bigint;
  amount: string;
  setAmount: (amount: string) => void;
  amountPercentage: number;
  setAmountPercentage: (percentage: number) => void;
  maxAmount: bigint;
  stakingAddress: string | null;
  propertyToken: `0x${string}`;
}

// Utility function for number formatting
const formatNumber = (value: string | number, decimals = 2) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export function StakingControls({
  tokenBalance,
  amount,
  setAmount,
  amountPercentage,
  setAmountPercentage,
  maxAmount,
  stakingAddress,
  propertyToken,
}: StakingControlsProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const publicClient = usePublicClient();

  // Handle amount input for staking
  const handleAmountChange = (value: string) => {
    if (!value) {
      setAmount("");
      setAmountPercentage(0);
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setAmount(value);
    const maxValue = Number(formatUnits(maxAmount, 18));
    const percentage = (numValue / maxValue) * 100;
    setAmountPercentage(Math.min(percentage, 100));
  };

  // Handle percentage input for staking
  const handlePercentageChange = (values: number[]) => {
    const value = values[0];
    setAmountPercentage(value);
    const maxValue = Number(formatUnits(maxAmount, 18));
    const newAmount = (maxValue * value) / 100;
    setAmount(newAmount.toString());
  };

  // Handle staking
  const handleStake = async (amountToStake: string) => {
    if (!stakingAddress || !publicClient || !amountToStake) return;
    setLoading(true);

    try {
      const parsedAmount = parseUnits(amountToStake, 18);

      // First approve the staking contract
      const { request: approveRequest } = await publicClient.simulateContract({
        address: propertyToken,
        abi: propertyTokenABI,
        functionName: "approve",
        args: [stakingAddress, parsedAmount],
      });

      const approveHash = await publicClient.writeContract(approveRequest);
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // Then stake the tokens
      const { request } = await publicClient.simulateContract({
        address: stakingAddress as `0x${string}`,
        abi: stakingRewardsV2ABI,
        functionName: "stake",
        args: [parsedAmount],
      });

      const hash = await publicClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      toast({
        title: "Success",
        description: `Successfully staked ${amountToStake} tokens`,
      });

      // Reset amount
      setAmount("");
      setAmountPercentage(0);
      window.location.reload();
    } catch (error) {
      console.error("Error staking tokens:", error);
      toast({
        title: "Error",
        description: "Failed to stake tokens. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stake Tokens</CardTitle>
        <CardDescription>
          Stake your tokens to earn rewards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label>Amount</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.0"
                min="0"
                max={formatNumber(formatUnits(maxAmount, 18))}
                step="0.000001"
              />
              <Button
                variant="outline"
                onClick={() => handleAmountChange(formatNumber(formatUnits(maxAmount, 18)))}
              >
                Max
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">0%</span>
              <span className="text-sm text-gray-500">{formatNumber(amountPercentage, 0)}%</span>
              <span className="text-sm text-gray-500">100%</span>
            </div>
            <Slider
              defaultValue={[0]}
              value={[amountPercentage]}
              onValueChange={handlePercentageChange}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <Button
            className="w-full"
            onClick={() => handleStake(amount)}
            disabled={!amount || loading}
          >
            <ArrowUpIcon className="w-4 h-4 mr-2" />
            Stake
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
