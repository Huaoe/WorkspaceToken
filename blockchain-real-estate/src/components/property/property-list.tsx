'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { PropertyCard } from './property-card';
import { getPropertyFactoryContract } from '@/lib/ethereum';
import { useWalletEvents } from '@/app/wallet-events-provider';

const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS;

export function PropertyList() {
  const [properties, setProperties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const contract = await getPropertyFactoryContract();
        console.log('Got contract:', contract.target);
        
        // Get all properties
        const allProperties = await contract.getProperties();
        console.log('All properties:', allProperties);
        
        // Extract just the addresses from the property data
        const propertyAddresses = allProperties.map((prop: [string, boolean]) => prop[0]);
        console.log('Property addresses:', propertyAddresses);
        
        setProperties(propertyAddresses);
      } catch (error: any) {
        console.error('Error fetching properties:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch properties',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!properties.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No properties found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((propertyAddress) => (
        <PropertyCard key={propertyAddress} address={propertyAddress} />
      ))}
    </div>
  );
}
