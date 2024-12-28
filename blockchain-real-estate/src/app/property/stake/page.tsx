'use client';

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { stakingFactoryV2ABI } from "@/lib/contracts";
import { formatUnits } from "viem";

interface StakingContract {
  propertyToken: string;
  stakingContract: string;
  rewardRate: bigint;
  duration: bigint;
  isActive: boolean;
}

export default function StakingContracts() {
  const [contracts, setContracts] = useState<StakingContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  useEffect(() => {
    async function fetchStakingContracts() {
      if (!publicClient) return;

      try {
        setLoading(true);
        setError(null);

        const stakingFactory = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
        if (!stakingFactory) {
          throw new Error('Staking factory address not found');
        }

        // Get all property tokens from the factory
        const propertyFactory = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS;
        if (!propertyFactory) {
          throw new Error('Property factory address not found');
        }

        // Get all staking contracts
        const stakingContracts: StakingContract[] = [];

        // For now, let's use the property token we know about
        const propertyToken = "0x1768CD2338Fe03BC7b51251f9CB186E234DC9540";
        try {
          const stakingInfo = await publicClient.readContract({
            address: stakingFactory as `0x${string}`,
            abi: stakingFactoryV2ABI,
            functionName: "stakingContracts",
            args: [propertyToken as `0x${string}`],
          });

          if (stakingInfo.contractAddress !== "0x0000000000000000000000000000000000000000") {
            stakingContracts.push({
              propertyToken,
              stakingContract: stakingInfo.contractAddress,
              rewardRate: stakingInfo.rewardRate,
              duration: stakingInfo.duration,
              isActive: stakingInfo.isActive
            });
          }
        } catch (error) {
          console.error("Error fetching staking contract:", error);
        }

        setContracts(stakingContracts);
      } catch (error: any) {
        console.error("Error fetching data:", error);
        setError(error.message || "Failed to fetch staking contracts");
      } finally {
        setLoading(false);
      }
    }

    fetchStakingContracts();
  }, [publicClient]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Staking Contracts</CardTitle>
            <CardDescription>
              View and manage property staking contracts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No staking contracts found
              </div>
            ) : (
              <div className="space-y-4">
                {contracts.map((contract) => (
                  <Card key={contract.stakingContract}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold">Property Token</h3>
                          <p className="mt-1 font-mono text-sm break-all">
                            {contract.propertyToken}
                          </p>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Staking Contract</h3>
                          <p className="mt-1 font-mono text-sm break-all">
                            {contract.stakingContract}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium">Reward Rate</h4>
                            <p>{formatUnits(contract.rewardRate, 6)} EURC/second</p>
                          </div>
                          <div>
                            <h4 className="font-medium">Duration</h4>
                            <p>{Number(contract.duration) / 86400} days</p>
                          </div>
                        </div>
                        <div className="pt-4">
                          <Button asChild className="w-full">
                            <Link href={`/property/stake/${contract.propertyToken}`}>
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
