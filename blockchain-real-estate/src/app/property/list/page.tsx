'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { PropertyCard } from "@/components/property/property-card";
import AerialView from "@/components/property/aerial-view";
import MarketInsights from "@/components/property/market-insights";
import { useWalletEvents } from '@/app/wallet-events-provider';
import { getPropertyFactoryContract } from '@/lib/ethereum';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { PropertyRequest } from '@/types/property';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from 'react-error-boundary';

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'price-high' | 'price-low';
type FilterStatus = 'all' | 'funding' | 'staking';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  filterStatus: FilterStatus;
  onFilterChange: (value: FilterStatus) => void;
  view: ViewMode;
  onViewChange: (value: ViewMode) => void;
}

const useProperties = () => {
  return useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_requests')
        .select('*')
        .in('status', ['funding', 'staking'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });
};

const useIsAdmin = (address: string | undefined) => {
  return useQuery({
    queryKey: ['isAdmin', address],
    queryFn: async () => {
      if (!address) return false;
      const factory = await getPropertyFactoryContract();
      const ownerAddress = await factory.owner();
      return ownerAddress.toLowerCase() === address.toLowerCase();
    },
    enabled: !!address
  });
};

const FilterBar = ({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  filterStatus,
  onFilterChange,
  view,
  onViewChange
}: FilterBarProps) => (
  <div className="flex flex-col sm:flex-row gap-4 w-full">
    <Input
      placeholder="Search properties..."
      value={searchQuery}
      onChange={(e) => onSearchChange(e.target.value)}
      className="flex-1"
      aria-label="Search properties"
    />
    <Select value={sortBy} onValueChange={onSortChange}>
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
    <Select value={filterStatus} onValueChange={onFilterChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Properties</SelectItem>
        <SelectItem value="funding">Funding</SelectItem>
        <SelectItem value="staking">Staking</SelectItem>
      </SelectContent>
    </Select>
    <div className="flex items-center space-x-1">
      <Button
        variant={view === 'grid' ? 'default' : 'outline'}
        size="icon"
        onClick={() => onViewChange('grid')}
        aria-label="Grid view"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
      </Button>
      <Button
        variant={view === 'list' ? 'default' : 'outline'}
        size="icon"
        onClick={() => onViewChange('list')}
        aria-label="List view"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="18" y2="18" /></svg>
      </Button>
    </div>
  </div>
);

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => (
  <Card className="p-8 text-center">
    <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
    <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
    <Button onClick={resetErrorBoundary}>Try again</Button>
  </Card>
);

export default function PropertyList() {
  const [view, setView] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  
  const { address } = useWalletEvents();
  const { data: properties = [], isLoading: isLoadingProperties } = useProperties();
  const { data: isAdmin = false } = useIsAdmin(address);
  const { toast } = useToast();

  const filteredProperties = properties
    .filter(property => {
      if (filterStatus !== 'all' && property.status !== filterStatus) return false;
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          property.title?.toLowerCase().includes(searchLower) ||
          property.location?.toLowerCase().includes(searchLower) ||
          property.description?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Properties</h1>
            {isAdmin && (
              <Link href="/property/request">
                <Button>Create Property</Button>
              </Link>
            )}
          </div>

          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            filterStatus={filterStatus}
            onFilterChange={setFilterStatus}
            view={view}
            onViewChange={setView}
          />
        </div>

        <ErrorBoundary FallbackComponent={ErrorFallback}>
          {isLoadingProperties ? (
            <Card className="p-8">
              <div className="flex items-center justify-center min-h-[200px]">
                <Spinner className="h-8 w-8 text-primary" />
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex flex-col gap-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={view}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={view === 'grid' 
                      ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                      : "flex flex-col space-y-4"
                    }
                  >
                    {filteredProperties.map((property) => (
                      <motion.div
                        key={property.token_address}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        onClick={() => setSelectedLocation(property.location)}
                        className="cursor-pointer transition-all hover:scale-[1.02]"
                      >
                        <PropertyCard property={property} showAdminControls={isAdmin} />
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex flex-col gap-6">
                <div className="lg:sticky lg:top-6 h-[600px]">
                  <AerialView location={selectedLocation} />
                </div>
                <MarketInsights location={selectedLocation} />
              </div>
            </div>
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}
