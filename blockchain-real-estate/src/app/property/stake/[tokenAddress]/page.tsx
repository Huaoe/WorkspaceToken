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
import { stakingFactoryV2ABI, stakingRewardsV2ABI, propertyTokenABI, eurcABI } from "@/lib/contracts";
import { formatUnits, parseUnits } from "viem";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpIcon, ArrowDownIcon, CoinsIcon, TimerIcon } from "lucide-react";
import { parseAbiItem } from "viem";
import { whitelistABI } from "@/contracts";
import { StakingInitButton } from "./components/StakingInitButton";

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
  const [contractStatus, setContractStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!tokenAddress || !isConnected || !address || !publicClient) return;

      try {
        // Verify property token exists
        try {
          const [name, symbol] = await Promise.all([
            publicClient.readContract({
              address: tokenAddress as `0x${string}`,
              abi: propertyTokenABI,
              functionName: "name",
            }),
            publicClient.readContract({
              address: tokenAddress as `0x${string}`,
              abi: propertyTokenABI,
              functionName: "symbol",
            }),
          ]);
          
          if (!name || !symbol) {
            throw new Error('Invalid property token');
          }

        } catch (error) {
          console.error('Error verifying property token:', error);
          throw new Error('Invalid property token address');
        }

        // Get staking factory address
        const stakingFactory = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
        if (!stakingFactory) {
          throw new Error('Staking factory address not found');
        }

        // Get staking contract info from factory
        const stakingInfo = await publicClient.readContract({
          address: stakingFactory as `0x${string}`,
          abi: stakingFactoryV2ABI,
          functionName: "stakingContracts",
          args: [tokenAddress as `0x${string}`],
        });

        if (!stakingInfo.contractAddress || stakingInfo.contractAddress === "0x0000000000000000000000000000000000000000") {
          throw new Error('No staking contract found for this property token');
        }

        console.log("Staking Contract Info: ", stakingInfo);

        // Get finish time
        const finishAt = await publicClient.readContract({
          address: stakingInfo.contractAddress,
          abi: stakingRewardsV2ABI,
          functionName: "finishAt",
        });

        const finishDate = new Date(Number(finishAt) * 1000);
        console.log("Staking period ends:", finishDate.toLocaleDateString());

        // Get reward rate for APR calculation
        const rewardRate = await publicClient.readContract({
          address: stakingInfo.contractAddress,
          abi: stakingRewardsV2ABI,
          functionName: "rewardRate",
        });

        // Calculate APR (reward per year)
        const rewardsPerYear = (rewardRate * BigInt(31536000)); // seconds in a year
        const apr = Number(formatUnits(rewardsPerYear, 6)); // Assuming 6 decimals for EURC

        // Get user's staked balance and earned rewards
        if (address) {
          try {
            const earnedRewards = await publicClient.readContract({
              address: stakingInfo.contractAddress,
              abi: stakingRewardsV2ABI,
              functionName: "earned",
              args: [address],
            });

            setEarnedRewards(earnedRewards);
          } catch (error) {
            console.error("Error fetching earned rewards:", error);
          }
        }

        // Get token balance
        if (address) {
          try {
            const balance = await publicClient.readContract({
              address: tokenAddress as `0x${string}`,
              abi: eurcABI,
              functionName: "balanceOf",
              args: [address],
            });
            setTokenBalance(balance);
          } catch (error) {
            console.error("Error fetching token balance:", error);
          }
        }

        // Get contract owner
        const ownerAddress = await publicClient.readContract({
          address: stakingInfo.contractAddress,
          abi: stakingRewardsV2ABI,
          functionName: "owner",
        });
        
        setOwner(ownerAddress);
        setIsOwner(ownerAddress.toLowerCase() === address.toLowerCase());
        console.log("Contract owner:", ownerAddress);
        console.log("Current address:", address);
        console.log("Is owner:", ownerAddress.toLowerCase() === address.toLowerCase());

        setStakingAddress(stakingInfo.contractAddress);
        setApr(apr);
        setEndDateStr(finishDate.toLocaleDateString());

        // Get staking history
        const fromBlock = BigInt(0); // Or use a more recent block for efficiency
        const toBlock = await publicClient.getBlockNumber();

        const stakingFilter = await publicClient.createEventFilter({
          address: stakingInfo.contractAddress as `0x${string}`,
          event: parseAbiItem('event Staked(address indexed user, uint256 amount)'),
          fromBlock,
          toBlock,
        });

        const events = await publicClient.getFilterLogs({ filter: stakingFilter });
        const history = events.map(event => ({
          timestamp: new Date(Number(event.args.timestamp || 0) * 1000).toLocaleDateString(),
          stakedAmount: formatUnits(event.args.amount || 0n, 18),
          rewards: formatUnits(event.args.reward || 0n, 18)
        }));

        setStakingHistory(history);
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

  const checkStakingContractStatus = async () => {
    if (!stakingAddress || !publicClient) return;

    try {
      const eurcAddress = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;
      if (!eurcAddress) {
        setError("EURC token address not configured");
        return;
      }

      // Get contract balances and settings
      const [rewardBalance, rewardRate, finishAt] = await Promise.all([
        publicClient.readContract({
          address: eurcAddress as `0x${string}`,
          abi: eurcABI,
          functionName: "balanceOf",
          args: [stakingAddress],
        }),
        publicClient.readContract({
          address: stakingAddress,
          abi: stakingRewardsV2ABI,
          functionName: "rewardRate",
        }),
        publicClient.readContract({
          address: stakingAddress,
          abi: stakingRewardsV2ABI,
          functionName: "finishAt",
        })
      ]);

      const now = BigInt(Math.floor(Date.now() / 1000));
      const formattedBalance = formatUnits(rewardBalance, 6);
      const formattedRate = formatUnits(rewardRate, 6);

      let status = "";
      if (rewardBalance === 0n) {
        status = " Contract needs EURC funding";
      } else if (rewardRate === 0n) {
        status = " Rewards not configured";
      } else if (finishAt < now) {
        status = " Staking period ended";
      } else {
        status = " Ready for staking";
      }

      setContractStatus({
        balance: formattedBalance,
        rate: formattedRate,
        status,
        finishAt: new Date(Number(finishAt) * 1000).toLocaleDateString()
      });
    } catch (error) {
      console.error("Error checking contract status:", error);
      setError("Failed to check contract status");
    }
  };

  useEffect(() => {
    if (stakingAddress && publicClient) {
      checkStakingContractStatus();
    }
  }, [stakingAddress, publicClient]);

  // Handle staking
  const handleStake = async (amount: string) => {
    if (!stakingAddress || !address || !walletClient || !publicClient) return;

    try {
      setLoading(true);
      const amountBigInt = parseUnits(amount, 18);

      // 1. Verify contracts and staking period
      console.log("Verifying contracts...");
      
      // Get staking contract info
      const stakingFactory = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
      if (!stakingFactory) throw new Error("Staking factory not configured");

      const stakingInfo = await publicClient.readContract({
        address: stakingFactory as `0x${string}`,
        abi: stakingFactoryV2ABI,
        functionName: "stakingContracts",
        args: [tokenAddress as `0x${string}`],
      });

      console.log("Staking contract info:", stakingInfo);
      
      if (!stakingInfo.isActive) {
        throw new Error("Staking is not active for this token");
      }

      // Check staking period
      const [finishAt, lastTimeRewardApplicable, rewardRate] = await Promise.all([
        publicClient.readContract({
          address: stakingAddress,
          abi: stakingRewardsV2ABI,
          functionName: "finishAt",
        }),
        publicClient.readContract({
          address: stakingAddress,
          abi: stakingRewardsV2ABI,
          functionName: "lastTimeRewardApplicable",
        }),
        publicClient.readContract({
          address: stakingAddress,
          abi: stakingRewardsV2ABI,
          functionName: "rewardRate",
        })
      ]);

      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      console.log("Staking period:", {
        finishAt,
        lastTimeRewardApplicable,
        rewardRate,
        currentTime
      });

      // Check if staking is allowed
      if (currentTime > finishAt) {
        throw new Error("Staking period has ended");
      }

      if (rewardRate === 0n) {
        throw new Error("Staking rewards not configured");
      }

      // 2. Check balances and allowances
      const [balance, allowance] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: eurcABI,
          functionName: "balanceOf",
          args: [address],
        }),
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: eurcABI,
          functionName: "allowance",
          args: [address, stakingAddress],
        })
      ]);

      console.log("Token state:", {
        balance: formatUnits(balance, 18),
        allowance: formatUnits(allowance, 18),
        amountToStake: formatUnits(amountBigInt, 18)
      });

      if (balance < amountBigInt) {
        throw new Error(`Insufficient balance. You have ${formatUnits(balance, 18)} tokens`);
      }

      // 3. Approve if needed
      if (allowance < amountBigInt) {
        console.log("Approving tokens...");

        // Then approve max amount
        const maxUint256 = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935");
        
        const { request: approveRequest } = await publicClient.simulateContract({
          account: address,
          address: tokenAddress as `0x${string}`,
          abi: eurcABI,
          functionName: "approve",
          args: [stakingAddress, maxUint256],
        });

        toast({
          title: "Approval Required",
          description: "Please approve to allow staking",
        });

        const approveHash = await walletClient.writeContract(approveRequest);
        await publicClient.waitForTransactionReceipt({ hash: approveHash });

        // Verify approval
        const newAllowance = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: eurcABI,
          functionName: "allowance",
          args: [address, stakingAddress],
        });

        console.log("New allowance:", formatUnits(newAllowance, 18));

        if (newAllowance < amountBigInt) {
          throw new Error("Approval failed. Please try again.");
        }

        toast({
          title: "Approved",
          description: "Now attempting to stake tokens...",
        });
      }

      // 4. Stake tokens
      console.log("Staking tokens...");
      const { request } = await publicClient.simulateContract({
        account: address,
        address: stakingAddress,
        abi: stakingRewardsV2ABI,
        functionName: "stake",
        args: [amountBigInt],
      });

      const hash = await walletClient.writeContract(request);
      
      toast({
        title: "Staking...",
        description: "Please wait for confirmation",
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Stake transaction receipt:", receipt);

      toast({
        title: "Success",
        description: `Successfully staked ${amount} tokens`,
      });

      // Refresh data
      const fetchData = async () => {
        if (!tokenAddress || !isConnected || !address || !publicClient) return;

        try {
          // Verify property token exists
          try {
            const [name, symbol] = await Promise.all([
              publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: propertyTokenABI,
                functionName: "name",
              }),
              publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: propertyTokenABI,
                functionName: "symbol",
              }),
            ]);
            
            if (!name || !symbol) {
              throw new Error('Invalid property token');
            }

          } catch (error) {
            console.error('Error verifying property token:', error);
            throw new Error('Invalid property token address');
          }

          // Get staking factory address
          const stakingFactory = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
          if (!stakingFactory) {
            throw new Error('Staking factory address not found');
          }

          // Get staking contract info from factory
          const stakingInfo = await publicClient.readContract({
            address: stakingFactory as `0x${string}`,
            abi: stakingFactoryV2ABI,
            functionName: "stakingContracts",
            args: [tokenAddress as `0x${string}`],
          });

          if (!stakingInfo.contractAddress || stakingInfo.contractAddress === "0x0000000000000000000000000000000000000000") {
            throw new Error('No staking contract found for this property token');
          }

          console.log("Staking Contract Info: ", stakingInfo);

          // Get finish time
          const finishAt = await publicClient.readContract({
            address: stakingInfo.contractAddress,
            abi: stakingRewardsV2ABI,
            functionName: "finishAt",
          });

          const finishDate = new Date(Number(finishAt) * 1000);
          console.log("Staking period ends:", finishDate.toLocaleDateString());

          // Get reward rate for APR calculation
          const rewardRate = await publicClient.readContract({
            address: stakingInfo.contractAddress,
            abi: stakingRewardsV2ABI,
            functionName: "rewardRate",
          });

          // Calculate APR (reward per year)
          const rewardsPerYear = (rewardRate * BigInt(31536000)); // seconds in a year
          const apr = Number(formatUnits(rewardsPerYear, 6)); // Assuming 6 decimals for EURC

          // Get user's staked balance and earned rewards
          if (address) {
            try {
              const earnedRewards = await publicClient.readContract({
                address: stakingInfo.contractAddress,
                abi: stakingRewardsV2ABI,
                functionName: "earned",
                args: [address],
              });

              setEarnedRewards(earnedRewards);
            } catch (error) {
              console.error("Error fetching earned rewards:", error);
            }
          }

          // Get token balance
          if (address) {
            try {
              const balance = await publicClient.readContract({
                address: tokenAddress as `0x${string}`,
                abi: eurcABI,
                functionName: "balanceOf",
                args: [address],
              });
              setTokenBalance(balance);
            } catch (error) {
              console.error("Error fetching token balance:", error);
            }
          }

          setStakingAddress(stakingInfo.contractAddress);
          setApr(apr);
          setEndDateStr(finishDate.toLocaleDateString());

          // Get staking history
          const fromBlock = BigInt(0); // Or use a more recent block for efficiency
          const toBlock = await publicClient.getBlockNumber();

          const stakingFilter = await publicClient.createEventFilter({
            address: stakingInfo.contractAddress as `0x${string}`,
            event: parseAbiItem('event Staked(address indexed user, uint256 amount)'),
            fromBlock,
            toBlock,
          });

          const events = await publicClient.getFilterLogs({ filter: stakingFilter });
          const history = events.map(event => ({
            timestamp: new Date(Number(event.args.timestamp || 0) * 1000).toLocaleDateString(),
            stakedAmount: formatUnits(event.args.amount || 0n, 18),
            rewards: formatUnits(event.args.reward || 0n, 18)
          }));

          setStakingHistory(history);
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
    } catch (error: any) {
      console.error("Full error:", error);
      
      let errorMessage = "Failed to stake tokens";
      
      if (error.message.includes("Staking rewards not configured")) {
        errorMessage = "Staking rewards not configured. Please try again later.";
      } else if (error.message.includes("Staking period has ended")) {
        errorMessage = "Staking period has ended";
      } else if (error.message.includes("ERC20InsufficientAllowance") || error.message.includes("0x584a7938")) {
        errorMessage = "Staking period has not started yet";  // 0x584a7938 = StakingPeriodNotStarted
      } else if (error.message.includes("ERC20InsufficientBalance")) {
        errorMessage = "Insufficient token balance";
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle withdraw
  const handleWithdraw = async () => {
    if (!stakingAddress || !amount || !isConnected || !isUserWhitelisted) return;

    try {
      setLoading(true);
      const amountBigInt = parseUnits(amount, 18);

      const [hash] = await walletClient.writeContract({
        address: stakingAddress,
        abi: stakingRewardsV2ABI,
        functionName: "withdraw",
        args: [amountBigInt],
      });

      await publicClient?.waitForTransactionReceipt({ hash });

      // Refresh balances
      const [newBalance, newStaked, newEarned] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: eurcABI,
          functionName: "balanceOf",
          args: [address],
        }),
        publicClient.readContract({
          address: stakingAddress as `0x${string}`,
          abi: stakingRewardsV2ABI,
          functionName: "balanceOf",
          args: [address],
        }),
        publicClient.readContract({
          address: stakingAddress as `0x${string}`,
          abi: stakingRewardsV2ABI,
          functionName: "earned",
          args: [address],
        }),
      ]);

      setStakedBalance(newStaked);
      setEarnedRewards(newEarned);
      setTokenBalance(newBalance);
      setAmount("");

      toast({
        title: "Success",
        description: `Successfully withdrawn ${amount} tokens`,
      });
    } catch (error) {
      console.error("Error withdrawing:", error);
      toast({
        title: "Error",
        description: "Failed to withdraw tokens. Please try again.",
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
      const [hash] = await walletClient.writeContract({
        address: stakingAddress,
        abi: stakingRewardsV2ABI,
        functionName: "getReward",
      });

      await publicClient?.waitForTransactionReceipt({ hash });

      // Refresh balances
      const [newBalance, newStaked, newEarned] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: eurcABI,
          functionName: "balanceOf",
          args: [address],
        }),
        publicClient.readContract({
          address: stakingAddress as `0x${string}`,
          abi: stakingRewardsV2ABI,
          functionName: "balanceOf",
          args: [address],
        }),
        publicClient.readContract({
          address: stakingAddress as `0x${string}`,
          abi: stakingRewardsV2ABI,
          functionName: "earned",
          args: [address],
        }),
      ]);

      setStakedBalance(newStaked);
      setEarnedRewards(newEarned);
      setTokenBalance(newBalance);

      toast({
        title: "Success",
        description: "Successfully claimed rewards",
      });
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

  const handleStartStaking = async () => {
    if (!stakingAddress || !address || !walletClient || !publicClient) return;

    try {
      setLoading(true);

      // 1. Check if caller is owner
      const owner = await publicClient.readContract({
        address: stakingAddress,
        abi: stakingRewardsV2ABI,
        functionName: "owner",
      });

      if (owner.toLowerCase() !== address.toLowerCase()) {
        throw new Error("Only the owner can start the staking period");
      }

      // 2. Set reward rate to start staking period
      const { request } = await publicClient.simulateContract({
        account: address,
        address: stakingAddress,
        abi: stakingRewardsV2ABI,
        functionName: "notifyRewardRate",
        args: [stakingInfo.rewardRate],
      });

      toast({
        title: "Starting staking period...",
        description: "Please confirm the transaction",
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      toast({
        title: "Success",
        description: "Staking period has started!",
      });

      // Refresh data
      fetchData();

    } catch (error: any) {
      console.error("Full error:", error);
      
      let errorMessage = "Failed to start staking period";
      
      if (error.message.includes("Only the owner")) {
        errorMessage = "Only the owner can start the staking period";
      }

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const renderStartStakingButton = () => {
    if (!address || !stakingAddress || !isOwner) return null;

    return (
      <div className="mt-4">
        <p className="text-sm text-gray-500 mb-2">
          You are the contract owner. Start the staking period to allow users to stake.
        </p>
        <Button
          variant="secondary"
          disabled={loading}
          onClick={handleStartStaking}
          className="w-full"
        >
          {loading ? (
            <Spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Start Staking Period"
          )}
        </Button>
      </div>
    );
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
            <div>
              <Label>Contract Owner</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="flex-1 p-2 bg-muted rounded-md text-sm break-all">
                  {owner}
                </code>
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

      {/* Contract Addresses */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Contract Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Property Token</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded text-sm font-mono break-all">
                {tokenAddress}
              </div>
            </div>
            <div>
              <Label>Staking Contract</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded text-sm font-mono break-all">
                {stakingAddress || "Loading..."}
              </div>
            </div>
          </div>
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
                {formatUnits(stakedBalance, 18)}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Earned Rewards</Label>
              <div className="text-2xl font-bold text-green-600">
                {formatUnits(earnedRewards, 18)} EURC
              </div>
            </div>
            <div className="space-y-2">
              <Label>Available Balance</Label>
              <div className="text-2xl font-bold">
                {formatUnits(tokenBalance, 18)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staking Contract Status */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold">Staking Contract Status</h3>
        {contractStatus ? (
          <div className="space-y-2 text-sm">
            <p>Status: {contractStatus.status}</p>
            <p>Contract Address: {stakingAddress}</p>
            <p>EURC Balance: {contractStatus.balance} EURC</p>
            <p>Reward Rate: {contractStatus.rate} EURC/second</p>
            <p>End Date: {contractStatus.finishAt}</p>
            {isWhitelistAdmin && contractStatus.status.includes("Rewards not configured") && (
              <div className="mt-4">
                <StakingInitButton stakingContractAddress={stakingAddress} />
              </div>
            )}
          </div>
        ) : (
          <p>Loading contract status...</p>
        )}
      </div>

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
                  onClick={() => handleStake(amount)}
                  disabled={loading || !isConnected || !isUserWhitelisted}
                >
                  {loading ? <Spinner className="mr-2 h-4 w-4" /> : <ArrowUpIcon className="mr-2 h-4 w-4" />}
                  Stake Tokens
                </Button>
                {renderStartStakingButton()}
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
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
