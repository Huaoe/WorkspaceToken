"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { getPropertyTokenContract } from "@/lib/ethereum";
import { useWalletEvents } from "@/app/wallet-events-provider";
import { formatUnits } from "viem";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PropertyRequest {
  id: string;
  title: string;
  description: string;
  location: string;
  expected_price: string;
  number_of_tokens: string;
  token_name: string;
  token_symbol: string;
  token_address?: string;
  roi: number;
  payout_duration: number;
  status: string;
  image_url: string;
  documents_url: string;
  created_at: string;
  updated_at: string;
  staking_contract_address?: string;
  staking_reward_rate?: string;
  staking_duration?: string;
  staking_is_active?: boolean;
}

interface PropertyData {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  price: bigint;
  totalSupply: bigint;
  owner: string;
  soldTokens: bigint;
}

interface PropertyCardProps {
  property?: PropertyRequest;
  address?: string;
  showAdminControls?: boolean;
}

export function PropertyCard({ property, address, showAdminControls }: PropertyCardProps) {
  const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { address: walletAddress } = useWalletEvents();

  useEffect(() => {
    const fetchPropertyData = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        const contract = await getPropertyTokenContract(address);
        const details = await contract.propertyDetails();
        const name = await contract.name();
        const symbol = await contract.symbol();
        const tokenHolder = await contract.tokenHolder();
        const soldTokens = await contract.balanceOf(tokenHolder);
        const totalSupply = await contract.totalSupply();

        const data: PropertyData = {
          name,
          symbol,
          description: details.description,
          imageUrl: details.imageUrl,
          price: BigInt(details.price.toString()),
          totalSupply,
          owner: tokenHolder,
          soldTokens
        };

        setPropertyData(data);
      } catch (error) {
        console.error('Error fetching property data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch property data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchPropertyData();
    } else {
      setLoading(false);
    }
  }, [address, toast]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // If we have a property request, render that
  if (property) {
    return (
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <div className="relative h-48 w-full mb-4">
            <Image
              src={property.image_url || '/images/placeholder.png'}
              alt={property.title}
              fill
              className="object-cover rounded-t-lg"
            />
          </div>
          <CardTitle className="text-2xl">{property.title}</CardTitle>
          <CardDescription>{property.location}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Expected Price</p>
              <p className="font-medium">{property.expected_price} EURC</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Expected APR</p>
              <p className="font-medium">{property.roi}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium capitalize">{property.status}</p>
            </div>
            {showAdminControls && (
              <div className="flex justify-end">
                <Button
                  onClick={() => router.push(`/property/request/${property.id}`)}
                  variant="outline"
                >
                  View Details
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If we have property data from the contract, render that
  if (propertyData) {
    const progress = Number(propertyData.soldTokens) / Number(propertyData.totalSupply) * 100;
    const formattedPrice = formatUnits(propertyData.price, 6);
    const formattedTotalSupply = formatUnits(propertyData.totalSupply, 18);

    return (
      <Card className="w-full">
        <CardHeader className="space-y-1">
          <div className="relative h-48 w-full mb-4">
            <Image
              src={propertyData.imageUrl || '/images/placeholder.png'}
              alt={propertyData.name}
              fill
              className="object-cover rounded-t-lg"
            />
          </div>
          <CardTitle className="text-2xl">{propertyData.name}</CardTitle>
          <CardDescription>{propertyData.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Price per Token</p>
              <p className="font-medium">{formattedPrice} EURC</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Supply</p>
              <p className="font-medium">{Number(formattedTotalSupply).toLocaleString()} Tokens</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Progress</p>
              <Progress value={progress} className="my-2" />
              <p className="text-sm text-gray-500">{progress.toFixed(2)}% Sold</p>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => router.push(`/property/${address}`)}
                variant="outline"
              >
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}