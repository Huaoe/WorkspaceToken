'use client';

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useReadContract, useWalletClient, usePublicClient, useContractReads, useWatchContractEvent } from "wagmi";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { propertyTokenABI, stakingRewardsABI, stakingFactoryABI } from "@/contracts";
import { formatUnits, parseUnits } from "viem";
import { InitializeStaking } from "./components/InitializeStaking";
import { Spinner } from "@/components/ui/spinner";
import TokenMetrics from '@/components/staking/token-metrics';

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
  const [stakingAddress, setStakingAddress] = useState<`0x${string}` | null>(null);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { toast } = useToast();

  const tokenAddress = params.tokenAddress as `0x${string}`;
  const stakingFactoryAddress = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS as `0x${string}`;

  // Get staking address from factory
  useEffect(() => {
    const getStakingAddress = async () => {
      try {
        const address = await publicClient.readContract({
          address: stakingFactoryAddress,
          abi: stakingFactoryABI,
          functionName: "getStakingRewards",
          args: [tokenAddress],
        });

        console.log("Found staking contract:", address);
        setStakingAddress(address);
      } catch (error) {
        console.error("Error getting staking address:", error);
        toast({
          title: "Error",
          description: "Failed to get staking contract address",
        });
      }
    };

    if (tokenAddress && stakingFactoryAddress) {
      getStakingAddress();
    }
  }, [tokenAddress, stakingFactoryAddress, publicClient, toast]);

  // Read token balance
  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: "balanceOf",
    args: [address],
    enabled: !!address,
  });

  // Read staked balance
  const { data: stakedBalanceData } = useReadContract({
    address: stakingAddress ?? undefined,
    abi: stakingRewardsABI,
    functionName: "balanceOf",
    args: [address],
    enabled: !!address && !!stakingAddress,
  });

  // Read earned rewards
  const { data: earnedRewardsData } = useReadContract({
    address: stakingAddress ?? undefined,
    abi: stakingRewardsABI,
    functionName: "earned",
    args: [address],
    enabled: !!address && !!stakingAddress,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (stakedBalanceData !== undefined) {
      setStakedBalance(stakedBalanceData);
    }
  }, [stakedBalanceData]);

  useEffect(() => {
    if (earnedRewardsData !== undefined) {
      setEarnedRewards(earnedRewardsData);
    }
  }, [earnedRewardsData]);

  useEffect(() => {
    const checkInitialization = async () => {
      if (!stakingAddress) return;
      
      try {
        const [rewardRate, duration, updatedAt] = await Promise.all([
          publicClient.readContract({
            address: stakingAddress,
            abi: stakingRewardsABI,
            functionName: 'rewardRate',
          }),
          publicClient.readContract({
            address: stakingAddress,
            abi: stakingRewardsABI,
            functionName: 'duration',
          }),
          publicClient.readContract({
            address: stakingAddress,
            abi: stakingRewardsABI,
            functionName: 'updatedAt',
          }),
        ]);

        console.log("Staking contract state:", {
          rewardRate: rewardRate.toString(),
          duration: duration.toString(),
          updatedAt: updatedAt.toString(),
        });

        setIsInitialized(rewardRate !== 0n && duration !== 0n && updatedAt !== 0n);
      } catch (error) {
        console.error("Error checking staking initialization:", error);
        setIsInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialization();
  }, [stakingAddress, publicClient]);

  useEffect(() => {
    if (balance) setTokenBalance(balance);
  }, [balance]);

  const handleStake = async () => {
    if (!walletClient || !isConnected) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
      });
      return;
    }

    if (!amount) {
      toast({
        title: "Error",
        description: "Please enter an amount",
      });
      return;
    }

    try {
      setLoading(true);
      const amountToStake = parseUnits(amount, 18); // 18 decimals for ERC20

      console.log("\n=== Starting stake transaction ===");
      console.log("Basic info:", {
        userAddress: address,
        tokenAddress,
        stakingAddress,
        amount,
        amountToStake: amountToStake.toString(),
      });

      // Check token balance
      const tokenBalance = await publicClient.readContract({
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: "balanceOf",
        args: [address],
      });

      console.log("\nToken balance check:", {
        balance: tokenBalance.toString(),
        formattedBalance: formatUnits(tokenBalance, 18),
        requiredAmount: amount,
        hasEnoughTokens: tokenBalance >= amountToStake,
      });

      if (tokenBalance < amountToStake) {
        throw new Error(`Insufficient token balance. You have ${formatUnits(tokenBalance, 18)} tokens but trying to stake ${amount} tokens`);
      }

      // Check contract state before staking
      const [rewardRate, duration, updatedAt, finishAt, totalSupply, rewardsToken] = await Promise.all([
        publicClient.readContract({
          address: stakingAddress,
          abi: stakingRewardsABI,
          functionName: 'rewardRate',
        }),
        publicClient.readContract({
          address: stakingAddress,
          abi: stakingRewardsABI,
          functionName: 'duration',
        }),
        publicClient.readContract({
          address: stakingAddress,
          abi: stakingRewardsABI,
          functionName: 'updatedAt',
        }),
        publicClient.readContract({
          address: stakingAddress,
          abi: stakingRewardsABI,
          functionName: 'finishAt',
        }),
        publicClient.readContract({
          address: stakingAddress,
          abi: stakingRewardsABI,
          functionName: 'totalSupply',
        }),
        publicClient.readContract({
          address: stakingAddress,
          abi: stakingRewardsABI,
          functionName: 'rewardsToken',
        }),
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

      // Check rewards token balance of staking contract
      const rewardsBalance = await publicClient.readContract({
        address: rewardsToken,
        abi: stakingRewardsABI,
        functionName: 'balanceOf',
        args: [stakingAddress],
      });

      console.log("\nRewards token balance:", {
        balance: rewardsBalance.toString(),
        formattedBalance: formatUnits(rewardsBalance, 6), // EURC has 6 decimals
        requiredRewards: formatUnits(rewardRate * duration, 6),
        hasEnoughRewards: rewardsBalance >= rewardRate * duration,
      });

      // Verify contract is properly initialized
      if (rewardRate === 0n || duration === 0n || updatedAt === 0n) {
        throw new Error("Staking contract not properly initialized");
      }

      // Check if staking period is active
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      if (finishAt <= currentTime) {
        throw new Error(`Staking period has ended. Finish time: ${new Date(Number(finishAt) * 1000).toLocaleString()}`);
      }

      // First check approval
      const currentAllowance = await publicClient.readContract({
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: "allowance",
        args: [address, stakingAddress],
      });

      console.log("\nToken approval check:", {
        currentAllowance: currentAllowance.toString(),
        formattedAllowance: formatUnits(currentAllowance, 18),
        requiredAmount: amount,
        needsApproval: currentAllowance < amountToStake,
      });

      // Approve if needed
      if (currentAllowance < amountToStake) {
        console.log("\nApproving tokens...");
        const { request: approveRequest } = await publicClient.simulateContract({
          address: tokenAddress,
          abi: propertyTokenABI,
          functionName: "approve",
          args: [stakingAddress, amountToStake],
          account: address,
        });

        const approveHash = await walletClient.writeContract(approveRequest);
        console.log("Approval transaction hash:", approveHash);

        const approveReceipt = await publicClient.waitForTransactionReceipt({ 
          hash: approveHash,
          timeout: 60_000,
        });

        if (approveReceipt.status !== 'success') {
          throw new Error('Token approval failed');
        }

        console.log("Approval successful");
      }

      // Get current nonce
      let nonce = await publicClient.getTransactionCount({
        address: address as `0x${string}`,
      });
      console.log("\nTransaction details:", {
        nonce: nonce.toString(),
        gasPrice: (await publicClient.getGasPrice()).toString(),
      });

      // Now stake
      console.log("\nSimulating stake transaction...");
      const { request } = await publicClient.simulateContract({
        address: stakingAddress,
        abi: stakingRewardsABI,
        functionName: "stake",
        args: [amountToStake],
        account: address,
      });

      console.log("Stake simulation successful, executing transaction...");
      const hash = await walletClient.writeContract({
        ...request,
        nonce: nonce++,
      });

      console.log("Staking transaction hash:", hash);

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash,
        timeout: 60_000,
      });

      if (receipt.status !== 'success') {
        throw new Error('Staking transaction failed');
      }

      toast({
        title: "Success",
        description: `Successfully staked ${amount} tokens`,
      });

      setAmount("");
      setLoading(false);
    } catch (error: any) {
      console.error("\nStaking error:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack,
      });

      // Try to get more information about the error
      if (error.message.includes("0xfb8f41b2")) {
        console.log("\nTrying to decode error signature 0xfb8f41b2...");
        try {
          const errorData = error.message.match(/0x[a-fA-F0-9]+/)?.[0];
          if (errorData) {
            console.log("Error data:", errorData);
          }
        } catch (decodeError) {
          console.error("Failed to decode error:", decodeError);
        }
      }

      toast({
        title: "Error",
        description: error.message || "Failed to stake tokens",
      });
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!walletClient || !isConnected || !amount) return;

    try {
      setLoading(true);
      const amountToWithdraw = parseUnits(amount, 18);

      const { request } = await publicClient.simulateContract({
        account: address,
        address: stakingAddress,
        abi: stakingRewardsABI,
        functionName: 'withdraw',
        args: [amountToWithdraw],
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      toast({
        title: "Success",
        description: `Successfully withdrawn ${amount} tokens`,
      });
      setAmount("");
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
    if (!walletClient || !isConnected) return;

    try {
      setLoading(true);
      const { request } = await publicClient.simulateContract({
        account: address,
        address: stakingAddress,
        abi: stakingRewardsABI,
        functionName: 'getReward',
        args: [],
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      toast({
        title: "Success",
        description: "Successfully claimed rewards",
      });
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

  const isOwner = address === process.env.NEXT_PUBLIC_STAKING_CONTRACT_OWNER;

  const { data: stakingMetrics } = useContractReads({
    contracts: [
      {
        address: stakingAddress as `0x${string}`,
        abi: stakingRewardsABI,
        functionName: 'totalSupply',
      },
      {
        address: stakingAddress as `0x${string}`,
        abi: stakingRewardsABI,
        functionName: 'rewardRate',
      },
      {
        address: stakingAddress as `0x${string}`,
        abi: stakingRewardsABI,
        functionName: 'duration',
      }
    ],
    watch: true,
  });

  // Calculate APY from reward rate
  const calculateAPY = (rewardRate: bigint, totalStaked: bigint): number => {
    if (totalStaked === BigInt(0)) return 0;
    const annualRewards = rewardRate * BigInt(365 * 24 * 60 * 60); // Rewards per year
    return Number((annualRewards * BigInt(100)) / totalStaked);
  };

  const [totalStaked, rewardRate, duration] = stakingMetrics || [];
  const currentAPY = totalStaked?.result && rewardRate?.result 
    ? calculateAPY(BigInt(rewardRate.result.toString()), BigInt(totalStaked.result.toString()))
    : 0;

  // Get historical staking data from events
  useWatchContractEvent({
    address: stakingAddress as `0x${string}`,
    abi: stakingRewardsABI,
    eventName: 'Staked',
    onLogs(logs) {
      console.log('New staking event:', logs);
    },
  });

  if (!mounted) return null;

  if (isLoading || !stakingAddress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!isInitialized) {
    return <InitializeStaking stakingAddress={stakingAddress} />;
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
                amount: Number(formatUnits(totalStaked?.result || BigInt(0), 18)),
                apy: currentAPY
              }
            ]}
            totalStaked={Number(formatUnits(totalStaked?.result || BigInt(0), 18))}
            averageStakingPeriod={Number(duration?.result || 0) / (24 * 60 * 60)} // Convert seconds to days
            currentAPY={currentAPY}
          />
        </div>
      </div>
    </div>
  );
}
