'use client';

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { formatUnits, parseUnits } from "ethers";
import { InitializeStaking } from "./components/InitializeStaking";
import { Spinner } from "@/components/ui/spinner";
import TokenMetrics from '@/components/staking/token-metrics';
import { useWalletEvents } from "@/app/wallet-events-provider";
import { getPropertyTokenContract, getStakingFactoryContract, getStakingRewardsContract } from "@/lib/ethereum";

export default function StakeProperty() {
  const params = useParams();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<bigint>(BigInt(0));
  const [stakedBalance, setStakedBalance] = useState<bigint>(BigInt(0));
  const [earnedRewards, setEarnedRewards] = useState<bigint>(BigInt(0));
  const [mounted, setMounted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stakingAddress, setStakingAddress] = useState<string | null>(null);
  const [stakingMetrics, setStakingMetrics] = useState<{
    totalStaked: bigint;
    rewardRate: bigint;
    duration: bigint;
  } | null>(null);

  const { address, isConnected } = useWalletEvents();
  const { toast } = useToast();

  const tokenAddress = params.tokenAddress as string;

  // Get staking address from factory
  useEffect(() => {
    const getStakingAddress = async () => {
      try {
        const factory = getStakingFactoryContract();
        const address = await factory.getStakingRewards(tokenAddress);
        console.log("Found staking contract:", address);
        setStakingAddress(address);
      } catch (error) {
        console.error("Error getting staking address:", error);
        toast({
          title: "Error",
          description: "Failed to get staking contract. Please contact admin to create one.",
        });
      }
    };

    if (tokenAddress) {
      getStakingAddress();
    }
  }, [tokenAddress, toast]);

  // Read balances and metrics
  useEffect(() => {
    const fetchBalances = async () => {
      if (!isConnected || !address || !stakingAddress) return;

      try {
        const propertyToken = getPropertyTokenContract(tokenAddress);
        const stakingContract = getStakingRewardsContract(stakingAddress);

        const [balance, staked, earned, totalStaked, rewardRate, duration] = await Promise.all([
          propertyToken.balanceOf(address),
          stakingContract.balanceOf(address),
          stakingContract.earned(address),
          stakingContract.totalSupply(),
          stakingContract.rewardRate(),
          stakingContract.duration()
        ]);

        setTokenBalance(balance);
        setStakedBalance(staked);
        setEarnedRewards(earned);
        setStakingMetrics({
          totalStaked,
          rewardRate,
          duration
        });
      } catch (error) {
        console.error("Error fetching balances:", error);
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, [address, isConnected, stakingAddress, tokenAddress]);

  // Check initialization
  useEffect(() => {
    const checkInitialization = async () => {
      if (!stakingAddress || stakingAddress === '0x0000000000000000000000000000000000000000') {
        console.log("No valid staking address found");
        setIsInitialized(false);
        setIsLoading(false);
        return;
      }
      
      try {
        console.log("Checking staking contract at:", stakingAddress);
        const stakingContract = getStakingRewardsContract(stakingAddress);
        const [rewardRate, duration, updatedAt] = await Promise.all([
          stakingContract.rewardRate(),
          stakingContract.duration(),
          stakingContract.updatedAt()
        ]);

        console.log("Staking contract state:", {
          rewardRate: rewardRate.toString(),
          duration: duration.toString(),
          updatedAt: updatedAt.toString(),
        });

        setIsInitialized(rewardRate !== BigInt(0) && duration !== BigInt(0) && updatedAt !== BigInt(0));
      } catch (error) {
        console.error("Error checking staking initialization:", error);
        setIsInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialization();
  }, [stakingAddress]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStake = async () => {
    if (!isConnected || !address || !amount) {
      toast({
        title: "Error",
        description: "Please connect your wallet and enter an amount",
      });
      return;
    }

    try {
      setLoading(true);
      const amountToStake = parseUnits(amount, 18);

      console.log("\n=== Starting stake transaction ===");
      console.log("Basic info:", {
        userAddress: address,
        tokenAddress,
        stakingAddress,
        amount,
        amountToStake: amountToStake.toString(),
      });

      const propertyToken = getPropertyTokenContract(tokenAddress);
      const stakingContract = getStakingRewardsContract(stakingAddress!);

      // Check token balance
      const balance = await propertyToken.balanceOf(address);
      console.log("\nToken balance check:", {
        balance: balance.toString(),
        formattedBalance: formatUnits(balance, 18),
        requiredAmount: amount,
        hasEnoughTokens: balance >= amountToStake,
      });

      if (balance < amountToStake) {
        throw new Error(`Insufficient token balance. You have ${formatUnits(balance, 18)} tokens but trying to stake ${amount} tokens`);
      }

      // Check contract state
      const [rewardRate, duration, updatedAt, finishAt, totalSupply, rewardsToken] = await Promise.all([
        stakingContract.rewardRate(),
        stakingContract.duration(),
        stakingContract.updatedAt(),
        stakingContract.finishAt(),
        stakingContract.totalSupply(),
        stakingContract.rewardsToken()
      ]);

      console.log("\nStaking contract state:", {
        rewardRate: rewardRate.toString(),
        duration: duration.toString(),
        updatedAt: updatedAt.toString(),
        finishAt: finishAt.toString(),
        totalSupply: totalSupply.toString(),
        rewardsToken,
        currentTime: Math.floor(Date.now() / 1000),
      });

      // Check rewards token balance
      const eurcToken = getPropertyTokenContract(rewardsToken);
      const rewardsBalance = await eurcToken.balanceOf(stakingAddress);

      console.log("\nRewards token balance:", {
        balance: rewardsBalance.toString(),
        formattedBalance: formatUnits(rewardsBalance, 6), // EURC has 6 decimals
        requiredRewards: formatUnits(rewardRate * duration, 6),
        hasEnoughRewards: rewardsBalance >= rewardRate * duration,
      });

      // Verify contract is properly initialized
      if (rewardRate === BigInt(0) || duration === BigInt(0) || updatedAt === BigInt(0)) {
        throw new Error("Staking contract not properly initialized");
      }

      // Check if staking period is active
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      if (finishAt <= currentTime) {
        throw new Error(`Staking period has ended. Finish time: ${new Date(Number(finishAt) * 1000).toLocaleString()}`);
      }

      // Check approval
      const allowance = await propertyToken.allowance(address, stakingAddress);
      console.log("\nToken approval check:", {
        currentAllowance: allowance.toString(),
        formattedAllowance: formatUnits(allowance, 18),
        requiredAmount: amount,
        needsApproval: allowance < amountToStake,
      });

      // Approve if needed
      if (allowance < amountToStake) {
        console.log("\nApproving tokens...");
        const approveTx = await propertyToken.approve(stakingAddress, amountToStake);
        console.log("Approval transaction hash:", approveTx.hash);
        const approveReceipt = await approveTx.wait();

        if (approveReceipt.status !== 1) {
          throw new Error('Token approval failed');
        }
        console.log("Approval successful");
      }

      // Stake tokens
      console.log("\nStaking tokens...");
      const stakeTx = await stakingContract.stake(amountToStake);
      console.log("Staking transaction hash:", stakeTx.hash);
      const stakeReceipt = await stakeTx.wait();

      if (stakeReceipt.status !== 1) {
        throw new Error('Staking transaction failed');
      }

      toast({
        title: "Success",
        description: `Successfully staked ${amount} tokens`,
      });

      setAmount("");
    } catch (error: any) {
      console.error("\nStaking error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to stake tokens",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!isConnected || !address || !amount) return;

    try {
      setLoading(true);
      const amountToWithdraw = parseUnits(amount, 18);

      const stakingContract = getStakingRewardsContract(stakingAddress!);
      const tx = await stakingContract.withdraw(amountToWithdraw);
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast({
          title: "Success",
          description: `Successfully withdrawn ${amount} tokens`,
        });
        setAmount("");
      } else {
        throw new Error('Withdrawal failed');
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to withdraw tokens",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!isConnected || !address) return;

    try {
      setLoading(true);
      const stakingContract = getStakingRewardsContract(stakingAddress!);
      const tx = await stakingContract.getReward();
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        toast({
          title: "Success",
          description: "Successfully claimed rewards",
        });
      } else {
        throw new Error('Failed to claim rewards');
      }
    } catch (error: any) {
      console.error('Claim rewards error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to claim rewards",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate APY from reward rate
  const calculateAPY = (rewardRate: bigint, totalStaked: bigint): number => {
    if (totalStaked === BigInt(0)) return 0;
    const annualRewards = rewardRate * BigInt(365 * 24 * 60 * 60); // Rewards per year
    return Number((annualRewards * BigInt(100)) / totalStaked);
  };

  const currentAPY = stakingMetrics?.totalStaked && stakingMetrics?.rewardRate 
    ? calculateAPY(stakingMetrics.rewardRate, stakingMetrics.totalStaked)
    : 0;

  if (!mounted) return null;

  if (isLoading || !stakingAddress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isInitialized && stakingAddress) {
    return <InitializeStaking stakingAddress={stakingAddress} tokenAddress={tokenAddress} />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-6">
        <div className="container mx-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle>Stake Property Tokens</CardTitle>
              <CardDescription>Stake your tokens to earn rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Available Balance</Label>
                    <p className="text-xl font-bold">{formatUnits(tokenBalance, 18)}</p>
                  </div>
                  <div>
                    <Label>Staked Balance</Label>
                    <p className="text-xl font-bold">{formatUnits(stakedBalance, 18)}</p>
                  </div>
                  <div>
                    <Label>Earned Rewards</Label>
                    <p className="text-xl font-bold">{formatUnits(earnedRewards, 18)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount to stake/withdraw"
                  />
                </div>

                <div className="flex space-x-4">
                  <Button 
                    onClick={handleStake} 
                    disabled={loading || !amount || Number(amount) <= 0}
                    className="flex-1"
                  >
                    {loading ? "Processing..." : "Stake"}
                  </Button>
                  <Button 
                    onClick={handleWithdraw}
                    disabled={loading || !amount || Number(amount) <= 0}
                    variant="outline"
                    className="flex-1"
                  >
                    {loading ? "Processing..." : "Withdraw"}
                  </Button>
                </div>

                <Button 
                  onClick={handleClaimRewards}
                  disabled={loading || earnedRewards <= 0}
                  variant="secondary"
                  className="w-full"
                >
                  {loading ? "Processing..." : "Claim Rewards"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Token Metrics & History</h2>
          <TokenMetrics 
            tokenAddress={tokenAddress}
            stakingHistory={[
              {
                timestamp: Math.floor(Date.now() / 1000),
                amount: Number(formatUnits(stakingMetrics?.totalStaked || BigInt(0), 18)),
                apy: currentAPY
              }
            ]}
            totalStaked={Number(formatUnits(stakingMetrics?.totalStaked || BigInt(0), 18))}
            averageStakingPeriod={Number(stakingMetrics?.duration || 0) / (24 * 60 * 60)} // Convert seconds to days
            currentAPY={currentAPY}
          />
        </div>
      </div>
    </div>
  );
}
