'use client';

import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from 'next/link'
import { useAccount, useReadContract, usePublicClient } from 'wagmi'
import propertyFactoryABI from '@contracts/abis/PropertyFactory.json';
import propertyTokenABI from '@contracts/abis/PropertyToken.json';
import { formatEther } from 'viem'
import { useEffect, useState, useCallback } from 'react'
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { PropertyRequest } from '@/types/property';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';

const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as `0x${string}`

interface PropertyCardProps {
  property: PropertyRequest;
  showAdminControls: boolean;
}

function PropertyCard({ property, showAdminControls }: PropertyCardProps) {
  return (
    <div className="bg-card rounded-lg shadow-md overflow-hidden border">
      <div className="aspect-video relative">
        <Image
          src={property.image_url || PLACEHOLDER_IMAGE}
          alt={property.title || 'Property'}
          fill
          className="object-cover"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.src = PLACEHOLDER_IMAGE;
          }}
        />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold">{property.title}</h3>
          <Badge 
            variant={
              property.status === 'approved' ? 'success' :
              property.status === 'rejected' ? 'destructive' :
              'outline'
            }
          >
            {property.status?.charAt(0).toUpperCase() + property.status?.slice(1)}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm mb-2">{property.location}</p>
        <p className="font-medium">€{property.expected_price}</p>
      </div>
    </div>
  );
}

export default function PropertyList() {
  const { address } = useAccount()
  const { toast } = useToast()
  const [properties, setProperties] = useState<PropertyRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const publicClient = usePublicClient()

  // Verify contract and get properties count
  const { data: propertyCount, isLoading: isLoadingCount, isError: isCountError } = useReadContract({
    address: contractAddress,
    abi: propertyFactoryABI.abi,
    functionName: 'userProperties',
    args: [address || '0x0000000000000000000000000000000000000000', 0],
    enabled: !!address && !!publicClient,
    blockTag: 'latest'
  })

  // Fetch all user properties
  const fetchUserProperties = useCallback(async () => {
    if (!address || !publicClient) {
      console.log('No address or public client');
      return;
    }

    if (!contractAddress) {
      console.error('Contract address is not defined');
      setError('Contract address is not configured. Please check your environment variables.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First verify contract exists and has code
      const code = await publicClient.getBytecode({ 
        address: contractAddress,
      });
      
      if (!code || code === '0x') {
        console.error('No contract code found at address:', contractAddress);
        throw new Error(`No contract found at ${contractAddress}. Please ensure contracts are deployed.`);
      }

      // Try to verify contract interface
      try {
        const factoryCheck = await publicClient.readContract({
          address: contractAddress,
          abi: [{ 
            name: 'owner',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [{ type: 'address' }]
          }],
          functionName: 'owner',
        });
        console.log('Contract verified, owner:', factoryCheck);
      } catch (e) {
        console.error('Contract verification failed:', e);
        throw new Error('Invalid contract interface. Please check contract deployment.');
      }

      // Get all property indices
      const indices = Array.from({ length: 10 }, (_, i) => i); // Try first 10 indices
      
      console.log('Fetching properties for address:', address);
      
      const propertyPromises = indices.map(async (index) => {
        try {
          const result = await publicClient.readContract({
            address: contractAddress,
            abi: propertyFactoryABI.abi,
            functionName: 'userProperties',
            args: [address, index],
          });
          console.log(`Property at index ${index}:`, result);
          return result;
        } catch (error) {
          console.log(`No property at index ${index}`);
          return null;
        }
      });

      const propertyResults = await Promise.all(propertyPromises);
      const validProperties = propertyResults.filter(result => 
        result !== null && 
        result.tokenAddress && 
        result.tokenAddress !== '0x0000000000000000000000000000000000000000'
      );

      console.log('Valid properties found:', validProperties.length);

      if (validProperties.length === 0) {
        setProperties([]);
        return;
      }

      // Fetch details for each property
      const propertyDetails = await Promise.all(
        validProperties.map(async (prop: any) => {
          if (!prop || !prop.tokenAddress) return null;

          try {
            console.log('Fetching details for token:', prop.tokenAddress);

            // Verify token contract exists
            const tokenCode = await publicClient.getBytecode({
              address: prop.tokenAddress as `0x${string}`,
            });

            if (!tokenCode || tokenCode === '0x') {
              console.error('No token contract found at:', prop.tokenAddress);
              return null;
            }

            // Read property details from the token contract
            const [title, description, location, imageUrl, price] = await publicClient.readContract({
              address: prop.tokenAddress as `0x${string}`,
              abi: propertyTokenABI.abi,
              functionName: 'getPropertyDetails',
            }) as [string, string, string, string, bigint];

            console.log('Got details for token:', {
              address: prop.tokenAddress,
              title,
              price: price.toString()
            });

            return {
              id: prop.tokenAddress,
              title,
              description,
              location,
              image_url: imageUrl,
              expected_price: formatEther(price),
              status: prop.isApproved ? 'approved' : 'pending',
              tokenized_at: new Date().toISOString(),
              token_address: prop.tokenAddress,
              owner_address: address,
            } as PropertyRequest;
          } catch (error) {
            console.error(`Error fetching details for token ${prop.tokenAddress}:`, error);
            return null;
          }
        })
      );

      const validPropertyDetails = propertyDetails.filter(Boolean);
      console.log('Valid property details:', validPropertyDetails);
      
      if (validPropertyDetails.length === 0) {
        console.log('No valid property details found');
      }
      
      setProperties(validPropertyDetails);
    } catch (error) {
      console.error('Error fetching property details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch property details';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, toast, contractAddress]);

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch properties effect
  useEffect(() => {
    if (!mounted) return;
    fetchUserProperties();
  }, [mounted, address, fetchUserProperties]);

  if (!mounted) return null;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Property Listings</h1>
        <Link href="/property/request">
          <Button>Submit Property</Button>
        </Link>
      </div>

      {error || isCountError ? (
        <div className="text-center py-8 text-red-500">
          <p>{error || 'Failed to connect to the contract'}</p>
          <p className="text-sm mt-2">
            Please ensure:
            <br />1. Your local Hardhat node is running (npx hardhat node)
            <br />2. Contracts are deployed (npx hardhat run scripts/deploy-local.ts --network localhost)
            <br />3. Your wallet is connected to the local network (Chain ID: 31337)
            <br />4. The contract address in .env.local matches the deployed contract
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      ) : !address ? (
        <div className="text-center py-8">
          Please connect your wallet to view properties
        </div>
      ) : isLoading || isLoadingCount ? (
        <div className="text-center py-8">Loading properties...</div>
      ) : properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              showAdminControls={address === property.owner_address}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          No properties found. Submit a property to get started!
        </div>
      )}
    </div>
  );
}
