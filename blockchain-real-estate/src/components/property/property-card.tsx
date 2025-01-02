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
  property: PropertyRequest;
  showAdminControls?: boolean;
}

export function PropertyCard({ property, showAdminControls }: PropertyCardProps) {
  const [onChainData, setOnChainData] = useState<PropertyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { address } = useWalletEvents();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPropertyData() {
      if (!property.token_address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const contract = await getPropertyTokenContract(property.token_address);
        console.log("Fetching property data for:", property.token_address);

        // Get property details
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

        console.log("Property data:", {
          ...data,
          priceFormatted: formatUnits(data.price, 6),
          totalSupplyFormatted: formatUnits(data.totalSupply, 18),
          soldTokensFormatted: formatUnits(data.soldTokens, 18),
          progressPercentage: (Number(formatUnits(data.soldTokens, 18)) / Number(formatUnits(data.totalSupply, 18))) * 100
        });
        
        setOnChainData(data);
      } catch (error: any) {
        console.error("Error fetching property data:", error);
        setError(error.message || "Failed to fetch property data");
      } finally {
        setLoading(false);
      }
    }

    fetchPropertyData();
  }, [property.token_address]);

  const calculateProgress = useCallback((soldTokens: bigint, totalSupply: bigint) => {
    const soldTokensNum = Number(formatUnits(soldTokens, 18));
    const totalSupplyNum = Number(formatUnits(totalSupply, 18));
    const remainingTokens = totalSupplyNum - soldTokensNum;
    const progress = (remainingTokens / totalSupplyNum) * 100;
    return progress;
  }, []);

  const handlePurchaseClick = () => {
    if (!property.token_address) {
      toast({
        title: "Error",
        description: "Property token not yet created",
        variant: "destructive",
      });
      return;
    }
    router.push(`/property/purchase/${property.token_address}`);
  };

  const handleStakeClick = () => {
    if (!property.token_address) {
      toast({
        title: "Error",
        description: "Property token not yet created",
        variant: "destructive",
      });
      return;
    }
    router.push(`/property/stake/${property.token_address}`);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-200 rounded-lg" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <div className="relative h-48">
        <Image
          src={property.image_url || '/placeholder.jpg'}
          alt={property.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
      </div>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{property.title}</CardTitle>
            <CardDescription>{property.location}</CardDescription>
          </div>
          <div className="px-2 py-1 text-xs font-semibold rounded bg-primary/10 text-primary">
            {property.status}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {property.description}
          </p>
          
          {onChainData && (
            <>
              <div className="flex justify-between items-center text-sm">
                <span>Token Price:</span>
                <span className="font-medium">
                  {formatUnits(onChainData.price, 6)} EURC
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Total Supply:</span>
                <span className="font-medium">
                  {formatUnits(onChainData.totalSupply, 18)} {onChainData.symbol}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Funding Progress:</span>
                  <span className="font-medium">
                    {calculateProgress(onChainData.soldTokens, onChainData.totalSupply).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={calculateProgress(onChainData.soldTokens, onChainData.totalSupply)} 
                />
              </div>
            </>
          )}

          {property.staking_contract_address && (
            <div className="pt-2 space-y-2 border-t">
              <div className="flex justify-between items-center text-sm">
                <span>Staking Reward Rate:</span>
                <span className="font-medium">
                  {property.staking_reward_rate && formatUnits(BigInt(property.staking_reward_rate), 6)} EURC/sec
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Staking Duration:</span>
                <span className="font-medium">
                  {property.staking_duration && (Number(property.staking_duration) / (24 * 60 * 60)).toFixed(1)} days
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Staking Status:</span>
                <span className={cn("px-2 py-1 rounded text-xs font-semibold", 
                  property.staking_is_active 
                    ? "bg-green-100 text-green-800" 
                    : "bg-red-100 text-red-800"
                )}>
                  {property.staking_is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {property.status === 'funding' && (
            <Button 
              className="flex-1" 
              onClick={handlePurchaseClick}
              disabled={!property.token_address}
            >
              Purchase Tokens
            </Button>
          )}
          {property.status === 'staking' && (
            <Button 
              className="flex-1" 
              onClick={handleStakeClick}
              disabled={!property.staking_contract_address}
            >
              Stake Tokens
            </Button>
          )}
          {showAdminControls && (
            <Button 
              variant="outline" 
              onClick={() => router.push(`/admin/requests/${property.id}`)}
            >
              Manage
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}