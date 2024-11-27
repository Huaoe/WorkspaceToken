'use client';

import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { PropertyRequest } from '@/types/property';
import { PLACEHOLDER_IMAGE } from '@/lib/constants';
import { supabase } from '@/lib/supabase/client';

interface PropertyCardProps {
  property: PropertyRequest;
  showAdminControls: boolean;
}

function PropertyCard({ property, showAdminControls }: PropertyCardProps) {
  const getStatusColor = (status: PropertyStatus) => {
    switch (status) {
      case 'live':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'staking':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

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
          <Badge className={getStatusColor(property.status as PropertyStatus)}>
            {property.status === 'staking' ? 'Staking' : 'Live'}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm mb-2">{property.location}</p>
        <p className="font-medium">€{property.expected_price}</p>
        <div className="mt-4">
          {property.token_address ? (
            <Link href={`/property/${property.token_address}`}>
              <Button className="w-full">View Details</Button>
            </Link>
          ) : (
            <Button className="w-full" disabled>Property Not Available</Button>
          )}
        </div>
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

  const fetchLiveProperties = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('property_requests')
        .select('*')
        .in('status', ['live', 'staking'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Fetched live and staking properties:', data);
      // Verify each property has a token address
      data?.forEach(property => {
        if (!property.token_address) {
          console.warn('Property missing token address:', property);
        }
      });

      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch properties';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch properties effect
  useEffect(() => {
    if (!mounted) return;
    fetchLiveProperties();
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Available Properties</h1>
        <Link href="/property/request">
          <Button>Submit Property</Button>
        </Link>
      </div>

      {error ? (
        <div className="text-center py-8 text-red-500">
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      ) : isLoading ? (
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
          No available properties found.
        </div>
      )}
    </div>
  );
}
