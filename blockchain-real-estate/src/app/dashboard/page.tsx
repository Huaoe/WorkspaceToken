"use client";

import { useEffect, useState } from "react";
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
import { formatUnits } from "ethers";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";
import { useWalletEvents } from "@/app/wallet-events-provider";
import { getPropertyTokenContract, getStakingFactoryContract, getStakingRewardsContract } from "@/lib/ethereum";

interface PropertyToken {
  address: string;
  balance: bigint;
  details?: any;
  stakedBalance?: bigint;
  earnedRewards?: bigint;
}

export default function Dashboard() {
  const { address, isConnected } = useWalletEvents();
  const [properties, setProperties] = useState<PropertyToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

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
            const propertyToken = await getPropertyTokenContract(property.token_address, true);
            const balance = await propertyToken.balanceOf(address);

            // If user has any tokens, get staking info
            if (balance > 0n) {
              let stakedBalance = 0n;
              let earnedRewards = 0n;

              // Get staking contract address if status is staking
              if (property.status === "staking") {
                try {
                  const stakingFactory = getStakingFactoryContract();
                  const stakingAddress = await stakingFactory.getStakingContracts(property.token_address);

                  if (stakingAddress) {
                    const stakingContract = getStakingRewardsContract(stakingAddress);
                    // Get staked balance and earned rewards
                    const [staked, earned] = await Promise.all([
                      stakingContract.balanceOf(address),
                      stakingContract.earned(address),
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
  }, [address, isConnected, supabase, toast]);

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
