'use client';

import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from 'next/link'
import { useContractRead, useAccount } from 'wagmi'
import { propertyFactoryABI } from '@/contracts/abis/propertyFactoryABI'
import { propertyTokenABI } from '@/contracts/abis/propertyTokenABI'
import { formatEther } from 'viem'
import { useEffect, useState } from 'react'
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS
const PROPERTIES_PER_PAGE = 6

// Simple data URL for a gray rectangle with text
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100%25" height="100%25" viewBox="0 0 800 600"%3E%3Crect width="800" height="600" fill="%23f0f0f0"/%3E%3Ctext x="400" y="300" font-family="Arial" font-size="32" text-anchor="middle" fill="%23999"%3EProperty Image%3C/text%3E%3C/svg%3E'

interface PropertyDetails {
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  price: bigint;
}

interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  price: string;
  imageUrl: string;
  isActive: boolean;
  tokenAddress: string;
  status: string;
}

export default function PropertyList() {
  const { address, isConnected } = useAccount()
  const { toast } = useToast()
  const [properties, setProperties] = useState<Property[]>([])
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
              tokenAddress: prop.tokenAddress,
              isActive: prop.isApproved,
              title: details.title || 'Untitled Property',
              description: details.description || 'No description available',
              location: details.location || 'Location not specified',
              imageUrl: details.imageUrl || PLACEHOLDER_IMAGE,
              price: formatEther(priceValue),
              status: details.status || 'pending',
            }
          } catch (error) {
            console.error(`Error fetching details for property ${prop.tokenAddress}:`, error)
            return {
              id: prop.tokenAddress,
              tokenAddress: prop.tokenAddress,
              isActive: prop.isApproved,
              title: 'Error Loading Property',
              description: 'Failed to load property details',
              location: 'Unknown',
              imageUrl: PLACEHOLDER_IMAGE,
              price: '0',
              status: 'error',
            }
          }
        })

        const fetchedProperties = await Promise.all(propertyPromises)
        setProperties(fetchedProperties.filter(Boolean) as Property[])
      } catch (error) {
        console.error('Error fetching property details:', error)
        toast({
          title: "Error",
          description: "Failed to fetch property details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchPropertyDetails()
  }, [userProperties, toast])

  // Calculate pagination values
  const totalPages = Math.ceil(properties.length / PROPERTIES_PER_PAGE)
  const startIndex = (currentPage - 1) * PROPERTIES_PER_PAGE
  const endIndex = startIndex + PROPERTIES_PER_PAGE
  const currentProperties = properties.slice(startIndex, endIndex)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Early return for non-mounted state to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // Show connect wallet message if not connected
  if (!isConnected) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <p className="text-lg">Please connect your wallet to view properties</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <p className="text-lg">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (isContractError) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center">
          <p className="text-lg">Error loading properties. Please check your network connection and try again.</p>
        </div>
    </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Available Properties</h1>
      
      {properties.length === 0 ? (
        <p>No properties found. Create one by clicking "Submit Property" in the navigation bar.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentProperties.map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="aspect-video relative">
                  <Image
                    src={property.imageUrl || PLACEHOLDER_IMAGE}
                    alt={property.title}
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
                  <p className="text-gray-600 text-sm mb-2">{property.location}</p>
                  <p className="text-gray-700 mb-4 line-clamp-2">{property.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">{property.price} EURC</span>
                    <Link href={`/property/${property.tokenAddress}`}>
                      <Button variant="outline">View Details</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={pageNumber === currentPage ? "default" : "outline"}
                  onClick={() => handlePageChange(pageNumber)}
                >
                  {pageNumber}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
