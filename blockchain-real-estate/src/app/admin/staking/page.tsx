'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useWalletEvents } from "@/app/wallet-events-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { formatEther, parseUnits, formatUnits } from "viem";
import { stakingRewardsV2ABI } from "@/lib/contracts";
import { getPropertyFactoryContract, getPropertyTokenContract, getStakingFactoryContract, getStakingRewardsContract } from "@/lib/ethereum";

export default function AdminStaking() {
  const [loading, setLoading] = useState(false);
  const [stakingAddress, setStakingAddress] = useState("");
  const [stakingInfo, setStakingInfo] = useState<any>(null);
  const { toast } = useToast();
  const { address, isConnected, publicClient, walletClient } = useWalletEvents();

  const fetchStakingInfo = async () => {
    if (!stakingAddress || !publicClient) return;

    try {
      // Get contract info
      const [owner, rewardToken, stakingToken, duration, finishAt, rewardRate] = await Promise.all([
        publicClient.readContract({
          address: stakingAddress as `0x${string}`,
          abi: stakingRewardsV2ABI,
          functionName: "owner",
        }),
        publicClient.readContract({
          address: stakingAddress as `0x${string}`,
          abi: stakingRewardsV2ABI,
          functionName: "rewardToken",
        }),
        publicClient.readContract({
          address: stakingAddress as `0x${string}`,
          abi: stakingRewardsV2ABI,
          functionName: "stakingToken",
        }),
        publicClient.readContract({
          address: stakingAddress as `0x${string}`,
          abi: stakingRewardsV2ABI,
          functionName: "duration",
        }),
        publicClient.readContract({
          address: stakingAddress as `0x${string}`,
          abi: stakingRewardsV2ABI,
          functionName: "finishAt",
        }),
        publicClient.readContract({
          address: stakingAddress as `0x${string}`,
          abi: stakingRewardsV2ABI,
          functionName: "rewardRate",
        }),
      ]);

      setStakingInfo({
        owner,
        rewardToken,
        stakingToken,
        duration: Number(duration),
        finishAt: new Date(Number(finishAt) * 1000),
        rewardRate: formatEther(rewardRate),
        isOwner: address?.toLowerCase() === owner.toLowerCase(),
      });

      console.log("Staking contract info:", {
        owner,
        rewardToken,
        stakingToken,
        duration: Number(duration),
        finishAt: new Date(Number(finishAt) * 1000),
        rewardRate: formatEther(rewardRate),
      });

    } catch (error) {
      console.error("Error fetching staking info:", error);
      setStakingInfo(null);
    }
  };

  useEffect(() => {
    if (stakingAddress) {
      fetchStakingInfo();
    }
  }, [stakingAddress, publicClient, address]);

  const handleCreateStaking = async (tokenAddress: string) => {
    if (!isConnected || !address) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
      });
      return;
    }

    try {
      setLoading(true);

      // Get property details to calculate rewards
      const propertyToken = getPropertyTokenContract(tokenAddress);
      const propertyDetails = await propertyToken.propertyDetails();
      const propertyPrice = propertyDetails[4]; // Price is at index 4
      
      // Calculate rewards as 8.5% APR of property value
      const rewardsAmount = (propertyPrice * BigInt(85)) / BigInt(1000); // 8.5%
      const rewardsDuration = BigInt(90 * 24 * 60 * 60); // 3 months in seconds

      console.log("Creating staking contract with:", {
        propertyToken: tokenAddress,
        rewardsDuration: rewardsDuration.toString(),
        rewardsAmount: rewardsAmount.toString(),
      });

      // Deploy staking contract through factory
      const stakingFactory = getStakingFactoryContract();

      // Check if staking contract already exists
      const hasStaking = await stakingFactory.hasStakingRewards(tokenAddress);
      if (hasStaking) {
        throw new Error('Staking contract already exists for this property');
      }

      // Create staking contract
      const tx = await stakingFactory.createStakingRewards(
        tokenAddress,
        rewardsDuration,
        rewardsAmount
      );

      console.log("Staking contract deployment transaction:", tx.hash);
      const receipt = await tx.wait();

      if (!receipt.status) {
        throw new Error('Failed to deploy staking contract');
      }

      // Get the newly deployed address
      const newAddress = await stakingFactory.getStakingRewards(tokenAddress);
      console.log("New staking contract deployed at:", newAddress);

      toast({
        title: "Success",
        description: "Successfully created staking contract",
      });
    } catch (error: any) {
      console.error("Creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create staking contract",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartStaking = async () => {
    if (!stakingAddress || !walletClient || !publicClient || !address) {
      toast({
        title: "Error",
        description: "Please connect your wallet and enter a staking contract address",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Calculate reward rate for 8.5% APR
      // For example, if we want to distribute 1000 EURC over 30 days
      const rewardRate = parseUnits("0.000385", 6); // Approximately 1000 EURC over 30 days

      console.log("Starting staking period...");
      console.log("Parameters:");
      console.log("- Staking Contract:", stakingAddress);
      console.log("- Reward Rate:", formatUnits(rewardRate, 6), "EURC/second");

      const { request } = await publicClient.simulateContract({
        account: address,
        address: stakingAddress as `0x${string}`,
        abi: stakingRewardsV2ABI,
        functionName: "notifyRewardRate",
        args: [rewardRate],
      });

      const hash = await walletClient.writeContract(request);
      console.log("Start staking transaction sent:", hash);

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Transaction confirmed:", receipt);

      toast({
        title: "Success",
        description: "Staking period started successfully",
      });
    } catch (error: any) {
      console.error("Error starting staking:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start staking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartStakingPeriod = async () => {
    if (!isConnected || !address || !walletClient || !publicClient) {
      toast({
        title: "Error",
        description: "Please connect your wallet",
      });
      return;
    }

    if (!stakingAddress || !stakingInfo) {
      toast({
        title: "Error",
        description: "Please enter a valid staking contract address",
      });
      return;
    }

    if (!stakingInfo.isOwner) {
      toast({
        title: "Error",
        description: "Only the owner can start the staking period",
      });
      return;
    }

    try {
      setLoading(true);

      // Get reward rate from factory
      const stakingFactory = getStakingFactoryContract();
      const rewardRate = await stakingFactory.rewardRate(stakingAddress);
      console.log("Starting staking period with reward rate:", rewardRate.toString());

      // Start staking period
      const { request } = await publicClient.simulateContract({
        account: address,
        address: stakingAddress as `0x${string}`,
        abi: stakingRewardsV2ABI,
        functionName: "notifyRewardRate",
        args: [rewardRate],
      });

      const hash = await walletClient.writeContract(request);
      console.log("Start staking period transaction:", hash);

      toast({
        title: "Transaction Sent",
        description: "Starting staking period...",
      });
      
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      if (!receipt.status) {
        throw new Error("Failed to start staking period");
      }

      toast({
        title: "Success",
        description: "Successfully started staking period",
      });

      // Refresh data
      fetchStakingInfo();

    } catch (error: any) {
      console.error("Start staking period error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start staking period",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Staking Contract Management</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Staking Contract</CardTitle>
            <CardDescription>
              Create a new staking contract for a property token. Only admin can perform this action.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleCreateStaking("0x79E4D62d828379720db8E0E9511e10e6Bac05351")}
              disabled={loading}
              variant="secondary"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Staking Contract"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Start Staking Period</CardTitle>
            <CardDescription>
              Start the staking period for an existing staking contract. Only the contract owner can perform this action.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="stakingAddress">Staking Contract Address</Label>
                <Input
                  id="stakingAddress"
                  placeholder="0x..."
                  value={stakingAddress}
                  onChange={(e) => setStakingAddress(e.target.value)}
                />
              </div>

              {stakingInfo && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-4">Contract Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Owner</Label>
                      <p className="text-sm font-mono">{stakingInfo.owner}</p>
                    </div>
                    <div>
                      <Label>Reward Token</Label>
                      <p className="text-sm font-mono">{stakingInfo.rewardToken}</p>
                    </div>
                    <div>
                      <Label>Staking Token</Label>
                      <p className="text-sm font-mono">{stakingInfo.stakingToken}</p>
                    </div>
                    <div>
                      <Label>Duration</Label>
                      <p className="text-sm">{stakingInfo.duration} seconds</p>
                    </div>
                    <div>
                      <Label>Finish Time</Label>
                      <p className="text-sm">{stakingInfo.finishAt.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label>Reward Rate</Label>
                      <p className="text-sm">{stakingInfo.rewardRate} EURC/second</p>
                    </div>
                  </div>

                  {/* Start Staking Button */}
                  <div className="mt-6">
                    <Button
                      onClick={handleStartStaking}
                      disabled={loading || !stakingInfo.isOwner}
                      className="w-full"
                    >
                      {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Start Staking Period
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      This will start the staking period with an 8.5% APR reward rate.
                      Only the contract owner can perform this action.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
