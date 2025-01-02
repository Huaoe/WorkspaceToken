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

export default function PropertyDetailsPage() {
  const { tokenAddress } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { address, isConnected } = useWalletEvents();
  const [property, setProperty] = useState<PropertyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [totalSupply, setTotalSupply] = useState('0');
  const [tokenHolderBalance, setTokenHolderBalance] = useState('0');
  const [tokenHolder, setTokenHolder] = useState<string | null>(null);
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

  const fetchOnChainDetails = async () => {
    if (!address || !tokenContract) {
      return;
    }

    try {
      // Get token balance
      const balance = await tokenContract.balanceOf(address);
      console.log('User balance:', balance.toString());
      setTokenBalance(formatEther(balance));

      // Get contract owner and token holder
      try {
        const contractOwner = await tokenContract.owner();
        const factory = await getPropertyFactoryContract();
        const currentTokenHolder = await factory.owner();
        console.log('Contract owner:', contractOwner);
        console.log('Token holder:', currentTokenHolder);
        setOwner(contractOwner);
        setTokenHolder(currentTokenHolder);

        // Get token holder's balance
        const holderBal = await tokenContract.balanceOf(currentTokenHolder);
        console.log('Token holder balance:', holderBal.toString());
        setTokenHolderBalance(formatEther(holderBal));
      } catch (error) {
        console.error('Error fetching owner/holder details:', error);
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
    <div className="container mx-auto py-8">
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
                    <p className="text-sm text-gray-500">Token Holder's Balance</p>
                    <p className="font-medium">{tokenHolderBalance} Tokens</p>
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
                    <p className="text-sm text-gray-500">Expected APR</p>
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
      <div className="flex flex-col gap-2 mt-4">
        <div className="text-sm text-muted-foreground">
          Available Tokens: {tokenHolderBalance} / {totalSupply}
        </div>
        <div className="text-sm text-muted-foreground">
          Token Holder: {tokenHolder ? `${tokenHolder.slice(0, 6)}...${tokenHolder.slice(-4)}` : 'Loading...'}
        </div>
        {address && tokenBalance !== '0' && (
          <div className="text-sm text-muted-foreground">
            Your Balance: {tokenBalance} tokens
          </div>
        )}
      </div>
    </div>
  );
}
