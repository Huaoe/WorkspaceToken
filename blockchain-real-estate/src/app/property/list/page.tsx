'use client';

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { PropertyRequest } from '@/types/property'
import { PLACEHOLDER_IMAGE } from '@/lib/constants'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useToast } from "@/components/ui/use-toast"
import { MiniMap } from "@/components/property/mini-map";
import Link from 'next/link'
import { PropertyViewProvider } from '@/contexts/property-view-context';
import AerialView from '@/components/property/aerial-view';
import MarketInsights from '@/components/property/market-insights';
import { Spinner } from "@/components/ui/spinner";
import { useKYCStatus } from '@/hooks/useKYCStatus';
import { useRouter } from 'next/navigation';
import { Progress } from "@/components/ui/progress"
import { formatUnits, parseAbiItem } from "ethers"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image";
import { useWalletEvents } from '@/app/wallet-events-provider';
import { getPropertyFactoryContract, getPropertyTokenContract } from '@/lib/ethereum';

interface PropertyCardProps {
  property: PropertyRequest;
  showAdminControls: boolean;
}

function PropertyCard({ property, showAdminControls }: PropertyCardProps) {
  const { address } = useWalletEvents();
  const { hasSubmittedKYC, isLoading: isKYCLoading } = useKYCStatus(address);
  const { toast } = useToast();
  const router = useRouter();
  const [tokenProgress, setTokenProgress] = useState<number>(0);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);
  const [tokenStats, setTokenStats] = useState<{
    total: string;
    remaining: string;
    sold: string;
    holders: number;
    price: string;
    name: string;
    symbol: string;
  }>({
    total: "0",
    remaining: "0",
    sold: "0",
    holders: 0,
    price: "0",
    name: "",
    symbol: ""
  });

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "bg-red-500";
    if (progress >= 70) return "bg-orange-500";
    if (progress >= 30) return "bg-green-500";
    return "bg-blue-500";
  };

  const formatTokenAmount = (amount: string) => {
    console.log('formatTokenAmount input:', amount);
    if (!amount || isNaN(Number(amount))) {
      console.log('Invalid amount, returning 0');
      return "0";
    }
    const num = parseFloat(amount);
    const formatted = num % 1 === 0 ? num.toLocaleString() : num.toFixed(2);
    return formatted;
  };

  const formatPrice = (price: string) => {
    console.log('formatPrice input:', price);
    if (!price || isNaN(Number(price))) {
      console.log('Invalid price, returning 0.00');
      return "0.00";
    }
    const numPrice = parseFloat(price);
    console.log('Parsed price:', numPrice);
    // Format with thousands separator and 2 decimal places
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numPrice);
    console.log('Formatted price:', formatted);
    return formatted;
  };

  useEffect(() => {
    const fetchTokenSupply = async () => {
      if (!property.token_address) {
        console.log('No token address provided');
        setIsLoadingProgress(false);
        return;
      }

      console.log('Fetching token data for address:', property.token_address);

      try {
        const propertyToken = await getPropertyTokenContract(property.token_address);

        // Fetch all token data in parallel
        const [totalSupply, details, name, symbol] = await Promise.all([
          propertyToken.totalSupply(),
          propertyToken.propertyDetails,
          propertyToken.name(),
          propertyToken.symbol()
        ]);

        console.log('Property details:', details);
        
        // Safely extract price from the tuple returned by getPropertyDetails
        const price = details.price || 0n;
          
        console.log('Price from propertyDetails:', price.toString());

        // Calculate token metrics
        const total = Number(formatUnits(totalSupply, 18));
        console.log('Formatted total supply:', total);

        // Price is in EURC (6 decimals)
        const rawPrice = price;
        console.log('Raw price from contract:', rawPrice.toString());
        
        const priceInEurc = formatUnits(rawPrice, 6);
        console.log('Formatted price in EURC:', priceInEurc);

        // Update token stats with properly formatted price
        setTokenStats({
          total: total.toString(),
          remaining: total.toString(),
          sold: "0",
          holders: 0,
          price: priceInEurc,
          name: name || "",
          symbol: symbol || ""
        });

        // Fetch token holders
        try {
          const filter = propertyToken.filters.Transfer();
          const logs = await propertyToken.queryFilter(filter);
          const uniqueAddresses = new Set<string>();
          
          logs.forEach(log => {
            if (log.args?.from) uniqueAddresses.add(log.args.from);
            if (log.args?.to) uniqueAddresses.add(log.args.to);
          });

          console.log('Number of unique holders:', uniqueAddresses.size);

          // Update token stats with holder count
          setTokenStats(prev => ({
            ...prev,
            holders: uniqueAddresses.size
          }));
        } catch (error) {
          console.error('Error fetching token holders:', error);
        }

      } catch (error) {
        console.error('Error in fetchTokenSupply:', error);
        setTokenStats({
          total: "0",
          remaining: "0",
          sold: "0",
          holders: 0,
          price: "0",
          name: "",
          symbol: ""
        });
      }

      setIsLoadingProgress(false);
    };

    fetchTokenSupply();
  }, [property.token_address]);

  const getStatusColor = (status: PropertyStatus) => {
    switch (status) {
      case 'funding':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'staking':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const handleViewDetails = () => {
    if (!address) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to view property details",
        variant: "destructive"
      });
      return;
    }

    if (!hasSubmittedKYC) {
      toast({
        title: "KYC Required",
        description: "Please submit your KYC information to view property details",
        variant: "destructive"
      });
      router.push('/kyc');
      return;
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
          priority
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
            {property.status === 'staking' ? 'Staking' : 'Funding'}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm mb-2">{property.location}</p>
        <div className="flex items-baseline gap-1 mb-4">
          <span className="font-medium">€{formatPrice(tokenStats.price)}</span>
          <span className="text-muted-foreground">/token</span>
          <span className="text-xs text-muted-foreground ml-1">
            (Total: €{(Number(tokenStats.price) * Number(tokenStats.total)).toLocaleString()})
          </span>
        </div>
        
        {property.token_address && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-help">
                      <span className="text-muted-foreground">Token Sales Progress</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Total Supply: {formatTokenAmount(tokenStats.total)} tokens</p>
                    <p>Remaining: {formatTokenAmount(tokenStats.remaining)} tokens</p>
                    <p>Holders: {tokenStats.holders}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-muted-foreground">
                {tokenProgress}%
              </span>
            </div>
            <Progress
              value={tokenProgress}
              className={cn("h-2", getProgressColor(tokenProgress))}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Link href={`/property/${property.token_address}`} onClick={handleViewDetails}>
            <Button className="w-full" variant="outline">
              View Details
            </Button>
          </Link>
          {property.status === 'funding' && (
            <Link href={`/property/purchase/${property.token_address}`}>
              <Button className="w-full">
                Buy Tokens
              </Button>
            </Link>
          )}
          {property.status === 'staking' && (
            <Link href={`/property/stake/${property.token_address}`}>
              <Button className="w-full">
                Stake Tokens
              </Button>
            </Link>
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
  const { address, isConnected } = useWalletEvents();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Check if connected address is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const factory = await getPropertyFactoryContract();
        const ownerAddress = await factory.owner();
        console.log('Contract owner:', ownerAddress);
        console.log('Current address:', address);
        
        if (address && ownerAddress.toLowerCase() === address.toLowerCase()) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [address, isConnected, mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const { data, error } = await supabase
          .from('property_requests')
          .select('*')
          .in('status', ['funding', 'staking'])
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
      // Filter by status
      if (filterStatus !== 'all' && property.status !== filterStatus) return false;
      
      // Search across multiple fields
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
              <Link href="/property/request">
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
                <SelectItem value="funding">funding</SelectItem>
                <SelectItem value="staking">Staking</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-1">
              <Button
                variant={view === 'grid' ? 'default' : 'outline' }
                size="icon"
                onClick={() => setView('grid')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'outline' }
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
