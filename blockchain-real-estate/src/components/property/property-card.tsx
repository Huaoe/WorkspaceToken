"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { getPropertyTokenContract } from "@/lib/ethereum";
import { useWalletEvents } from "@/app/wallet-events-provider";
import { formatUnits } from "viem";
import { Progress } from "@/components/ui/progress";
import { PropertyRequest } from "@/types/property";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";
import Link from "next/link";
import { PropertyDetails } from "@/lib/contracts";

interface PropertyCardProps {
  property: PropertyRequest;
  showAdminControls: boolean;
}

interface TokenStats {
  total: string;
  remaining: string;
  sold: string;
  holders: number;
  price: string;
  name: string;
  symbol: string;
  totalValue: string;
  soldValue: string;
}

export function PropertyCard({ property, showAdminControls }: PropertyCardProps) {
  if (!property) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Property data is missing
          </div>
        </CardContent>
      </Card>
    );
  }

  const [tokenStats, setTokenStats] = useState<TokenStats>({
    total: "0",
    remaining: "0",
    sold: "0",
    holders: 0,
    price: "0",
    name: "",
    symbol: "",
    totalValue: "0",
    soldValue: "0"
  });
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
        
        // Get token details
        const [totalSupply, name, symbol, tokenHolder] = await Promise.all([
          contract.totalSupply(),
          contract.name(),
          contract.symbol(),
          contract.tokenHolder()
        ]);

        const holderBalance = await contract.balanceOf(tokenHolder);

        // Calculate token stats
        const total = Number(formatUnits(totalSupply, 18));
        const available = Number(formatUnits(holderBalance, 18));
        const soldToOthers = total - available;
        const pricePerToken = property.price_per_token ? 
          Number(formatUnits(BigInt(property.price_per_token), 6)) : 
          0; // Use 0 as fallback if no price is set

        setTokenStats({
          total: total.toString(),
          remaining: available.toString(),
          sold: soldToOthers.toString(),
          holders: soldToOthers > 0 ? 2 : 1,
          price: pricePerToken.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }),
          name: property.token_name || name,
          symbol: property.token_symbol || symbol,
          totalValue: (total * pricePerToken).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }),
          soldValue: (soldToOthers * pricePerToken).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })
        });

      } catch (error: any) {
        console.error("Error fetching property data:", error);
        setError(error.message || "Failed to fetch property data");
      } finally {
        setLoading(false);
      }
    }

    fetchPropertyData();
  }, [property.token_address, property.price_per_token, property.token_name, property.token_symbol]);

  const getStatusBadgeProps = (status: string) => {
    switch (status) {
      case 'funding':
        return {
          variant: "secondary" as const,
          className: "bg-blue-500 text-white"
        };
      case 'staking':
        return {
          variant: "secondary" as const,
          className: "bg-green-500 text-white"
        };
      default:
        return {
          variant: "secondary" as const,
          className: "bg-gray-500 text-white"
        };
    }
  };

  const formatTokenAmount = (amount: string) => {
    const num = Number(amount);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="relative">
        <div className="relative w-full h-48 mb-4 rounded-t-lg overflow-hidden">
          <Image
            src={property.image_url || PLACEHOLDER_IMAGE}
            alt={property.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <div className="absolute top-2 right-2">
          <Badge {...getStatusBadgeProps(property.status)}>
            {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
          </Badge>
        </div>
        <CardTitle className="text-xl font-bold">
          {property.title}
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          {property.location}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">
                  €{tokenStats.price} <span className="text-sm font-normal">/token</span>
                </p>
                <p className="text-sm text-gray-500">
                  Total Value: €{tokenStats.totalValue}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Holders</p>
                <p className="text-lg font-bold">{tokenStats.holders}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Available</p>
                <p className="font-medium">{formatTokenAmount(tokenStats.remaining)} tokens</p>
                <p className="text-xs text-gray-400">€{(Number(tokenStats.remaining) * Number(tokenStats.price)).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Supply</p>
                <p className="font-medium">{formatTokenAmount(tokenStats.total)} tokens</p>
                <p className="text-xs text-gray-400">€{tokenStats.totalValue}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Token Sales Progress</span>
                <span>{(Number(tokenStats.sold) / Number(tokenStats.total) * 100).toFixed(1)}%</span>
              </div>
              <Progress 
                value={(Number(tokenStats.sold) / Number(tokenStats.total)) * 100} 
                className="h-2"
              />
            </div>

            <div className="flex justify-between gap-2">
              <Button
                className="flex-1"
                variant="outline"
                asChild
              >
                <Link href={`/property/${property.token_address}`}>
                  View Details
                </Link>
              </Button>
              {property.status === 'funding' && (
                <Button
                  className="flex-1"
                  variant="default"
                  asChild
                >
                  <Link href={`/property/stake/${property.token_address}`}>
                    Stake
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}