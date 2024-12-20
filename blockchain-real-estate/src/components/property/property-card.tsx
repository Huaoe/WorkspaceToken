'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/use-toast";
import { getPropertyTokenContract } from '@/lib/ethereum';
import { useWalletEvents } from '@/app/wallet-events-provider';
import { formatUnits } from 'viem';

interface PropertyCardProps {
  address: string;
}

interface PropertyData {
  name: string;
  symbol: string;
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  price: bigint;
  totalSupply: bigint;
  owner: string;
}

export function PropertyCard({ address }: PropertyCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [property, setProperty] = useState<PropertyData | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const { address: userAddress } = useWalletEvents();

  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        setLoading(true);
        setError(null);

        const contract = await getPropertyTokenContract(address);
        console.log('Fetching property data for:', address);

        // Get property details
        const details = await contract.propertyDetails();
        const name = await contract.name();
        const symbol = await contract.symbol();
        const owner = await contract.owner();

        const data: PropertyData = {
          name,
          symbol,
          title: details.title,
          description: details.description,
          location: details.location,
          imageUrl: details.imageUrl,
          price: BigInt(details.price.toString()),
          totalSupply: await contract.totalSupply(),
          owner
        };

        console.log('Property data:', data);
        setProperty(data);
      } catch (error: any) {
        console.error('Error fetching property data:', error);
        setError(error.message || 'Failed to fetch property data');
      } finally {
        setLoading(false);
      }
    };

    if (address) {
      fetchPropertyData();
    }
  }, [address]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !property) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            {error || 'Failed to load property'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{property.title}</CardTitle>
        <CardDescription>{property.location}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {property.imageUrl && (
          <div className="relative h-48 w-full">
            <Image
              src={property.imageUrl}
              alt={property.title}
              fill
              className="object-cover rounded-md"
            />
          </div>
        )}
        <div className="space-y-2">
          <p className="text-sm text-gray-500">{property.description}</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold">
                {formatUnits(property.price, 6)} EURC
              </p>
              <p className="text-sm text-gray-500">
                Total Supply: {formatUnits(property.totalSupply, 18)} {property.symbol}
              </p>
            </div>
            <Button
              onClick={() => router.push(`/property/purchase/${address}`)}
              className="ml-auto"
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
