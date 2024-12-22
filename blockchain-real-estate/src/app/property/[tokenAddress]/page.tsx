'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Address } from 'viem';
import { supabase } from '@/lib/supabase';
import { PropertyRequest } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';
import { useWalletEvents } from '@/app/wallet-events-provider';
import { getPropertyFactoryContract, getPropertyTokenContract } from '@/lib/ethereum';
import { formatEther, parseEther, formatUnits } from 'ethers';
import { propertyTokenABI } from '@/lib/contracts';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card as TremorCard, Title, BarChart, Subtitle } from "@tremor/react";

export default function PropertyDetailsPage() {
  const { tokenAddress } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { address, isConnected } = useWalletEvents();
  const [property, setProperty] = useState<PropertyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [totalSupply, setTotalSupply] = useState('0');
  const [ownerBalance, setOwnerBalance] = useState('0');
  const [owner, setOwner] = useState<string | null>(null);
  const [onChainDetails, setOnChainDetails] = useState<{
    title: string;
    description: string;
    location: string;
    imageUrl: string;
    price: bigint;
    isActive: boolean;
  }>({
    title: '',
    description: '',
    location: '',
    imageUrl: '',
    price: BigInt(0),
    isActive: false,
  });
  const [pricePerToken, setPricePerToken] = useState<bigint>(BigInt(0));
  const [tokenContract, setTokenContract] = useState<any>(null);

  const [analytics, setAnalytics] = useState<{
    monthlyReturns: { month: string; return: number }[];
    tokenHistory: { date: string; value: number }[];
    marketAnalysis: string;
  }>({
    monthlyReturns: [],
    tokenHistory: [],
    marketAnalysis: ''
  });

  const fetchOnChainDetails = async () => {
    if (!address || !tokenContract) {
      return;
    }

    try {
      // Get token balance
      const balance = await tokenContract.balanceOf(address);
      console.log('User balance:', balance.toString());
      setTokenBalance(formatEther(balance));

      // Get contract owner
      try {
        const contractOwner = await tokenContract.owner();
        console.log('Contract owner:', contractOwner);
        setOwner(contractOwner);

        // Get owner's balance
        const ownerBal = await tokenContract.balanceOf(contractOwner);
        console.log('Owner balance:', ownerBal.toString());
        setOwnerBalance(formatEther(ownerBal));
      } catch (error) {
        console.error('Error fetching owner details:', error);
      }

      // Get total supply
      try {
        const supply = await tokenContract.totalSupply();
        console.log('Total supply fetched:', supply.toString());
        setTotalSupply(formatEther(supply));
      } catch (error) {
        console.error('Error fetching total supply:', error);
      }

      // Get property details
      try {
        const details = await tokenContract.propertyDetails();
        console.log('Property details:', details);
        
        setPricePerToken(BigInt(details.price.toString()));
        
        setOnChainDetails({
          title: details.title || '',
          description: details.description || '',
          location: details.location || '',
          imageUrl: details.imageUrl || '',
          price: BigInt(details.price.toString()),
          isActive: details.isActive,
        });
      } catch (error) {
        console.error('Error fetching property details:', error);
      }
    } catch (error) {
      console.error('Error fetching on-chain details:', error);
      toast({
        title: 'Warning',
        description: 'Failed to load blockchain data',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const initializeContract = async () => {
      if (!tokenAddress || !isConnected || !address) {
        setLoading(false);
        return;
      }

      try {
        // Get property details from Supabase
        const { data, error } = await supabase
          .from('property_requests')
          .select('*')
          .eq('token_address', tokenAddress)
          .single();

        if (error) throw error;
        setProperty(data);

        // Initialize contract
        try {
          console.log('Initializing contract for address:', tokenAddress);
          const contract = await getPropertyTokenContract(tokenAddress as string, true);
          console.log('Token contract initialized:', contract);
          setTokenContract(contract);

          // Fetch initial details
          fetchOnChainDetails();
        } catch (error) {
          console.error('Error initializing contract:', error);
          toast({
            title: 'Error',
            description: 'Failed to initialize contract',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching property details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load property details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    initializeContract();
  }, [tokenAddress, isConnected, address, toast]);

  useEffect(() => {
    if (tokenContract && address) {
      fetchOnChainDetails();
    }
  }, [tokenContract, address]);

  useEffect(() => {
    // Simulate fetching historical data
    const generateHistoricalData = () => {
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          value: 23 + Math.random() * 2 // Simulate price fluctuation around €23
        };
      });

      const monthlyReturns = [
        { month: 'Jan', return: 8.2 },
        { month: 'Feb', return: 7.9 },
        { month: 'Mar', return: 8.3 },
        { month: 'Apr', return: 8.0 },
        { month: 'May', return: 8.1 },
        { month: 'Jun', return: 8.4 }
      ];

      const marketAnalysis = `
        Property Analysis (AI-Generated):
        - Location Quality: Excellent
        - Market Trend: Upward
        - Risk Assessment: Low
        - Growth Potential: High
        - Rental Demand: Strong
        
        Recommendations:
        - Optimal holding period: 3-5 years
        - Expected annual appreciation: 5-7%
        - Suggested portfolio allocation: 15-20%
      `;

      setAnalytics({
        tokenHistory: last30Days,
        monthlyReturns,
        marketAnalysis
      });
    };

    generateHistoricalData();
  }, []);

  // Format price with proper decimals
  const formattedPrice = useMemo(() => {
    if (!pricePerToken) return '0.00';
    const price = Number(formatUnits(pricePerToken, 6));
    return price.toFixed(2); // Always use period as decimal separator
  }, [pricePerToken]);

  const handlePurchase = () => {
    router.push(`/property/purchase/${tokenAddress}`);
  };

  const handleStake = () => {
    router.push(`/property/stake/${tokenAddress}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gray-200 rounded-lg dark:bg-gray-700" />
          <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-3/4" />
          <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-1/2" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-gray-600">Property not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{onChainDetails.title || property.title}</CardTitle>
          <CardDescription>{onChainDetails.description || property.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="relative h-64 w-full mb-4">
                <Image
                  src={onChainDetails.imageUrl || property.images?.[0] || '/placeholder.jpg'}
                  alt={onChainDetails.title || property.title}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Location</h3>
                  <p className="text-gray-600">{onChainDetails.location || property.location}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Property Type</h3>
                  <p className="text-gray-600">{property.property_type}</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Investment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Price per Token</p>
                    <p className="font-medium">{formattedPrice} EURC</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Supply</p>
                    <p className="font-medium">{totalSupply} Tokens</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Owner's Balance</p>
                    <p className="font-medium">{ownerBalance} Tokens</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Your Balance</p>
                    <p className="font-medium">{tokenBalance} Tokens</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Returns</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Expected ROI</p>
                    <p className="font-medium">{property.roi}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payout Duration</p>
                    <p className="font-medium">{property.payout_duration} days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-4">
          <Button variant="outline" onClick={handleStake} disabled={!isConnected || Number(tokenBalance) === 0}>
            Stake Tokens
          </Button>
          <Button onClick={handlePurchase} disabled={!isConnected}>
            Purchase Tokens
          </Button>
        </CardFooter>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Token Price History */}
        <TremorCard>
          <Title>Token Price History</Title>
          <Subtitle>Last 30 days performance</Subtitle>
          <div className="h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.tokenHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['auto', 'auto']} />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#2563eb" 
                  fill="#93c5fd" 
                  name="Token Price (€)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TremorCard>

        {/* Monthly Returns */}
        <TremorCard>
          <Title>Monthly Returns</Title>
          <Subtitle>Historical ROI performance</Subtitle>
          <BarChart
            className="mt-4 h-72"
            data={analytics.monthlyReturns}
            index="month"
            categories={["return"]}
            colors={["blue"]}
            valueFormatter={(number) => `${number.toFixed(1)}%`}
          />
        </TremorCard>

        {/* Market Analysis */}
        <TremorCard className="md:col-span-2">
          <Title>Market Analysis</Title>
          <Subtitle>AI-Generated Insights</Subtitle>
          <div className="mt-4 whitespace-pre-line text-gray-600">
            {analytics.marketAnalysis}
          </div>
        </TremorCard>

        {/* Token Distribution */}
        <TremorCard className="md:col-span-2">
          <Title>Token Distribution</Title>
          <div className="mt-4">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    Token Allocation
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {((Number(tokenBalance) / Number(totalSupply)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                <div
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                  style={{ width: `${(Number(tokenBalance) / Number(totalSupply)) * 100}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Total Supply</p>
                <p className="font-medium">{totalSupply} tokens</p>
              </div>
              <div>
                <p className="text-gray-500">Available</p>
                <p className="font-medium">{Number(totalSupply) - Number(tokenBalance)} tokens</p>
              </div>
              <div>
                <p className="text-gray-500">Your Holdings</p>
                <p className="font-medium">{tokenBalance} tokens</p>
              </div>
            </div>
          </div>
        </TremorCard>
      </div>
    </div>
  );
}
