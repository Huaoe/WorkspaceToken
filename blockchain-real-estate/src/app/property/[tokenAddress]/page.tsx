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
  expected_price: bigint;
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
        functionName: 'propertyDetails',
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

  const propertyDetails = propertyRequest && contractData ? {
    title: propertyRequest.title,
    description: propertyRequest.description,
    location: propertyRequest.location,
    imageUrl: propertyRequest.image_url || '',
    expected_price: BigInt(propertyRequest.expected_price * 10**6),
    isActive: propertyRequest.status === 'approved',
    status: propertyRequest.status,
    payoutDuration: propertyRequest.payout_duration,
    finishAt: propertyRequest.finish_at,
    roi: propertyRequest.roi,
    numberOfTokens: Number(formatUnits(contractData[0].result || BigInt(0), 18)),
    ownerAddress: contractData[1].result as string,
    documents_url: propertyRequest.documents_url,
    ...(propertyRequest.insights && {
      mistral_data: {
        market_analysis: propertyRequest.insights.market_analysis || '',
        price_prediction: propertyRequest.insights.price_prediction || '',
        risk_assessment: propertyRequest.insights.risk_assessment || '',
      }
    };

    if (propertyRequest) {
      fetchMistralData();
    }
  }, [propertyRequest]);

  useEffect(() => {
    if (contractData?.[0].error || contractData?.[1].error || contractData?.[2].error) {
      setError('Failed to load contract details');
      console.error('Contract read error:', contractData?.[0].error || contractData?.[1].error || contractData?.[2].error);
    } else if (contractData && propertyRequest) {
      const [totalSupply, ownerAddress, details] = contractData;
      const propertyDetails: PropertyDetails = {
        title: propertyRequest.title,
        description: propertyRequest.description,
        location: propertyRequest.location,
        imageUrl: propertyRequest.image_url || PLACEHOLDER_IMAGE,
        expected_price: details.result.price, // Getting price from the struct
        isActive: details.result.isActive,
        status: propertyRequest.status,
        payoutDuration: propertyRequest.payout_duration || 0,
        finishAt: propertyRequest.finish_at || '',
        roi: propertyRequest.roi || 0,
        numberOfTokens: Number(formatUnits(totalSupply.result || 0n, 18)),
        ownerAddress: ownerAddress.result,
        documents_url: propertyRequest.documents_url,
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

  const formattedPrice = propertyDetails.expected_price ? formatUnits(propertyDetails.expected_price, 6) : '0';
  const formattedSupply = propertyDetails.numberOfTokens?.toString() || '0';

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'funding':
        return {
          label: 'Funding',
          color: 'bg-purple-100 text-purple-800'
        };
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
            <Badge className={getStatusBadgeColor(propertyRequest.status).color}>
              {getStatusBadgeColor(propertyRequest.status).label}
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
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Investment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Price per Token</p>
                    <p className="font-medium text-xl text-green-600">
                      {formattedPrice} EURC
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Supply</p>
                    <p className="font-medium">
                      {formattedSupply} Tokens
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ROI</p>
                    <p className="font-medium">{propertyDetails.roi}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{propertyDetails.payoutDuration} months</p>
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
            ) : propertyRequest.status === 'funding' ? (
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
