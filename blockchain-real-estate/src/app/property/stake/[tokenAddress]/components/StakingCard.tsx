'use client';

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { stakingRewardsV2ABI, propertyTokenABI } from "@/lib/contracts";
import { formatUnits, parseUnits } from "viem";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { CoinsIcon, TimerIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface StakingCardProps {
  propertyToken: `0x${string}`;
  stakingAddress: `0x${string}` | null;
}

export function StakingCard({ propertyToken, stakingAddress }: StakingCardProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [loading, setLoading] = useState(false);
  const [stakeAmount, setStakeAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [tokenBalance, setTokenBalance] = useState<bigint>(0n);
  const [stakedBalance, setStakedBalance] = useState<bigint>(0n);
  const [earnedRewards, setEarnedRewards] = useState<bigint>(0n);
  const [rewardRate, setRewardRate] = useState<bigint>(0n);
  const [finishAt, setFinishAt] = useState<bigint>(0n);

  useEffect(() => {
    if (!address || !stakingAddress || !publicClient) return;

    const fetchData = async () => {
      try {
        const [balance, staked, earned, rate, finish] = await Promise.all([
          // Token balance
          publicClient.readContract({
            address: propertyToken,
            abi: propertyTokenABI,
            functionName: "balanceOf",
            args: [address],
          }),
          // Staked balance
          publicClient.readContract({
            address: stakingAddress,
            abi: stakingRewardsV2ABI,
            functionName: "balanceOf",
            args: [address],
          }),
          // Earned rewards
          publicClient.readContract({
            address: stakingAddress,
            abi: stakingRewardsV2ABI,
            functionName: "earned",
            args: [address],
          }),
          // Reward rate
          publicClient.readContract({
            address: stakingAddress,
            abi: stakingRewardsV2ABI,
            functionName: "rewardRate",
          }),
          // Finish time
          publicClient.readContract({
            address: stakingAddress,
            abi: stakingRewardsV2ABI,
            functionName: "finishAt",
          })
        ]);

        setTokenBalance(balance);
        setStakedBalance(staked);
        setEarnedRewards(earned);
        setRewardRate(rate);
        setFinishAt(finish);
      } catch (error) {
        console.error("Error fetching staking data:", error);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [address, propertyToken, stakingAddress, publicClient]);

  const handleStake = async () => {
    if (!address || !walletClient || !stakingAddress || !stakeAmount) return;
    setLoading(true);

    try {
      const amountToStake = parseUnits(stakeAmount, 18);
      const { request } = await publicClient.simulateContract({
        address: stakingAddress,
        abi: stakingRewardsV2ABI,
        functionName: "stake",
        args: [amountToStake],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });
      setStakeAmount("");
    } catch (error: any) {
      console.error("Error staking:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!address || !walletClient || !stakingAddress || !withdrawAmount) return;
    setLoading(true);

    try {
      const amountToWithdraw = parseUnits(withdrawAmount, 18);
      const { request } = await publicClient.simulateContract({
        address: stakingAddress,
        abi: stakingRewardsV2ABI,
        functionName: "withdraw",
        args: [amountToWithdraw],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });
      setWithdrawAmount("");
    } catch (error: any) {
      console.error("Error withdrawing:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGetReward = async () => {
    if (!address || !walletClient || !stakingAddress) return;
    setLoading(true);

    try {
      const { request } = await publicClient.simulateContract({
        address: stakingAddress,
        abi: stakingRewardsV2ABI,
        functionName: "getReward",
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });
    } catch (error: any) {
      console.error("Error claiming rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Staking Dashboard</CardTitle>
        <CardDescription>Stake your tokens to earn rewards</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contract Info */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Contract Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Property Token</Label>
              <p className="text-sm text-muted-foreground truncate">{propertyToken}</p>
            </div>
            <div>
              <Label>Staking Contract</Label>
              <p className="text-sm text-muted-foreground truncate">{stakingAddress}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Balances */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Your Balances</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Token Balance</Label>
              <p className="text-xl font-semibold">{formatUnits(tokenBalance, 18)}</p>
            </div>
            <div>
              <Label>Staked Balance</Label>
              <p className="text-xl font-semibold">{formatUnits(stakedBalance, 18)}</p>
            </div>
            <div>
              <Label>Earned Rewards</Label>
              <p className="text-xl font-semibold">{formatUnits(earnedRewards, 18)}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Staking Info */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Staking Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Reward Rate</Label>
              <p className="text-xl font-semibold">{formatUnits(rewardRate, 18)} / second</p>
            </div>
            <div>
              <Label>Finish Time</Label>
              <p className="text-xl font-semibold">
                {new Date(Number(finishAt) * 1000).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Actions</h3>
          
          {/* Stake */}
          <div className="space-y-2">
            <Label>Stake Tokens</Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="Amount to stake"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
              />
              <Button onClick={handleStake} disabled={loading}>
                {loading ? <Spinner className="mr-2 h-4 w-4" /> : <ArrowUpIcon className="mr-2 h-4 w-4" />}
                Stake
              </Button>
            </div>
          </div>

          {/* Withdraw */}
          <div className="space-y-2">
            <Label>Withdraw Tokens</Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="Amount to withdraw"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
              <Button onClick={handleWithdraw} disabled={loading}>
                {loading ? <Spinner className="mr-2 h-4 w-4" /> : <ArrowDownIcon className="mr-2 h-4 w-4" />}
                Withdraw
              </Button>
            </div>
          </div>

          {/* Claim Rewards */}
          <div className="space-y-2">
            <Label>Claim Rewards</Label>
            <Button 
              className="w-full" 
              onClick={handleGetReward} 
              disabled={loading || earnedRewards <= 0n}
            >
              {loading ? <Spinner className="mr-2 h-4 w-4" /> : <CoinsIcon className="mr-2 h-4 w-4" />}
              Claim {formatUnits(earnedRewards, 18)} Tokens
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
