'use client';

import { useEffect, useState } from 'react';
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
import { formatEther, parseEther } from 'ethers';

export default function PropertyDetailsPage() {
  const { tokenAddress } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { address, isConnected } = useWalletEvents();
  const [property, setProperty] = useState<PropertyRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [totalSupply, setTotalSupply] = useState('0');
  const [availableSupply, setAvailableSupply] = useState('0');

  useEffect(() => {
    const fetchPropertyDetails = async () => {
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

        // Get token details from blockchain
        try {
          console.log('Initializing contract for address:', tokenAddress);
          const tokenContract = await getPropertyTokenContract(tokenAddress as string, true);
          console.log('Token contract initialized:', tokenContract);

          // Get contract functions from ABI
          const abi = tokenContract.abi;
          const functions = abi
            .filter((item: any) => item.type === 'function')
            .map((item: any) => item.name);
          console.log('Available contract functions:', functions);

          // Get balance
          try {
            const balance = await tokenContract.balanceOf(address);
            console.log('Balance fetched:', balance.toString());
            setTokenBalance(formatEther(balance));
          } catch (error) {
            console.error('Error fetching balance:', error);
          }

          // Get total supply
          try {
            const supply = await tokenContract.totalSupply();
            console.log('Total supply fetched:', supply.toString());
            setTotalSupply(formatEther(supply));
          } catch (error) {
            console.error('Error fetching total supply:', error);
          }

          // Get available supply if it exists
          try {
            const available = await tokenContract.availableSupply();
            setAvailableSupply(formatEther(available));
          } catch (error) {
            console.log('availableSupply not available on this contract');
            setAvailableSupply('0');
          }
        } catch (error) {
          console.error('Error fetching blockchain data:', error);
          toast({
            title: 'Warning',
            description: 'Failed to load blockchain data',
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

    fetchPropertyDetails();
  }, [tokenAddress, address, isConnected, toast]);

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
          <CardTitle>{property.title}</CardTitle>
          <CardDescription>{property.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="relative h-64 w-full mb-4">
                <Image
                  src={property.images?.[0] || '/placeholder.jpg'}
                  alt={property.title}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Location</h3>
                  <p className="text-gray-600">{property.location}</p>
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
                    <p className="font-medium">{property.price_per_token} EURC</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Supply</p>
                    <p className="font-medium">{totalSupply} Tokens</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Available Supply</p>
                    <p className="font-medium">{availableSupply} Tokens</p>
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
    </div>
  );
}
