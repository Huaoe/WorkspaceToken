'use client';

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { propertyTokenABI, stakingRewardsABI } from "@/contracts";
import { stakingFactoryABI } from "@/lib/contracts";
import { formatUnits, parseUnits, parseEther, formatEther } from "ethers";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpIcon, ArrowDownIcon, CoinsIcon, TimerIcon } from "lucide-react";
import { parseAbiItem } from "viem";
import { whitelistABI } from "@/contracts";

export default function StakeProperty() {
  const params = useParams();
  const tokenAddress = params.tokenAddress as string;
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [stakingAddress, setStakingAddress] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<bigint>(0n);
  const [stakedBalance, setStakedBalance] = useState<bigint>(0n);
  const [earnedRewards, setEarnedRewards] = useState<bigint>(0n);
  const [stakingHistory, setStakingHistory] = useState<any[]>([]);
  const [apr, setApr] = useState<number>(0);
  const [endDateStr, setEndDateStr] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isWhitelistAdmin, setIsWhitelistAdmin] = useState(false);
  const [isUserWhitelisted, setIsUserWhitelisted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!tokenAddress || !isConnected || !address || !publicClient) return;

      try {
        // Get staking factory address
        const stakingFactory = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
        if (!stakingFactory) {
          throw new Error("Staking factory address not configured");
        }

        // Get staking contract info from factory
        const stakingContractInfo = await publicClient.readContract({
          address: stakingFactory as `0x${string}`,
          abi: stakingFactoryABI,
          functionName: "stakingContracts",
          args: [tokenAddress],
        });

        const { contractAddress, rewardRate, duration, isActive } = stakingContractInfo;

        console.log("Staking Contract Info:", {
          contractAddress,
          rewardRate: rewardRate.toString(),
          duration: duration.toString(),
          isActive
        });

        if (!isActive || contractAddress === '0x0000000000000000000000000000000000000000') {
          console.log("No active staking contract found for this property token");
          setStakingAddress(null);
          return;
        }

        setStakingAddress(contractAddress);
        setIsActive(isActive);
        
        // Set APR directly from rewardRate (70000 = 7%)
        setApr(Number(rewardRate) / 10000); // Convert basis points to percentage

        // Calculate end date
        const periodEndDate = new Date();
        periodEndDate.setSeconds(periodEndDate.getSeconds() + Number(duration));
        const endDateStr = periodEndDate.toLocaleDateString();
        setEndDateStr(endDateStr);

        console.log("Staking period ends:", endDateStr);

        // Check if property is active
        const propertyDetails = await publicClient.readContract({
          address: tokenAddress,
          abi: propertyTokenABI,
          functionName: "propertyDetails",
          args: [],
        });
        setIsActive(propertyDetails[5]); // isActive is at index 5

        // Get token balance
        const balance = await publicClient.readContract({
          address: tokenAddress,
          abi: propertyTokenABI,
          functionName: "balanceOf",
          args: [address],
        });
        setTokenBalance(balance);

        // Get staked balance and rewards
        const [staked, earned] = await Promise.all([
          publicClient.readContract({
            address: contractAddress,
            abi: stakingRewardsABI,
            functionName: "balanceOf",
            args: [address],
          }),
          publicClient.readContract({
            address: contractAddress,
            abi: stakingRewardsABI,
            functionName: "earned",
            args: [address],
          })
        ]);

        setStakedBalance(staked);
        setEarnedRewards(earned);

        if (contractAddress) {
          // Get staking history
          const fromBlock = BigInt(0); // Or use a more recent block for efficiency
          const toBlock = await publicClient.getBlockNumber();

          const stakingFilter = await publicClient.createEventFilter({
            address: contractAddress,
            event: parseAbiItem('event Staked(address indexed user, uint256 amount)'),
            fromBlock,
            toBlock,
          });

          const events = await publicClient.getFilterLogs({ filter: stakingFilter });
          const history = events.map(event => ({
            timestamp: new Date(Number(event.args.timestamp || 0) * 1000).toLocaleDateString(),
            stakedAmount: formatEther(event.args.amount || 0n),
            rewards: formatEther(event.args.reward || 0n)
          }));

          setStakingHistory(history);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch staking data",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [tokenAddress, isConnected, address, publicClient]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!address || !publicClient) return;

      try {
        const whitelistContract = process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS as `0x${string}`;
        const owner = await publicClient.readContract({
          address: whitelistContract,
          abi: whitelistABI,
          functionName: "owner",
          args: [],
        });
        setIsWhitelistAdmin(owner.toLowerCase() === address.toLowerCase());
      } catch (error) {
        console.error("Error checking whitelist admin:", error);
      }
    };

    checkAdmin();
  }, [address, publicClient]);

  useEffect(() => {
    const checkWhitelist = async () => {
      if (!address || !publicClient) return;

      try {
        const whitelistContract = process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS as `0x${string}`;
        
        // Check if user is admin
        const owner = await publicClient.readContract({
          address: whitelistContract,
          abi: whitelistABI,
          functionName: "owner",
          args: [],
        });
        setIsWhitelistAdmin(owner.toLowerCase() === address.toLowerCase());

        // Check if user is whitelisted
        const isWhitelisted = await publicClient.readContract({
          address: whitelistContract,
          abi: whitelistABI,
          functionName: "isWhitelisted",
          args: [address],
        });
        setIsUserWhitelisted(isWhitelisted);
      } catch (error) {
        console.error("Error checking whitelist:", error);
      }
    };

    checkWhitelist();
  }, [address, publicClient]);

  // Handle staking
  const handleStake = async () => {
    if (!stakingAddress || !amount || !isConnected || !address || !walletClient || !isUserWhitelisted) {
      toast({
        title: "Error",
        description: "Please connect your wallet, enter an amount and ensure you are whitelisted",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      console.log("Token address:", tokenAddress);
      console.log("Staking address:", stakingAddress);
      console.log("User address:", address);

      // Check if property is active
      const propertyDetails = await publicClient.readContract({
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: "propertyDetails",
        args: [],
      });

      console.log("Property details:", propertyDetails);
      
      if (!propertyDetails[5]) { // isActive is at index 5
        toast({
          title: "Error",
          description: "This property token is not active",
          variant: "destructive",
        });
        return;
      }

      // Check if user is whitelisted
      const isWhitelisted = await publicClient.readContract({
        address: process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS as `0x${string}`,
        abi: whitelistABI,
        functionName: "isWhitelisted",
        args: [address],
      });

      console.log("Is user whitelisted:", isWhitelisted);

      if (!isWhitelisted) {
        toast({
          title: "Error",
          description: "You need to be whitelisted to interact with this token",
          variant: "destructive",
        });
        return;
      }

      const amountToStake = parseEther(amount);
      console.log("Amount to stake:", formatEther(amountToStake), "tokens");

      // Check token balance
      const balance = await publicClient.readContract({
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: "balanceOf",
        args: [address],
      });

      console.log("User balance:", formatEther(balance), "tokens");

      if (balance < amountToStake) {
        toast({
          title: "Error",
          description: `Insufficient balance. You have ${formatEther(balance)} tokens`,
          variant: "destructive",
        });
        return;
      }

      // Try transferFrom directly
      console.log("Attempting transferFrom...");
      try {
        const { request } = await publicClient.simulateContract({
          account: address,
          address: tokenAddress,
          abi: propertyTokenABI,
          functionName: "transferFrom",
          args: [address, stakingAddress, amountToStake],
        });

        console.log("Sending transferFrom transaction...");
        const hash = await walletClient.writeContract(request);
        console.log("Waiting for transferFrom receipt...");
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log("TransferFrom receipt:", receipt);

        toast({
          title: "Success",
          description: `Successfully transferred ${amount} tokens to staking contract`,
        });
      } catch (error: any) {
        console.error("Error with transferFrom:", error);
        const errorMessage = error?.cause?.reason || error?.message || "Unknown error";
        toast({
          title: "Error",
          description: `Failed to transfer tokens: ${errorMessage}`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Now stake
      console.log("Staking tokens...");
      const { request: stakeRequest } = await publicClient.simulateContract({
        account: address,
        address: stakingAddress,
        abi: stakingRewardsABI,
        functionName: "stake",
        args: [amountToStake],
      });

      const stakeTx = await walletClient.writeContract(stakeRequest);
      const stakeReceipt = await publicClient.waitForTransactionReceipt({ hash: stakeTx });
      console.log("Stake receipt:", stakeReceipt);

      toast({
        title: "Success",
        description: `Successfully staked ${amount} tokens`,
      });

      // Refresh balances
      const [newStaked, newEarned, newBalance] = await Promise.all([
        publicClient.readContract({
          address: stakingAddress,
          abi: stakingRewardsABI,
          functionName: "balanceOf",
          args: [address],
        }),
        publicClient.readContract({
          address: stakingAddress,
          abi: stakingRewardsABI,
          functionName: "earned",
          args: [address],
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: propertyTokenABI,
          functionName: "balanceOf",
          args: [address],
        })
      ]);

      setStakedBalance(newStaked);
      setEarnedRewards(newEarned);
      setTokenBalance(newBalance);
      setAmount("");

    } catch (error: any) {
      console.error("Error staking:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to stake tokens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle withdraw
  const handleWithdraw = async () => {
    if (!stakingAddress || !amount || !isConnected || !isUserWhitelisted) return;

    try {
      setLoading(true);
      const amountToWithdraw = parseEther(amount);

      const withdrawTx = await walletClient?.writeContract({
        address: stakingAddress,
        abi: stakingRewardsABI,
        functionName: "withdraw",
        args: [amountToWithdraw],
      });

      if (withdrawTx) {
        await publicClient.waitForTransactionReceipt({ hash: withdrawTx });
        toast({
          title: "Success",
          description: `Successfully withdrawn ${amount} tokens`,
        });
        setAmount("");
      }
    } catch (error) {
      console.error("Error withdrawing:", error);
      toast({
        title: "Error",
        description: "Failed to withdraw tokens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle claim rewards
  const handleClaimRewards = async () => {
    if (!stakingAddress || !isConnected || !isUserWhitelisted) return;

    try {
      setLoading(true);
      const claimTx = await walletClient?.writeContract({
        address: stakingAddress,
        abi: stakingRewardsABI,
        functionName: "getReward",
      });

      if (claimTx) {
        await publicClient.waitForTransactionReceipt({ hash: claimTx });
        toast({
          title: "Success",
          description: "Successfully claimed rewards",
        });
      }
    } catch (error) {
      console.error("Error claiming rewards:", error);
      toast({
        title: "Error",
        description: "Failed to claim rewards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Contract Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Staking Contract Info</CardTitle>
          <CardDescription>
            Stake your property tokens to earn EURC rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Property Token Address</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 p-2 bg-muted rounded-md text-sm break-all">
                  {tokenAddress}
                </code>
              </div>
            </div>
            <div>
              <Label>Staking Contract Address</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 p-2 bg-muted rounded-md text-sm break-all">
                  {stakingAddress}
                </code>
              </div>
            </div>
            <div>
              <Label>Property Status</Label>
              <div className="flex items-center gap-2 mt-1">
                <div className={`px-2 py-1 rounded-full text-sm ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
          </div>

          {isWhitelistAdmin && (
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    if (!stakingAddress || !address || !walletClient) return;

                    const whitelistContract = process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS as `0x${string}`;
                    
                    // Check if already whitelisted
                    const isWhitelisted = await publicClient.readContract({
                      address: whitelistContract,
                      abi: whitelistABI,
                      functionName: "isWhitelisted",
                      args: [stakingAddress],
                    });

                    if (isWhitelisted) {
                      toast({
                        title: "Info",
                        description: "Staking contract is already whitelisted",
                      });
                      return;
                    }

                    const { request } = await publicClient.simulateContract({
                      account: address,
                      address: whitelistContract,
                      abi: whitelistABI,
                      functionName: "addToWhitelist",
                      args: [stakingAddress],
                    });

                    const hash = await walletClient.writeContract(request);
                    await publicClient.waitForTransactionReceipt({ hash });

                    toast({
                      title: "Success",
                      description: "Staking contract has been whitelisted",
                    });
                  } catch (error: any) {
                    console.error("Error whitelisting:", error);
                    toast({
                      title: "Error",
                      description: error.message || "Failed to whitelist staking contract",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Whitelist Staking Contract
              </Button>
            </div>
          )}

          {!isUserWhitelisted && isWhitelistAdmin && (
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    if (!address || !walletClient) return;

                    const whitelistContract = process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS as `0x${string}`;

                    const { request } = await publicClient.simulateContract({
                      account: address,
                      address: whitelistContract,
                      abi: whitelistABI,
                      functionName: "addToWhitelist",
                      args: [address],
                    });

                    const hash = await walletClient?.writeContract(request);
                    await publicClient.waitForTransactionReceipt({ hash });

                    setIsUserWhitelisted(true);
                    toast({
                      title: "Success",
                      description: "Your address has been whitelisted",
                    });
                  } catch (error: any) {
                    console.error("Error whitelisting:", error);
                    toast({
                      title: "Error",
                      description: error.message || "Failed to whitelist your address",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Whitelist My Address
              </Button>
            </div>
          )}

          {!isUserWhitelisted && !isWhitelistAdmin && (
            <div className="mt-4 p-4 border rounded-lg bg-yellow-50">
              <p className="text-yellow-800">
                Your address needs to be whitelisted before you can stake tokens. Please contact the whitelist admin at {process.env.NEXT_PUBLIC_WHITELIST_ADMIN_ADDRESS}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staking Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Staking Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>APR</Label>
              <div className="text-2xl font-bold">{apr}%</div>
              <div className="text-sm text-muted-foreground">
                Period ends: {endDateStr}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Your Stake</Label>
              <div className="text-2xl font-bold">
                {formatEther(stakedBalance)}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Earned Rewards</Label>
              <div className="text-2xl font-bold text-green-600">
                {formatEther(earnedRewards)} EURC
              </div>
            </div>
            <div className="space-y-2">
              <Label>Available Balance</Label>
              <div className="text-2xl font-bold">
                {formatEther(tokenBalance)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staking Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Staking Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="stake">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stake">Stake</TabsTrigger>
              <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            </TabsList>
            <TabsContent value="stake">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount to Stake</Label>
                  <Input
                    type="text"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleStake}
                  disabled={loading || !isConnected || !isUserWhitelisted}
                >
                  {loading ? <Spinner className="mr-2 h-4 w-4" /> : <ArrowUpIcon className="mr-2 h-4 w-4" />}
                  Stake Tokens
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="withdraw">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount to Withdraw</Label>
                  <Input
                    type="text"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleWithdraw}
                  disabled={loading || !isConnected || !isUserWhitelisted}
                >
                  {loading ? <Spinner className="mr-2 h-4 w-4" /> : <ArrowDownIcon className="mr-2 h-4 w-4" />}
                  Withdraw Tokens
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleClaimRewards}
            disabled={loading || !isConnected || earnedRewards <= BigInt(0) || !isUserWhitelisted}
          >
            {loading ? <Spinner className="mr-2 h-4 w-4" /> : <CoinsIcon className="mr-2 h-4 w-4" />}
            Claim Rewards
          </Button>
        </CardFooter>
      </Card>

      {/* Staking History Chart */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Staking History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stakingHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="stakedAmount" stroke="#8884d8" />
                <Line type="monotone" dataKey="rewards" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
