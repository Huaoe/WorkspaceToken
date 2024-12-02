'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useContractRead, useContractReads } from 'wagmi';
import { propertyTokenABI } from '@/lib/contracts';
import Image from 'next/image';
import { formatUnits } from '@ethersproject/units';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';

interface PropertyStruct {
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  price: bigint;
  isActive: boolean;
}

interface PropertyDetails {
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  price: bigint;
  isActive: boolean;
}

export default function PropertyDetails() {
  const params = useParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const tokenAddress = params.tokenAddress as `0x${string}`;

  useEffect(() => {
    setMounted(true);
    console.log('Token address from params:', tokenAddress);
  }, [tokenAddress]);

  const { data: propertyData, isLoading: detailsLoading } = useContractReads({
    contracts: [
      {
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: 'propertyDetails',
        args: [],  
      },
      {
        address: tokenAddress,
        abi: propertyTokenABI,
        functionName: 'totalSupply',
      }
    ],
    watch: true,
  });

  const propertyDetails = propertyData?.[0].result as PropertyStruct;
  const totalSupply = propertyData?.[1].result as bigint;

  useEffect(() => {
    if (propertyData?.[0].error || propertyData?.[1].error) {
      setError('Failed to load property details');
      console.error('Contract read error:', propertyData?.[0].error || propertyData?.[1].error);
    } else {
      setError(null);
    }
  }, [propertyData]);

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

  if (detailsLoading || !propertyDetails) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>
              Fetching property details...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const formattedPrice = propertyDetails?.price ? formatUnits(propertyDetails.price, 6) : '0';
  const formattedSupply = totalSupply ? formatUnits(totalSupply, 18) : '0';

  // Ensure image URL is valid and use fallback if not
  const imageUrl = propertyDetails?.imageUrl && propertyDetails.imageUrl.startsWith('http') 
    ? propertyDetails.imageUrl 
    : PLACEHOLDER_IMAGE;

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{propertyDetails.title}</CardTitle>
              <CardDescription>{propertyDetails.location}</CardDescription>
            </div>
            <Badge variant={propertyDetails.isActive ? "success" : "destructive"}>
              {propertyDetails.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative w-full h-64">
            <Image
              src={imageUrl}
              alt={propertyDetails.title}
              fill
              className="object-cover rounded-md"
              onError={() => setImageError(true)}
              priority
            />
          </div>
          <p className="text-lg mb-4">{propertyDetails.description}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Price</h3>
              <p>{formattedPrice} EURC</p>
            </div>
            <div>
              <h3 className="font-semibold">Total Supply</h3>
              <p>{formattedSupply} Tokens</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push('/property/list')}>
            Back to List
          </Button>
          <Button onClick={() => router.push(`/property/purchase/${tokenAddress}`)}>
            Invest Now
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
