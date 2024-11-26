'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useContractRead } from 'wagmi';
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

  const { data: propertyDetails, isLoading: detailsLoading, error: detailsError } = useContractRead({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'propertyDetails',
    watch: true,
  });

  const { data: totalSupply, isLoading: supplyLoading, error: supplyError } = useContractRead({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'TOTAL_SUPPLY',
    watch: true,
  });

  useEffect(() => {
    // Log all contract read results
    console.log('Property Details Raw:', propertyDetails);
    console.log('Property Details:', {
      details: propertyDetails,
      detailsLoading,
      detailsError
    });
    console.log('Total Supply:', {
      totalSupply,
      supplyLoading,
      supplyError
    });

    // Check for any errors
    const errors = [];
    if (detailsError) errors.push('Failed to load property details');
    if (supplyError) errors.push('Failed to load total supply');

    if (errors.length > 0) {
      setError(errors.join(', '));
    } else {
      setError(null);
    }
  }, [
    propertyDetails, detailsLoading, detailsError,
    totalSupply, supplyLoading, supplyError,
  ]);

  const handlePurchase = () => {
    router.push(`/property/purchase/${tokenAddress}`);
  };

  // Early return for non-mounted state
  if (!mounted) {
    return null;
  }

  if (detailsLoading || supplyLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <p className="text-lg">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <p className="text-lg text-red-500">Error: {error}</p>
          <p className="mt-2">Token Address: {tokenAddress}</p>
          {detailsError && (
            <pre className="mt-4 text-left text-sm bg-gray-100 p-4 rounded">
              {JSON.stringify(detailsError, null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  }

  if (!propertyDetails) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <p className="text-lg text-red-500">Property not found</p>
          <p className="mt-2">Token Address: {tokenAddress}</p>
        </div>
      </div>
    );
  }

  // Property details comes back as an array from the contract
  // [title, description, location, imageUrl, price, isActive]
  const details: PropertyDetails = {
    title: propertyDetails[0] || 'Untitled Property',
    description: propertyDetails[1] || 'No description available',
    location: propertyDetails[2] || 'Location not specified',
    imageUrl: propertyDetails[3] || '',
    price: propertyDetails[4],
    isActive: propertyDetails[5],
  };

  console.log('Parsed property details:', details);

  // Format price to show in EURC (6 decimals)
  const formattedPrice = details.price ? new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: 'currency',
    currency: 'EUR'
  }).format(Number(formatUnits(details.price, 6))) : 'Price not available';

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{details.title}</CardTitle>
              <CardDescription>{details.location}</CardDescription>
            </div>
            <Badge variant={details.isActive ? "default" : "secondary"}>
              {details.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="aspect-video relative rounded-lg overflow-hidden">
            <Image
              src={imageError || !details.imageUrl ? PLACEHOLDER_IMAGE : details.imageUrl}
              alt={details.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              priority
            />
          </div>
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">{details.description}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Price per Token</h3>
            <p className="text-xl font-bold">{formattedPrice}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Total Supply</h3>
            <p>{totalSupply ? formatUnits(totalSupply, 18) : 'Loading...'} tokens</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">PropertyToken Address</h3>
            <p className="font-mono text-sm break-all">{tokenAddress}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          {details.isActive && (
            <Button onClick={handlePurchase}>
              Purchase Tokens
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
