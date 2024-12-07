"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { usePublicClient } from "wagmi";
import { useReadContract } from "wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";
import { formatUnits } from "viem";
import stakingRewardsJSON from '@contracts/abis/StakingRewards.json';
import propertyTokenJSON from '@contracts/abis/PropertyToken.json';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";

interface PropertyToken {
  address: string;
  balance: bigint;
  details?: any;
  stakedBalance?: bigint;
  earnedRewards?: bigint;
}

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [properties, setProperties] = useState<PropertyToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();
  const stakingFactoryAddress = process.env
    .NEXT_PUBLIC_STAKING_FACTORY_ADDRESS as `0x${string}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchUserProperties() {
      if (!address) return;

      try {
        setLoading(true);
        // Fetch all property requests that are either funding or staking
        const { data: propertyRequests, error } = await supabase
          .from("property_requests")
          .select("*")
          .in("status", ["funding", "staking"]);

        if (error) throw error;

        // For each property, check the user's balance
        const userProperties: PropertyToken[] = [];

        for (const property of propertyRequests) {
          if (!property.token_address) continue;

          try {
            // Get token balance
            const balance = await publicClient.readContract({
              address: property.token_address as `0x${string}`,
              abi: propertyTokenJSON.abi,
              functionName: "balanceOf",
              args: [address],
            });

            // If user has any tokens, get staking info
            if (balance > 0n) {
              let stakedBalance = 0n;
              let earnedRewards = 0n;

              // Get staking contract address if status is staking
              if (property.status === "staking") {
                try {
                  const stakingAddress = await publicClient.readContract({
                    address: stakingFactoryAddress,
                    abi: stakingRewardsJSON.abi,
                    functionName: "getStakingRewards",
                    args: [property.token_address as `0x${string}`],
                  });

                  if (stakingAddress) {
                    // Get staked balance and earned rewards
                    const [staked, earned] = await Promise.all([
                      publicClient.readContract({
                        address: stakingAddress,
                        abi: stakingRewardsJSON.abi,
                        functionName: "balanceOf",
                        args: [address],
                      }),
                      publicClient.readContract({
                        address: stakingAddress,
                        abi: stakingRewardsJSON.abi,
                        functionName: "earned",
                        args: [address],
                      }),
                    ]);

                    stakedBalance = staked;
                    earnedRewards = earned;
                  }
                } catch (error) {
                  console.error("Error fetching staking info:", error);
                }
              }

              userProperties.push({
                address: property.token_address,
                balance,
                details: property,
                stakedBalance,
                earnedRewards,
              });
            }
          } catch (error) {
            console.error(
              `Error fetching balance for property ${property.token_address}:`,
              error
            );
          }
        }

        setProperties(userProperties);
      } catch (error) {
        console.error("Error fetching properties:", error);
        toast({
          title: "Error",
          description: "Failed to load your properties",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    if (isConnected && address) {
      fetchUserProperties();
    }
  }, [
    address,
    isConnected,
    publicClient,
    supabase,
    toast,
    stakingFactoryAddress,
  ]);

  if (!mounted) return null;

  if (!isConnected) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to view your properties
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Properties Found</CardTitle>
            <CardDescription>
              You don't own any property tokens yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/property/list">
              <Button>Browse Properties</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Properties</h1>
          <Link href="/property/list">
            <Button variant="outline">Browse More Properties</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.address} className="overflow-hidden">
              <div className="aspect-video relative">
                <Image
                  src={property.details?.image_url || PLACEHOLDER_IMAGE}
                  alt={property.details?.title || "Property"}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.src = PLACEHOLDER_IMAGE;
                  }}
                />
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{property.details?.title}</CardTitle>
                    <CardDescription>
                      {property.details?.location}
                    </CardDescription>
                  </div>
                  <Badge>{property.details?.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Your Balance
                    </p>
                    <p className="font-medium">
                      {formatUnits(property.balance, 18)} Tokens
                    </p>
                  </div>
                  {property.details?.status === "staking" && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Staked Balance
                        </p>
                        <p className="font-medium">
                          {formatUnits(property.stakedBalance || 0n, 18)} Tokens
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Earned Rewards
                        </p>
                        <p className="font-medium">
                          {formatUnits(property.earnedRewards || 0n, 6)} EURC
                        </p>
                      </div>
                    </>
                  )}
                  <Link
                    href={`/property/${property.address}`}
                    className="w-full"
                  >
                    <Button className="w-full">View Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
