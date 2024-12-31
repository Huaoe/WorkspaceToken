"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PercentIcon, CoinsIcon, TrendingUpIcon, WalletIcon, TimerIcon } from "lucide-react";
import { formatUnits } from "viem";
import { Progress } from "@/components/ui/progress";

interface StakingOverviewProps {
  apr: number;
  totalStaked: bigint;
  rewardRate: bigint;
  endDateStr: string;
  earnedRewards: bigint;
  tokenBalance: bigint;
  formatNumber: (value: string | number, decimals?: number) => string;
}

export function StakingOverview({
  apr,
  totalStaked,
  rewardRate,
  endDateStr,
  earnedRewards,
  tokenBalance,
  formatNumber,
}: StakingOverviewProps) {
  // Safely format BigInt values with null checks
  const formatBigInt = (value: bigint | undefined | null): number => {
    if (!value) return 0;
    try {
      return Number(formatUnits(value, 18));
    } catch (error) {
      console.error('Error formatting BigInt:', error);
      return 0;
    }
  };

  // Calculate percentage of total tokens staked safely
  const stakedAmount = formatBigInt(totalStaked);
  const balanceAmount = formatBigInt(tokenBalance);
  const totalAmount = stakedAmount + balanceAmount;
  const stakedPercentage = totalAmount > 0 ? (stakedAmount / totalAmount) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staking Overview</CardTitle>
        <CardDescription>Current staking statistics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* APR Section */}
        <div className="bg-secondary/20 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PercentIcon className="w-5 h-5 text-primary" />
              <span className="font-semibold">Annual Percentage Rate</span>
            </div>
            <span className="text-xl font-bold text-primary">8.5%</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Fixed APR for staking your tokens
          </p>
        </div>

        {/* Staking Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total Staked</span>
            <span className="font-medium">{formatNumber(stakedAmount)} Tokens</span>
          </div>
          <Progress value={stakedPercentage} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Available: {formatNumber(balanceAmount)} Tokens</span>
            <span>{stakedPercentage.toFixed(1)}% Staked</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Rewards Earned */}
          <div className="space-y-2 p-3 bg-secondary/10 rounded-lg">
            <div className="flex items-center gap-2">
              <CoinsIcon className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Rewards Earned</span>
            </div>
            <p className="text-lg font-semibold">
              {formatNumber(formatBigInt(earnedRewards))} EURC
            </p>
          </div>

          {/* Reward Rate */}
          <div className="space-y-2 p-3 bg-secondary/10 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUpIcon className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Reward Rate</span>
            </div>
            <p className="text-lg font-semibold">
              {formatNumber(formatBigInt(rewardRate), 6)} EURC/s
            </p>
          </div>
        </div>

        {/* End Date */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <TimerIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Staking Period Ends</span>
          </div>
          <span className="font-medium">{endDateStr}</span>
        </div>
      </CardContent>
    </Card>
  );
}
