"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useContractReads } from "wagmi";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { propertyTokenABI } from "@/lib/contracts";
import {
  PLACEHOLDER_IMAGE
} from "@/lib/constants";
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
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails | null>(null);
  const tokenAddress = params.tokenAddress as `0x${string}`;

  const { data: contractData, isLoading: contractLoading } = useContractReads({
    contracts: [
      {
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: "totalSupply",
      },
      {
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: "owner",
      },
      {
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: "propertyDetails",
      },
    ],
    watch: true,
  });

  useEffect(() => {
    console.log("[PropertyDetails] Component mounted");
    console.log("[PropertyDetails] Token Address:", tokenAddress);
    console.log("[PropertyDetails] Property Request:", propertyRequest);
    setMounted(true);
    fetchPropertyRequest();
  }, [tokenAddress]);

  const fetchPropertyRequest = async () => {
    try {
      const { data, error } = await supabase
        .from("property_requests")
        .select("*")
        .eq("token_address", tokenAddress)
        .single();

      if (error) throw error;
      setPropertyRequest(data);
    } catch (err) {
      console.error("Error fetching property request:", err);
      toast({
        title: "Error",
        description: "Failed to fetch property details",
        variant: "destructive",
      });
      setError("Failed to fetch property details");
    }
  };

  const fetchMistralData = async () => {
    if (!propertyRequest?.location) {
      console.log('No location data available for market analysis');
      return;
    }
    
    try {
      // First check if we have cached insights
      const { data: cachedInsights, error: cacheError } = await supabase
        .from('market_insights_cache')
        .select('*')
        .eq('location', propertyRequest.location)
        .single();

      if (cachedInsights) {
        console.log('Found cached market insights:', cachedInsights);
        setPropertyRequest(prev => prev ? {
          ...prev,
          market_analysis: cachedInsights.insights,
        } : null);
        return;
      }

      console.log('Fetching market insights for location:', propertyRequest.location);
      const response = await fetch('/api/mistral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location: propertyRequest.location,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch market insights');
      }

      const data = await response.json();
      console.log('Received market insights:', data);

      // Cache the insights
      const { error: insertError } = await supabase
        .from('market_insights_cache')
        .insert({
          location: propertyRequest.location,
          insights: data.market_analysis,
        });

      if (insertError) {
        console.error('Error caching market insights:', insertError);
      }

      // Update local state
      setPropertyRequest(prev => prev ? {
        ...prev,
        market_analysis: data.market_analysis,
        price_prediction: data.price_prediction,
        risk_assessment: data.risk_assessment,
      } : null);

    } catch (err) {
      console.error('Error fetching market insights:', err);
      toast({
        title: 'Market Analysis',
        description: 'Market insights are temporarily unavailable. Please try again later.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (propertyRequest && !propertyRequest.market_analysis) {
      fetchMistralData();
    }
  }, [propertyRequest]);

  useEffect(() => {
    if (contractData?.[0].error || contractData?.[1].error || contractData?.[2].error) {
      setError('Failed to load contract details');
      console.error('Contract read error:', contractData?.[0].error || contractData?.[1].error || contractData?.[2].error);
      return;
    }

    if (contractData && propertyRequest) {
      console.log('Contract data:', contractData);
      const [totalSupply, ownerAddress, details] = contractData;
      console.log('Property details from contract:', details.result);
      
      setPropertyDetails({
        title: propertyRequest.title,
        description: propertyRequest.description,
        location: propertyRequest.location,
        imageUrl: propertyRequest.image_url || PLACEHOLDER_IMAGE,
        expected_price: details.result.price,
        isActive: details.result.isActive,
        status: propertyRequest.status,
        payoutDuration: propertyRequest.payout_duration || 0,
        finishAt: propertyRequest.finish_at || '',
        roi: propertyRequest.roi || 0,
        numberOfTokens: Number(formatUnits(totalSupply.result || 0n, 18)),
        ownerAddress: ownerAddress.result,
        documents_url: propertyRequest.documents_url,
        ...(propertyRequest.market_analysis && {
          mistral_data: {
            market_analysis: propertyRequest.market_analysis,
            price_prediction: propertyRequest.price_prediction,
            risk_assessment: propertyRequest.risk_assessment,
          }
        })
      });
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
          <p className="text-sm text-muted-foreground">
            Loading property details...
          </p>
        </div>
      </div>
    );
  }

  const imageUrl =
    propertyDetails.imageUrl && propertyDetails.imageUrl.startsWith("http")
      ? propertyDetails.imageUrl
      : PLACEHOLDER_IMAGE;

  // Format price and supply with proper decimals
  const formattedPrice = propertyDetails?.expected_price 
    ? Number(formatUnits(propertyDetails.expected_price, 6)).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '0.00';

  const formattedSupply = propertyDetails?.numberOfTokens.toLocaleString('en-US') || '0';

  // Calculate price per token
  const pricePerToken = propertyDetails?.expected_price && propertyDetails?.numberOfTokens
    ? Number(formatUnits(propertyDetails.expected_price, 6)) / propertyDetails.numberOfTokens
    : 0;

  const formattedPricePerToken = pricePerToken.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "funding":
        return {
          label: "Funding",
          color: "bg-purple-100 text-purple-800",
        };
      case "staking":
        return "bg-blue-500 hover:bg-blue-600";
      case "onchain":
        return "bg-yellow-500 hover:bg-yellow-600";
      case "paused":
        return "bg-orange-500 hover:bg-orange-600";
      case "closed":
        return "bg-gray-500 hover:bg-gray-600";
      default:
        return "";
    }
  };

  const places = [
  ];

  const handlePlaceClick = (place: any, index: number) => {
    console.log("Place clicked:", place, index);
  };

  const price = BigInt(propertyRequest.expected_price);
  const totalSupply = BigInt(propertyRequest.number_of_tokens);

  const contractParameters = propertyRequest
    ? {
        title: propertyRequest.title,
        description: propertyRequest.description,
        location: propertyRequest.location,
        imageUrl: propertyRequest.image_url,
        price: price, // Using BigInt value directly
        totalSupply: totalSupply, // Using BigInt value directly
        tokenName: propertyRequest.token_name,
        tokenSymbol: propertyRequest.token_symbol,
      }
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* Main content - 2 columns */}
          <div className="lg:col-span-2 flex flex-col flex-1 min-h-0">
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-[#212E53] dark:text-white">
                  {propertyDetails.title}
                </CardTitle>
                <CardDescription>
                  {propertyDetails.description}
                </CardDescription>
              </CardHeader>

              <div className="relative aspect-video w-full">
                <Image
                  src={propertyDetails.imageUrl}
                  alt={propertyDetails.title}
                  fill
                  className="object-cover rounded-md"
                />
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <Tabs defaultValue="details" className="w-full h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800">
                    <TabsTrigger
                      value="details"
                      className="text-[#212E53] dark:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                    >
                      Details
                    </TabsTrigger>
                    <TabsTrigger
                      value="location"
                      className="text-[#212E53] dark:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                    >
                      Location
                    </TabsTrigger>
                    <TabsTrigger
                      value="market"
                      className="text-[#212E53] dark:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                    >
                      Market Analysis
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details">
                    <div className="prose max-w-none">
                      <p className="text-[#4A919E] dark:text-gray-300">
                        {propertyDetails.description}
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="location" className="h-full flex flex-col">
                    <div className="space-y-6 flex flex-col flex-1 min-h-0">
                      <div>
                        <h3 className="text-lg font-semibold">Location</h3>
                        <p className="text-[#4A919E] dark:text-gray-300">
                          {propertyDetails.location}
                        </p>
                      </div>
                      <div
                        style={{
                          height: "400px",
                          width: "100%",
                          position: "relative",
                        }}
                      >
                        <MiniMap
                          location={propertyDetails.location}
                          height="400px"
                        />
                      </div>
                      <div className="flex-1 min-h-0">
                        <Card className="h-full flex flex-col">
                          <CardHeader className="flex-shrink-0">
                            <CardTitle>Nearby Places</CardTitle>
                          </CardHeader>
                          <CardContent className="flex-1 min-h-0 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                            <div className="grid grid-cols-1 gap-3">
                              {places.map((place, index) => (
                                <div
                                  key={place.name}
                                  className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                  onClick={() => handlePlaceClick(place, index)}
                                >
                                  <div className="flex-shrink-0 mt-1">
                                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100">
                                      <svg
                                        className="w-4 h-4 text-red-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                        />
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                      </svg>
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                      {place.name}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                                      {place.vicinity}
                                    </p>
                                    {place.rating && (
                                      <div className="mt-1 flex items-center">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                          Rating: {place.rating}
                                        </span>
                                        <span className="ml-1 text-yellow-400">⭐</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="market">
                    {propertyDetails.location ? (
                      <MarketInsights location={propertyDetails.location} />
                    ) : (
                      <p className="text-[#4A919E] dark:text-gray-300">
                        Location data not available for market analysis.
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
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
                    <p className="text-sm text-muted-foreground">
                      Price per Token
                    </p>
                    <div className="flex items-baseline gap-1">
                      <p className="font-medium text-xl text-green-600">
                        {formattedPricePerToken}
                      </p>
                      <span className="text-sm font-medium text-muted-foreground">EURC</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Supply</p>
                    <div className="flex items-baseline gap-1">
                      <p className="font-medium text-xl">
                        {formattedSupply}
                      </p>
                      <span className="text-sm font-medium text-muted-foreground">Tokens</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ROI</p>
                    <p className="font-medium">{propertyDetails.roi}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {propertyDetails.payoutDuration} months
                    </p>
                  </div>
                </div>

                {propertyRequest.status === "funding" && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() =>
                      router.push(`/property/purchase/${tokenAddress}`)
                    }
                  >
                    Invest Now
                  </Button>
                )}
                {propertyRequest.status === "staking" && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => router.push(`/property/stake/${tokenAddress}`)}
                  >
                    Stake Tokens
                  </Button>
                )}
                {!["funding", "staking"].includes(propertyRequest.status) && (
                  <Button className="w-full" size="lg" disabled>
                    {propertyRequest.status === "paused"
                      ? "Temporarily Unavailable"
                      : propertyRequest.status === "closed"
                      ? "Investment Closed"
                      : "Not Available"}
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
                  onClick={() =>
                    window.open(propertyRequest.documents_url!, "_blank")
                  }
                >
                  View Documents
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
