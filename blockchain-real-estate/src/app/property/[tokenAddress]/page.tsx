'use client';

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useContractReads } from "wagmi";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { propertyTokenABI } from "@/lib/contracts";
import { PLACEHOLDER_IMAGE } from "@/lib/constants";
import { formatUnits } from "viem";
import { supabase } from "@/lib/supabase/client";
import { Separator } from "@/components/ui/separator";
import { PropertyRequest } from "@/types/property";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { MiniMap } from "@/components/property/mini-map";
import MarketInsights from "@/components/property/market-insights";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractDetails } from "@/components/property/contract-details";

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
  mistral_data?: {
    market_analysis: string;
    price_prediction: string;
    risk_assessment: string;
  };
}

export default function PropertyDetails() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [propertyRequest, setPropertyRequest] = useState<PropertyRequest | null>(null);
  const tokenAddress = params.tokenAddress as `0x${string}`;

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

  useEffect(() => {
    console.log('[PropertyDetails] Component mounted');
    console.log('[PropertyDetails] Token Address:', tokenAddress);
    console.log('[PropertyDetails] Property Request:', propertyRequest);
    setMounted(true);
    fetchPropertyRequest();
  }, [tokenAddress]);

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
      setError('Failed to fetch property details');
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

  if (contractLoading || !propertyRequest || !propertyDetails) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading property details...</p>
        </div>
      </div>
    );
  }

  const imageUrl = propertyDetails.imageUrl && propertyDetails.imageUrl.startsWith('http') 
    ? propertyDetails.imageUrl 
    : PLACEHOLDER_IMAGE;

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

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content - 2 columns */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{propertyDetails.title}</CardTitle>
              <CardDescription>{propertyDetails.location}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video rounded-lg overflow-hidden mb-6">
                <Image
                  src={!imageError ? (propertyDetails.imageUrl || PLACEHOLDER_IMAGE) : PLACEHOLDER_IMAGE}
                  alt={propertyDetails.title || "Property"}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw"
                  priority
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              </div>
              
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="location">Location</TabsTrigger>
                  <TabsTrigger value="market">Market Analysis</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details">
                  <div className="prose max-w-none">
                    <p>{propertyDetails.description}</p>
                    {/* Other property details */}
                  </div>
                </TabsContent>
                
                <TabsContent value="location">
                  <div className="space-y-4">
                    <div style={{ height: '400px', width: '100%', position: 'relative' }}>
                      <MiniMap location={propertyDetails.location} height="400px" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {propertyDetails.location}
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="market">
                  {propertyDetails.location ? (
                    <MarketInsights location={propertyDetails.location} />
                  ) : (
                    <p className="text-muted-foreground">Location data not available for market analysis.</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          <ContractDetails tokenAddress={tokenAddress} />
          <Card>
            <CardHeader>
              <CardTitle>Investment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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

              {propertyRequest.status === 'funding' && (
                <Button 
                  className="w-full"
                  size="lg"
                  onClick={() => router.push(`/property/purchase/${tokenAddress}`)}
                >
                  Invest Now
                </Button>
              )}
              {propertyRequest.status === 'staking' && (
                <Button 
                  className="w-full"
                  size="lg"
                  onClick={() => router.push(`/property/stake/${tokenAddress}`)}
                >
                  Stake Tokens
                </Button>
              )}
              {!['funding', 'staking'].includes(propertyRequest.status) && (
                <Button 
                  className="w-full"
                  size="lg"
                  disabled
                >
                  {propertyRequest.status === 'paused' ? 'Temporarily Unavailable' :
                   propertyRequest.status === 'closed' ? 'Investment Closed' :
                   'Not Available'}
                </Button>
              )}
            </CardContent>
          </Card>

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
    </div>
  );
}
