"use client";

import { Spinner } from "@/components/ui/spinner";
import { useEffect, useState } from "react";
import { formatUnits, parseUnits, formatEther } from "viem";
import { useAccount, usePublicClient, useChainId } from "wagmi";
import { useToast } from "@/components/ui/use-toast";
import { StakingOverview } from "./components/StakingOverview";
import { StakingHistory } from "./components/StakingHistory";
import { StakingControls } from "./components/StakingControls";
import { WithdrawControls } from "./components/WithdrawControls";
import { PropertyOverview } from "./components/PropertyOverview";
import { ContractAddresses } from "./components/ContractAddresses";
import { stakingFactoryV2ABI, stakingRewardsV2ABI } from "@/lib/contracts";
import { propertyTokenABI } from "@/contracts";
import { supabase } from "@/lib/supabase";

const NETWORK_CONFIG = {
  1: { name: 'Ethereum', explorer: 'https://etherscan.io' },
  5: { name: 'Goerli', explorer: 'https://goerli.etherscan.io' },
  11155111: { name: 'Sepolia', explorer: 'https://sepolia.etherscan.io' },
};

interface PropertyDetails {
  id: string;
  title: string;
  description: string;
  location: string;
  image_url: string;
  price: number;
  is_active: boolean;
  token_address: string;
}

export default function StakeProperty({ params }: { params: { tokenAddress: string } }) {
  const tokenAddress = params.tokenAddress as string;
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { toast } = useToast();

  // State management
  const [loading, setLoading] = useState(false);
  const [stakingAddress, setStakingAddress] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<bigint>(0n);
  const [stakedBalance, setStakedBalance] = useState<bigint>(0n);
  const [earnedRewards, setEarnedRewards] = useState<bigint>(0n);
  const [apr, setApr] = useState<number>(0);
  const [endDateStr, setEndDateStr] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [owner, setOwner] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails | null>(null);
  const [stakingHistory, setStakingHistory] = useState<any[]>([]);
  const [rewardsHistory, setRewardsHistory] = useState<any[]>([]);
  const [totalStaked, setTotalStaked] = useState<bigint>(0n);
  const [rewardRate, setRewardRate] = useState<bigint>(0n);

  // Contract addresses state
  const [contractAddresses, setContractAddresses] = useState({
    propertyToken: tokenAddress,
    stakingContract: '',
    stakingFactory: process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS || '',
    rewardToken: process.env.NEXT_PUBLIC_EURC_ADDRESS || '',
  });

  // Staking amount state
  const [amount, setAmount] = useState("");
  const [amountPercentage, setAmountPercentage] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPercentage, setWithdrawPercentage] = useState(0);
  const [maxAmount, setMaxAmount] = useState<bigint>(0n);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      if (!tokenAddress) {
        console.error("Token address is required");
        return;
      }

      setLoading(true);
      console.log("Starting to fetch property data from Supabase for token:", tokenAddress);

      try {
        // First try to get all tables to debug
        const { data: tables } = await supabase
          .from('property_requests')
          .select('*')
          .limit(1);

        console.log("Available data in property_requests:", tables);

        // Fetch property details from Supabase with case-insensitive match
        const { data: properties, error: propertyError } = await supabase
          .from('property_requests')
          .select('*')
          .ilike('token_address', tokenAddress)
          .maybeSingle();

          setPropertyDetails(properties);

          console.log("Property details fetched from Supabase:", properties);


        // Only fetch blockchain data if wallet is connected
        if (!isConnected || !address || !publicClient) {
          console.log("Wallet not connected, skipping blockchain data fetch");
          setLoading(false);
          return;
        }

        // Get staking contract
        console.log("Fetching staking contract...");
        const stakingFactory = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
        if (!stakingFactory) {
          throw new Error("Staking factory address not found");
        }

        const stakingInfo = await publicClient.readContract({
          address: stakingFactory as `0x${string}`,
          abi: stakingFactoryV2ABI,
          functionName: "stakingContracts",
          args: [tokenAddress],
        });

        console.log("Staking contract info:", stakingInfo);

        if (stakingInfo.contractAddress) {
          console.log("Fetching staking details...");
          // Get reward token address from staking contract
          const rewardTokenAddress = await publicClient.readContract({
            address: stakingInfo.contractAddress as `0x${string}`,
            abi: stakingRewardsV2ABI,
            functionName: "rewardToken",
          });

          console.log("Reward token address:", rewardTokenAddress);

          setContractAddresses(prev => ({
            ...prev,
            stakingContract: stakingInfo.contractAddress,
            rewardToken: rewardTokenAddress as string,
          }));

          // Get user balances and contract info
          const [balance, staked, earned, total, rate, finishAt] = await Promise.all([
            // Token balance
            publicClient.readContract({
              address: tokenAddress as `0x${string}`,
              abi: propertyTokenABI,
              functionName: "balanceOf",
              args: [address],
            }),
            // Staked balance
            publicClient.readContract({
              address: stakingInfo.contractAddress as `0x${string}`,
              abi: stakingRewardsV2ABI,
              functionName: "balanceOf",
              args: [address],
            }),
            // Earned rewards
            publicClient.readContract({
              address: stakingInfo.contractAddress as `0x${string}`,
              abi: stakingRewardsV2ABI,
              functionName: "earned",
              args: [address],
            }),
            // Total supply
            publicClient.readContract({
              address: stakingInfo.contractAddress as `0x${string}`,
              abi: stakingRewardsV2ABI,
              functionName: "totalSupply",
            }),
            // Reward rate
            publicClient.readContract({
              address: stakingInfo.contractAddress as `0x${string}`,
              abi: stakingRewardsV2ABI,
              functionName: "rewardRate",
            }),
            // Finish time
            publicClient.readContract({
              address: stakingInfo.contractAddress as `0x${string}`,
              abi: stakingRewardsV2ABI,
              functionName: "finishAt",
            }),
          ]);

          setTokenBalance(balance as bigint);
          setStakedBalance(staked as bigint);
          setEarnedRewards(earned as bigint);
          setTotalStaked(total as bigint);
          setRewardRate(rate as bigint);
          setEndDateStr(new Date(Number(finishAt) * 1000).toLocaleString());

          // Calculate APR
          const annualRewards = Number(formatUnits(rate as bigint, 18)) * 365 * 24 * 60 * 60;
          const totalStakedValue = Number(formatUnits(total as bigint, 18));
          const aprValue = totalStakedValue > 0 ? (annualRewards / totalStakedValue) * 100 : 0;
          setApr(aprValue);

          setIsActive(stakingInfo.isActive);
          setStakingAddress(stakingInfo.contractAddress);
          setMaxAmount(balance as bigint);

          // Fetch staking history
          const stakingFilter = await publicClient.createEventFilter({
            address: stakingInfo.contractAddress as `0x${string}`,
            event: {
              type: 'event',
              name: 'Staked',
              inputs: [
                { type: 'address', name: 'user', indexed: true },
                { type: 'uint256', name: 'amount' }
              ]
            },
            fromBlock: 'earliest'
          });

          const stakingLogs = await publicClient.getFilterLogs({ filter: stakingFilter });
          
          // Fetch reward history
          const rewardFilter = await publicClient.createEventFilter({
            address: stakingInfo.contractAddress as `0x${string}`,
            event: {
              type: 'event',
              name: 'RewardPaid',
              inputs: [
                { type: 'address', name: 'user', indexed: true },
                { type: 'uint256', name: 'reward' }
              ]
            },
            fromBlock: 'earliest'
          });

          const rewardLogs = await publicClient.getFilterLogs({ filter: rewardFilter });

          // Store staking history in Supabase
          const processedStakingHistory = await Promise.all(
            stakingLogs
              .filter(log => log.args.user?.toLowerCase() === address.toLowerCase())
              .map(async log => {
                const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
                const historyEntry = {
                  user_address: address.toLowerCase(),
                  property_token: tokenAddress.toLowerCase(),
                  amount: Number(formatUnits(log.args.amount || 0n, 18)),
                  timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
                  transaction_hash: log.transactionHash,
                  type: 'stake'
                };

                // Store in Supabase
                const { error: insertError } = await supabase
                  .from('staking_history')
                  .upsert(historyEntry, {
                    onConflict: 'transaction_hash'
                  });

                if (insertError) {
                  console.error("Error storing staking history:", insertError);
                }

                return {
                  dateTime: new Date(Number(block.timestamp) * 1000).toLocaleString(),
                  amount: historyEntry.amount,
                };
              })
          );

          // Store rewards history in Supabase
          const processedRewardHistory = await Promise.all(
            rewardLogs
              .filter(log => log.args.user?.toLowerCase() === address.toLowerCase())
              .map(async log => {
                const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
                const historyEntry = {
                  user_address: address.toLowerCase(),
                  property_token: tokenAddress.toLowerCase(),
                  amount: Number(formatUnits(log.args.reward || 0n, 18)),
                  timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
                  transaction_hash: log.transactionHash,
                  type: 'reward'
                };

                // Store in Supabase
                const { error: insertError } = await supabase
                  .from('staking_history')
                  .upsert(historyEntry, {
                    onConflict: 'transaction_hash'
                  });

                if (insertError) {
                  console.error("Error storing reward history:", insertError);
                }

                return {
                  timestamp: new Date(Number(block.timestamp) * 1000).toLocaleString(),
                  reward: historyEntry.amount,
                };
              })
          );

          setStakingHistory(processedStakingHistory);
          setRewardsHistory(processedRewardHistory);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch staking data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh data every minute
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [tokenAddress, isConnected, address, publicClient]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PropertyOverview propertyDetails={propertyDetails} />
        <StakingOverview
          apr={apr}
          totalStaked={totalStaked}
          rewardRate={rewardRate}
          endDateStr={endDateStr}
          formatNumber={formatNumber}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <StakingHistory
          stakingHistory={stakingHistory}
          rewardsHistory={rewardsHistory}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StakingControls
          tokenBalance={tokenBalance}
          amount={amount}
          setAmount={setAmount}
          amountPercentage={amountPercentage}
          setAmountPercentage={setAmountPercentage}
          maxAmount={maxAmount}
          stakingAddress={stakingAddress}
          propertyToken={tokenAddress as `0x${string}`}
        />
        <WithdrawControls
          stakedBalance={stakedBalance}
          withdrawAmount={withdrawAmount}
          setWithdrawAmount={setWithdrawAmount}
          withdrawPercentage={withdrawPercentage}
          setWithdrawPercentage={setWithdrawPercentage}
          earnedRewards={earnedRewards}
          stakingAddress={stakingAddress}
        />
      </div>

      <ContractAddresses
        addresses={contractAddresses}
        chainId={chainId}
        networkConfig={NETWORK_CONFIG}
      />
    </div>
  );
}

const formatNumber = (value: string | number, decimals = 2) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};
