"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ArrowDownIcon, CoinsIcon } from "lucide-react";
import { formatUnits, parseUnits } from "viem";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { usePublicClient } from "wagmi";
import { stakingRewardsV2ABI } from "@/lib/contracts";

interface WithdrawControlsProps {
  stakedBalance: bigint;
  withdrawAmount: string;
  setWithdrawAmount: (amount: string) => void;
  withdrawPercentage: number;
  setWithdrawPercentage: (percentage: number) => void;
  earnedRewards: bigint;
  stakingAddress: string | null;
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

export function WithdrawControls({
  stakedBalance,
  withdrawAmount,
  setWithdrawAmount,
  withdrawPercentage,
  setWithdrawPercentage,
  earnedRewards,
  stakingAddress,
}: WithdrawControlsProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const publicClient = usePublicClient();

  // Handle amount input for withdrawing
  const handleWithdrawAmountChange = (value: string) => {
    if (!value) {
      setWithdrawAmount("");
      setWithdrawPercentage(0);
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setWithdrawAmount(value);
    const maxValue = Number(formatUnits(stakedBalance, 18));
    const percentage = (numValue / maxValue) * 100;
    setWithdrawPercentage(Math.min(percentage, 100));
  };

  // Handle percentage input for withdrawing
  const handleWithdrawPercentageChange = (values: number[]) => {
    const value = values[0];
    setWithdrawPercentage(value);
    const maxValue = Number(formatUnits(stakedBalance, 18));
    const newAmount = (maxValue * value) / 100;
    setWithdrawAmount(newAmount.toString());
  };

  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!stakingAddress || !publicClient || !withdrawAmount) return;
    setLoading(true);

    try {
      const parsedAmount = parseUnits(withdrawAmount, 18);
      const { request } = await publicClient.simulateContract({
        address: stakingAddress as `0x${string}`,
        abi: stakingRewardsV2ABI,
        functionName: "withdraw",
        args: [parsedAmount],
      });

      const hash = await publicClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      toast({
        title: "Success",
        description: `Successfully withdrawn ${withdrawAmount} tokens`,
      });

      setWithdrawAmount("");
      setWithdrawPercentage(0);
      window.location.reload();
    } catch (error) {
      console.error("Error withdrawing tokens:", error);
      toast({
        title: "Error",
        description: "Failed to withdraw tokens. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle claiming rewards
  const handleClaimRewards = async () => {
    if (!stakingAddress || !publicClient || !earnedRewards) return;
    setLoading(true);

    try {
      const { request } = await publicClient.simulateContract({
        address: stakingAddress as `0x${string}`,
        abi: stakingRewardsV2ABI,
        functionName: "getReward",
        args: [],
      });

      const hash = await publicClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      toast({
        title: "Success",
        description: `Successfully claimed ${formatNumber(formatUnits(earnedRewards, 18))} EURC in rewards`,
      });

      window.location.reload();
    } catch (error) {
      console.error("Error claiming rewards:", error);
      toast({
        title: "Error",
        description: "Failed to claim rewards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdraw & Claim</CardTitle>
        <CardDescription>
          Withdraw staked tokens and claim rewards
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label>Amount</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={withdrawAmount}
                onChange={(e) => handleWithdrawAmountChange(e.target.value)}
                placeholder="0.0"
                min="0"
                max={formatNumber(formatUnits(stakedBalance, 18))}
                step="0.000001"
              />
              <Button
                variant="outline"
                onClick={() => handleWithdrawAmountChange(formatNumber(formatUnits(stakedBalance, 18)))}
              >
                Max
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">0%</span>
              <span className="text-sm text-gray-500">{formatNumber(withdrawPercentage, 0)}%</span>
              <span className="text-sm text-gray-500">100%</span>
            </div>
            <Slider
              defaultValue={[0]}
              value={[withdrawPercentage]}
              onValueChange={handleWithdrawPercentageChange}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="flex space-x-4">
            <Button
              className="flex-1"
              onClick={handleWithdraw}
              disabled={!withdrawAmount || loading}
              variant="outline"
            >
              <ArrowDownIcon className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
            <Button
              className="flex-1"
              onClick={handleClaimRewards}
              disabled={!earnedRewards || loading}
              variant="outline"
            >
              <CoinsIcon className="w-4 h-4 mr-2" />
              Claim Rewards
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
