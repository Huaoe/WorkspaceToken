'use client';

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useContractReads } from "wagmi";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import propertyTokenABI from "@contracts/abis/PropertyToken";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";
import { formatUnits } from "viem";
import { supabase } from "@/lib/supabase";
import { Separator } from "@/components/ui/separator";
import { PropertyRequest } from "@/types/property";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface PropertyDetails {
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  price: bigint;
  isActive: boolean;
  status: string;
  payoutDuration: number;
  finishAt: string;
  roi: number;
  numberOfTokens: number;
  ownerAddress: string;
  documents_url: string | null;
}

export default function PropertyDetails() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [propertyRequest, setPropertyRequest] = useState<PropertyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails | null>(null);
  const tokenAddress = params.tokenAddress as `0x${string}`;

  useEffect(() => {
    setMounted(true);
    fetchPropertyRequest();
  }, [tokenAddress]);

  const { data: contractData, isLoading: contractLoading } = useContractReads({
    contracts: [
      {
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: 'totalSupply',
      },
      {
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: 'owner',
      },
      {
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: 'getPrice',
      }
    ],
    watch: true,
  });

  const fetchPropertyRequest = async () => {
    try {
      const { data, error } = await supabase
        .from('property_requests')
        .select('*')
        .eq('token_address', tokenAddress)
        .single();

      if (error) throw error;
      setPropertyRequest(data);
    } catch (err) {
      console.error('Error fetching property request:', err);
      toast({
        title: "Error",
        description: "Failed to fetch property details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contractData?.[0].error || contractData?.[1].error || contractData?.[2].error) {
      setError('Failed to load contract details');
      console.error('Contract read error:', contractData?.[0].error || contractData?.[1].error || contractData?.[2].error);
    } else if (contractData && propertyRequest) {
      const [totalSupply, ownerAddress, price] = contractData;
      const EURC_DECIMALS = 6; // EURC uses 6 decimals
      const propertyDetails: PropertyDetails = {
        title: propertyRequest.title,
        description: propertyRequest.description,
        location: propertyRequest.location,
        imageUrl: propertyRequest.image_url || '',
        price: price.result ? BigInt(price.result.toString()) / BigInt(10 ** (18 - EURC_DECIMALS)) : BigInt(0), // Convert from 18 decimals to 6 decimals
        isActive: propertyRequest.status === 'approved',
        status: propertyRequest.status,
        payoutDuration: propertyRequest.payout_duration,
        finishAt: propertyRequest.finish_at,
        roi: propertyRequest.roi,
        numberOfTokens: Number(formatUnits(totalSupply.result || BigInt(0), 18)),
        ownerAddress: ownerAddress.result as string,
        documents_url: propertyRequest.documents_url
      };
      setPropertyDetails(propertyDetails);
      setError(null);
    }
  }, [contractData, propertyRequest]);

  if (!mounted) return null;

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>
              {error}. Token Address: {tokenAddress}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (contractLoading || loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!propertyDetails || !propertyRequest) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Property Not Found</CardTitle>
            <CardDescription>
              The requested property could not be found.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const formattedPrice = propertyDetails.price ? formatUnits(propertyDetails.price, 6) : '0';
  const formattedSupply = propertyDetails.numberOfTokens?.toString() || '0';

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'live':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'staking':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'onchain':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'paused':
        return 'bg-orange-500 hover:bg-orange-600';
      case 'closed':
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return '';
    }
  };

  const imageUrl = propertyDetails.imageUrl && propertyDetails.imageUrl.startsWith('http') 
    ? propertyDetails.imageUrl 
    : PLACEHOLDER_IMAGE;

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl">{propertyDetails.title}</CardTitle>
              <CardDescription className="text-lg mt-2">{propertyDetails.location}</CardDescription>
            </div>
            <Badge className={getStatusBadgeColor(propertyRequest.status)}>
              {propertyRequest.status.charAt(0).toUpperCase() + propertyRequest.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="relative w-full h-[400px]">
            <Image
              src={imageUrl}
              alt={propertyDetails.title}
              fill
              className="object-cover rounded-md"
              onError={() => setImageError(true)}
              priority
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Description</h3>
                <p className="text-muted-foreground">{propertyDetails.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">Investment Details</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="font-medium">{formattedPrice} EURC</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Supply</p>
                    <p className="font-medium">{formattedSupply} Tokens</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ROI</p>
                    <p className="font-medium">{propertyRequest.roi}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payout Duration</p>
                    <p className="font-medium">{propertyRequest.payout_duration} months</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Contract Details</h3>
                <div className="space-y-2 mt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Contract Address</p>
                    <p className="font-medium font-mono text-sm">{tokenAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Owner Address</p>
                    <p className="font-medium font-mono text-sm">{propertyDetails.ownerAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contract End Date</p>
                    <p className="font-medium">
                      {new Date(propertyRequest.finish_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {propertyRequest.documents_url && (
                <div>
                  <h3 className="text-lg font-semibold">Documents</h3>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => window.open(propertyRequest.documents_url!, '_blank')}
                  >
                    View Documents
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <Separator className="my-4" />

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push('/property/list')}>
            Back to List
          </Button>
          <div className="flex gap-2">
            {propertyRequest.status === 'staking' ? (
              <Button onClick={() => router.push(`/property/stake/${tokenAddress}`)}>
                Stake Tokens
              </Button>
            ) : propertyRequest.status === 'live' ? (
              <Button onClick={() => router.push(`/property/purchase/${tokenAddress}`)}>
                Invest Now
              </Button>
            ) : (
              <Button disabled>
                {propertyRequest.status === 'paused' ? 'Temporarily Unavailable' :
                 propertyRequest.status === 'closed' ? 'Investment Closed' :
                 'Not Available'}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
