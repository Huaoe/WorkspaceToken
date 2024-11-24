'use client';

import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from 'next/link'
import { useContractRead, useAccount } from 'wagmi'
import { propertyFactoryABI } from '@contracts/abis/propertyFactoryABI'
import { propertyTokenABI } from '@contracts/abis/propertyTokenABI'
import { formatEther } from 'viem'
import { useEffect, useState, useCallback } from 'react'
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { PropertyRequest } from '@/types/property';
import { PLACEHOLDER_IMAGE, PROPERTIES_PER_PAGE, STATUS_COLORS } from '@/lib/constants';

const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS

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
          alt={property.property_type}
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
          <h3 className="text-lg font-semibold">{property.property_type}</h3>
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
        <p className="text-card-foreground mb-4 line-clamp-2">{property.description}</p>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-lg font-semibold">{property.price} EURC</span>
            <span className="text-sm text-muted-foreground">{property.area} m²</span>
          </div>
          <Link href={`/property/${property.id}`}>
            <Button variant="outline">View Details</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PropertyList() {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const [properties, setProperties] = useState<PropertyRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: factoryOwner } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: propertyFactoryABI,
    functionName: 'owner',
  })

  // Get all properties for the factory owner
  const { data: userProperties, isError: isContractError } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: propertyFactoryABI,
    functionName: 'getUserProperties',
    args: [factoryOwner as `0x${string}`],
    watch: true,
    enabled: Boolean(factoryOwner),
  })

  // Move the toast function outside useEffect and memoize it
  const showToast = useCallback((param) => {
    toast({
      ...param
    });
  }, []);

  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (!userProperties || !Array.isArray(userProperties)) {
        setIsLoading(false)
        return;
      }

      try {
        const propertyPromises = userProperties.map(async (prop: any) => {
          if (!prop.tokenAddress) {
            console.error('Invalid property data:', prop)
            return null;
          }

          try {
            console.log('Fetching details for property:', prop.tokenAddress)
            
            // Read property details from the token contract
            const response = await fetch('/api/readContract', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                address: prop.tokenAddress,
                abi: propertyTokenABI,
                functionName: 'getPropertyDetails',
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.details || `HTTP error! status: ${response.status}`);
            }

            const details = await response.json();
            console.log('Property details received:', details);
            
            // Validate the response data
            if (!details || !details.price) {
              console.error('Invalid property details:', details)
              return null;
            }

            // Handle both string and bigint price formats
            const priceValue = typeof details.price === 'string' 
              ? BigInt(details.price) 
              : details.price;

            return {
              id: prop.tokenAddress,
              property_type: details.title || 'Untitled Property',
              description: details.description || 'No description available',
              location: details.location || 'Location not specified',
              image_url: details.imageUrl || PLACEHOLDER_IMAGE,
              price: formatEther(priceValue),
              owner_address: details.owner || '',
              status: details.status || 'pending',
              area: details.area || 0,
              latitude: details.latitude || 0,
              longitude: details.longitude || 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          } catch (error) {
            console.error(`Error fetching details for property ${prop.tokenAddress}:`, error)
            return {
              id: prop.tokenAddress,
              property_type: 'Error Loading Property',
              description: 'Failed to load property details',
              location: 'Unknown',
              image_url: PLACEHOLDER_IMAGE,
              price: '0',
              owner_address: '',
              status: 'error',
              area: 0,
              latitude: 0,
              longitude: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          }
        })

        const fetchedProperties = await Promise.all(propertyPromises)
        setProperties(fetchedProperties.filter(Boolean) as PropertyRequest[])
      } catch (error) {
        console.error('Error fetching property details:', error)
        showToast({
          title: "Error",
          description: "Failed to fetch property details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (mounted) {
      fetchPropertyDetails()
    }
  }, [userProperties, showToast, mounted])

  // Calculate pagination values
  const totalPages = Math.ceil(properties.length / PROPERTIES_PER_PAGE)
  const startIndex = (currentPage - 1) * PROPERTIES_PER_PAGE
  const endIndex = startIndex + PROPERTIES_PER_PAGE
  const currentProperties = properties.slice(startIndex, endIndex)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  if (!mounted) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Properties</h1>
        <Link href="/property/submit">
          <Button>Submit Property</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(PROPERTIES_PER_PAGE)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted rounded-lg h-[300px]"></div>
            </div>
          ))}
        </div>
      ) : properties.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {currentProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                showAdminControls={isConnected && address === factoryOwner}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <Button
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No properties found.</p>
        </div>
      )}
    </div>
  )
}
