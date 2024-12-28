'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { PropertyCard } from './property-card';
import { supabase } from '@/lib/supabase/client';
import { PropertyRequest } from '@/types/property';
import { Spinner } from '../ui/spinner';

export function PropertyList({ limit = 3 }: { limit?: number }) {
  const { toast } = useToast();

  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ['featured-properties'],
    queryFn: async () => {
      console.log('Fetching featured properties...');
      const { data, error } = await supabase
        .from('property_requests')
        .select('*')
        .in('status', ['funding', 'staking'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching featured properties:', error);
        throw error;
      }

      console.log('Fetched featured properties:', data);
      return data || [];
    },
    retry: 1,
    refetchOnWindowFocus: false
  });

  if (error) {
    console.error('Error:', error);
    return (
      <div className="text-center py-8 text-red-500">
        Failed to load properties
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner className="h-8 w-8 text-primary" />
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
      {properties.map((property: PropertyRequest) => (
        <PropertyCard 
          key={property.token_address} 
          property={property} 
          showAdminControls={false}
        />
      ))}
    </div>
  );
}
