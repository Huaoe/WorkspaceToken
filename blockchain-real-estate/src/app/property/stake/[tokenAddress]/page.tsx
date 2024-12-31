"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWalletClient,
} from "wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import {
  stakingFactoryV2ABI,
  stakingRewardsV2ABI,
  propertyTokenABI,
  eurcABI,
} from "@/lib/contracts";
import { formatUnits, parseUnits } from "viem";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CoinsIcon,
  TimerIcon,
  WalletIcon,
  PercentIcon,
} from "lucide-react";
import { StakingInitButton } from "./components/StakingInitButton";

export default function StakeProperty() {
  const params = useParams();
  const tokenAddress = params.tokenAddress as string;
  const { address, isConnected } = useAccount();
  const { chain } = useChainId();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { toast } = useToast();

  // State for staking info
  const [loading, setLoading] = useState(false);
  const [stakingAddress, setStakingAddress] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<bigint>(0n);
  const [stakedBalance, setStakedBalance] = useState<bigint>(0n);
  const [earnedRewards, setEarnedRewards] = useState<bigint>(0n);
  const [apr, setApr] = useState<number>(8.5);
  const [endDateStr, setEndDateStr] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [propertyDetails, setPropertyDetails] = useState<any>(null);
  const [stakingHistory, setStakingHistory] = useState<any[]>([]);
  const [totalStaked, setTotalStaked] = useState<bigint>(0n);
  const [rewardRate, setRewardRate] = useState<bigint>(0n);

  // State for staking controls
  const [amount, setAmount] = useState("");
  const [amountPercentage, setAmountPercentage] = useState(0);
  const [maxAmount, setMaxAmount] = useState<bigint>(0n);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!tokenAddress || !isConnected || !address || !publicClient) return;
      setLoading(true);

      try {
        // Get property details
        const details = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: propertyTokenABI,
          functionName: "propertyDetails",
        });
        setPropertyDetails(details);

        // Get staking contract
        const stakingFactory = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
        const stakingInfo = await publicClient.readContract({
          address: stakingFactory as `0x${string}`,
          abi: stakingFactoryV2ABI,
          functionName: "stakingContracts",
          args: [tokenAddress as `0x${string}`],
        });

        if (
          !stakingInfo.contractAddress ||
          stakingInfo.contractAddress ===
            "0x0000000000000000000000000000000000000000"
        ) {
          throw new Error("No staking contract found");
        }

        setStakingAddress(stakingInfo.contractAddress);

        // Get user balances and contract info
        const [balance, staked, earned, total, rate, finishAt] =
          await Promise.all([
            publicClient.readContract({
              address: tokenAddress as `0x${string}`,
              abi: propertyTokenABI,
              functionName: "balanceOf",
              args: [address],
            }),
            publicClient.readContract({
              address: stakingInfo.contractAddress,
              abi: stakingRewardsV2ABI,
              functionName: "balanceOf",
              args: [address],
            }),
            publicClient.readContract({
              address: stakingInfo.contractAddress,
              abi: stakingRewardsV2ABI,
              functionName: "earned",
              args: [address],
            }),
            publicClient.readContract({
              address: stakingInfo.contractAddress,
              abi: stakingRewardsV2ABI,
              functionName: "totalSupply",
            }),
            publicClient.readContract({
              address: stakingInfo.contractAddress,
              abi: stakingRewardsV2ABI,
              functionName: "rewardRate",
            }),
            publicClient.readContract({
              address: stakingInfo.contractAddress,
              abi: stakingRewardsV2ABI,
              functionName: "finishAt",
            }),
          ]);

        setTokenBalance(balance);
        setStakedBalance(staked);
        setEarnedRewards(earned);
        setTotalStaked(total);
        setRewardRate(rate);
        setEndDateStr(new Date(Number(finishAt) * 1000).toLocaleDateString());
        setMaxAmount(balance);

        // Calculate APR
        const annualRewards = (Number(rate) * 365 * 24 * 60 * 60) / 10e6;
        const aprValue = (annualRewards / Number(total)) * 100;
        setApr(annualRewards || 8.5);

        // Get staking history
        const stakingEvents = await publicClient.getLogs({
          address: stakingInfo.contractAddress,
          event: {
            type: "event",
            name: "Staked",
            inputs: [
              { type: "address", name: "user", indexed: true },
              { type: "uint256", name: "amount" },
            ],
          },
          fromBlock: 0n,
          toBlock: "latest",
        });

        const history = stakingEvents.map((event) => ({
          timestamp: new Date(
            Number(event.args.timestamp || 0) * 1000
          ).toLocaleDateString(),
          amount: formatUnits(event.args.amount || 0n, 18),
        }));

        setStakingHistory(history);
        setIsActive(true);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch staking data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tokenAddress, isConnected, address, publicClient]);

  // Handle amount input
  const handleAmountChange = (value: string) => {
    if (!value) {
      setAmount("");
      setAmountPercentage(0);
      return;
    }

    try {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return;

      const maxNum = Number(formatUnits(maxAmount, 18));
      if (numValue > maxNum) {
        setAmount(maxNum.toString());
        setAmountPercentage(100);
      } else {
        setAmount(value);
        setAmountPercentage((numValue / maxNum) * 100);
      }
    } catch (error) {
      console.error("Error parsing amount:", error);
    }
  };

  // Handle percentage slider
  const handlePercentageChange = (value: number) => {
    const maxNum = Number(formatUnits(maxAmount, 18));
    const newAmount = (maxNum * value) / 100;
    setAmount(newAmount.toFixed(6));
    setAmountPercentage(value);
  };

  // Handle staking
  const handleStake = async (amountToStake: string) => {
    if (!stakingAddress || !walletClient || !amountToStake) return;
    setLoading(true);

    try {
      const parsedAmount = parseUnits(amountToStake, 18);

      // First approve the staking contract
      const { request: approveRequest } = await publicClient.simulateContract({
        address: tokenAddress as `0x${string}`,
        abi: propertyTokenABI,
        functionName: "approve",
        args: [stakingAddress, parsedAmount],
        account: address,
      });

      const approveHash = await walletClient.writeContract(approveRequest);
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // Then stake the tokens
      const { request } = await publicClient.simulateContract({
        address: stakingAddress,
        abi: stakingRewardsV2ABI,
        functionName: "stake",
        args: [parsedAmount],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      toast({
        title: "Success",
        description: `Successfully staked ${amountToStake} tokens`,
      });

      // Reset amount and reload data
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

  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!stakingAddress || !walletClient || !stakedBalance) return;
    setLoading(true);

    try {
      const { request } = await publicClient.simulateContract({
        address: stakingAddress,
        abi: stakingRewardsV2ABI,
        functionName: "withdraw",
        args: [stakedBalance],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      toast({
        title: "Success",
        description: `Successfully withdrawn ${formatNumber(
          stakedBalance
        )} tokens`,
      });

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
    if (!stakingAddress || !walletClient || !earnedRewards) return;
    setLoading(true);

    try {
      const { request } = await publicClient.simulateContract({
        address: stakingAddress,
        abi: stakingRewardsV2ABI,
        functionName: "getReward",
        args: [],
        account: address,
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      toast({
        title: "Success",
        description: `Successfully claimed ${formatNumber(
          earnedRewards,
          6
        )} EURC in rewards`,
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

  // Format numbers for display
  const formatNumber = (value: bigint, decimals: number = 18) => {
    return Number(formatUnits(value, decimals)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Staking Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Staking Overview</CardTitle>
            <CardDescription>
              Current staking metrics and rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">APR</span>
                <span className="font-medium flex items-center">
                  <PercentIcon className="w-4 h-4 mr-1" />
                  {apr.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total Staked</span>
                <span className="font-medium">
                  {formatNumber(totalStaked)} Tokens
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Reward Rate</span>
                <span className="font-medium">
                  {formatNumber(rewardRate, 6)} EURC/second
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">End Date</span>
                <span className="font-medium">{endDateStr}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Position */}
        <Card>
          <CardHeader>
            <CardTitle>Your Position</CardTitle>
            <CardDescription>
              Your current staking position and rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Available Balance</span>
                <span className="font-medium">
                  {formatNumber(tokenBalance)} Tokens
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Staked Balance</span>
                <span className="font-medium">
                  {formatNumber(stakedBalance)} Tokens
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Earned Rewards</span>
                <span className="font-medium text-green-600">
                  {formatNumber(earnedRewards, 6)} EURC
                </span>
              </div>
              <Progress
                value={
                  (Number(stakedBalance) /
                    (Number(stakedBalance) + Number(tokenBalance))) *
                  100
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Staking Controls */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Stake Tokens</CardTitle>
            <CardDescription>Choose how many tokens to stake</CardDescription>
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
                    max={formatNumber(maxAmount)}
                    step="0.000001"
                  />
                  <Button
                    variant="outline"
                    onClick={() => handleAmountChange(formatNumber(maxAmount))}
                  >
                    Max
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">0%</span>
                  <span className="text-sm text-gray-500">100%</span>
                </div>
                <Slider
                  value={[amountPercentage]}
                  onValueChange={(values) => handlePercentageChange(values[0])}
                  max={100}
                  step={1}
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  className="flex-1"
                  onClick={() => handleStake(amount)}
                  disabled={!amount || loading}
                >
                  <ArrowUpIcon className="w-4 h-4 mr-2" />
                  Stake
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleWithdraw}
                  disabled={!stakedBalance || loading}
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

        {/* Staking History */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Staking History</CardTitle>
            <CardDescription>Your staking activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            {stakingHistory.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stakingHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#2563eb" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-gray-500">
                No staking history available
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
