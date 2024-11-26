'use client';

import { useEffect, useState } from "react";
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useContractRead } from 'wagmi';
import { propertyTokenABI } from '@/lib/contracts';
import { formatUnits } from 'viem';
import Image from 'next/image';

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
  const [mounted, setMounted] = useState(false);
  const tokenAddress = params.tokenAddress as `0x${string}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: propertyDetails, isLoading } = useContractRead({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'getPropertyDetails',
    watch: true,
  });

  const { data: price } = useContractRead({
    address: tokenAddress as `0x${string}`,
    abi: propertyTokenABI,
    functionName: 'getPrice',
    watch: true,
  });

  const { data: totalSupply } = useContractRead({
    address: tokenAddress as `0x${string}`,
    abi: propertyTokenABI,
    functionName: 'totalSupply',
    watch: true,
  });

  const { data: isApproved } = useContractRead({
    address: tokenAddress as `0x${string}`,
    abi: propertyTokenABI,
    functionName: 'isApproved',
    watch: true,
  });

  // Early return for non-mounted state
  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <p className="text-lg">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!propertyDetails) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <p className="text-lg text-red-500">Property not found</p>
        </div>
      </div>
    );
  }

  const details = {
    title: propertyDetails[0],
    description: propertyDetails[1],
    location: propertyDetails[2],
    imageUrl: propertyDetails[3],
    price: propertyDetails[4],
    isActive: propertyDetails[5],
  };

  // Format price to show 5 EURC per token
  const formattedPrice = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: 'currency',
    currency: 'EUR'
  }).format(5);

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{details.title}</CardTitle>
              <CardDescription>{details.location}</CardDescription>
            </div>
            <Badge variant={details.isActive ? 'success' : 'destructive'}>
              {details.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="aspect-video relative rounded-lg overflow-hidden">
            <Image
              src={details.imageUrl}
              alt={details.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Description</h3>
              <p className="text-gray-600">{details.description}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Price per Token</h3>
              <p className="text-2xl font-bold">{formattedPrice}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Contract Address</h3>
              <p className="text-sm font-mono text-gray-600">{tokenAddress}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
          >
            Back
          </Button>
          <Button
            variant="default"
            onClick={() => window.location.href = `/property/purchase/${tokenAddress}`}
            disabled={!details.isActive}
          >
            Purchase Property
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
