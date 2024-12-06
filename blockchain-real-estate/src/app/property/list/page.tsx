'use client';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { PropertyRequest } from '@/types/property'
import { PLACEHOLDER_IMAGE } from '@/lib/constants'
import { supabase } from '@/lib/supabase/client'
import { useReadContract } from 'wagmi'
import propertyFactoryABI from "@contracts/abis/PropertyFactory.json"
import { useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import Link from 'next/link'
import { PropertyViewProvider } from '@/contexts/property-view-context';
import AerialView from '@/components/property/aerial-view';
import MarketInsights from '@/components/property/market-insights';
import { Spinner } from "@/components/ui/spinner";

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
  const [properties, setProperties] = useState<PropertyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as `0x${string}`;

  // Read admin from contract
  const { data: contractAdmin } = useReadContract({
    address: contractAddress,
    abi: propertyFactoryABI.abi,
    functionName: 'admin',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if connected address is admin
  useEffect(() => {
    if (address && contractAdmin) {
      setIsAdmin(address.toLowerCase() === contractAdmin.toLowerCase());
    } else {
      setIsAdmin(false);
    }
  }, [address, contractAdmin]);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const { data, error } = await supabase
          .from('property_requests')
          .select('*')
          .in('status', ['live', 'staking'])
          .order('created_at', { ascending: false });

        if (error) throw error;

        setProperties(data || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
        toast({
          title: "Error",
          description: "Failed to load properties",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [toast]);

  const filteredProperties = properties
    .filter(property => {
      if (filterStatus !== 'all' && property.status !== filterStatus) return false;
      if (searchQuery && !property.address.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'size-high':
          return (b.square_feet || 0) - (a.square_feet || 0);
        case 'size-low':
          return (a.square_feet || 0) - (b.square_feet || 0);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  if (!mounted) return null;

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Properties</h1>
            {isAdmin && (
              <Link href="/property/create">
                <Button>Create Property</Button>
              </Link>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-1">
              <Button
                variant={view === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setView('grid')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setView('list')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="18" y2="18" /></svg>
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <Card className="p-8">
            <div className="flex items-center justify-center min-h-[200px]">
              <Spinner className="h-8 w-8 text-primary" />
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Property List */}
            <div className="flex flex-col gap-4">
              <div className={view === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                : "flex flex-col space-y-4"
              }>
                {filteredProperties.map((property) => (
                  <div
                    key={property.token_address}
                    onClick={() => setSelectedLocation(property.location)}
                    className="cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <PropertyCard property={property} showAdminControls={isAdmin} />
                  </div>
                ))}
              </div>
            </div>

            {/* Map View */}
            <div className="flex flex-col gap-6">
              <div className="lg:sticky lg:top-6 h-[600px]">
                <AerialView location={selectedLocation} />
              </div>
              <MarketInsights location={selectedLocation} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
