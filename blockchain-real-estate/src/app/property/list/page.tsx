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
import { formatUnits, parseAbiItem, parseUnits } from "ethers"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image";
import { useWalletEvents } from '@/app/wallet-events-provider';
import { getPropertyFactoryContract, getPropertyTokenContract } from '@/lib/ethereum';

interface PropertyCardProps {
  property: PropertyRequest;
  showAdminControls: boolean;
}

interface PropertyDetails {
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  price: bigint;
  isActive: boolean;
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
  const [onChainDetails, setOnChainDetails] = useState<PropertyDetails>({
    title: '',
    description: '',
    location: '',
    imageUrl: '',
    price: BigInt(0),
    isActive: false,
  });

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "bg-red-500";
    if (progress >= 70) return "bg-orange-500";
    if (progress >= 30) return "bg-green-500";
    return "bg-blue-500";
  };

  const formatTokenAmount = (amount: string) => {
    if (!amount || isNaN(Number(amount))) return "0";
    const num = parseFloat(amount);
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const formatPrice = (price: bigint) => {
    return Number(formatUnits(price, 6)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  useEffect(() => {
    const fetchTokenSupply = async () => {
      if (!property.token_address) {
        setIsLoadingProgress(false);
        return;
      }

      try {
        const propertyToken = await getPropertyTokenContract(property.token_address);

        // Get total supply
        const totalSupply = await propertyToken.totalSupply();
        console.log('Total supply:', totalSupply);

        // Get property details
        const details = await propertyToken.propertyDetails();
        console.log('Property details:', details);

        // Set fixed price of 56 EURC
        const priceInEurc = parseUnits("56", 6);

        setOnChainDetails({
          title: details.title,
          description: details.description,
          location: details.location,
          imageUrl: details.imageUrl || PLACEHOLDER_IMAGE,
          price: priceInEurc,
          isActive: details.isApproved
        });

        // Calculate token stats
        const total = Number(formatUnits(totalSupply, 18));
        const sold = total * (Math.random() * 0.3); // Simulated sold amount for demo
        const remaining = total - sold;

        setTokenStats(prev => ({
          ...prev,
          total: total.toString(),
          remaining: remaining.toString(),
          sold: sold.toString(),
          holders: Math.floor(Math.random() * 50), // Simulated holders for demo
          price: "56",
          name: property.token_name || '',
          symbol: property.token_symbol || ''
        }));

        // Calculate progress
        const progress = (sold / total) * 100;
        setTokenProgress(progress);
      } catch (error) {
        console.error('Error fetching token data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch token data",
          variant: "destructive"
        });
      } finally {
        setIsLoadingProgress(false);
      }
    };

    fetchTokenSupply();
  }, [property.token_address, toast, property.token_name, property.token_symbol]);

  const getStatusBadgeProps = (status: string) => {
    switch (status) {
      case 'funding':
        return {
          variant: "secondary" as const,
          className: "bg-blue-500 text-white"
        };
      case 'staking':
        return {
          variant: "secondary" as const,
          className: "bg-green-500 text-white"
        };
      case 'closed':
        return {
          variant: "secondary" as const,
          className: "bg-gray-500 text-white"
        };
      default:
        return {
          variant: "secondary" as const,
          className: "bg-gray-500 text-white"
        };
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
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="relative">
        <div className="relative w-full h-48 mb-4 rounded-t-lg overflow-hidden">
          <Image
            src={onChainDetails.imageUrl || PLACEHOLDER_IMAGE}
            alt={onChainDetails.title || property.title}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="absolute top-2 right-2">
          <Badge {...getStatusBadgeProps(property.status)}>
            {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
          </Badge>
        </div>
        <CardTitle className="text-xl font-bold">
          {onChainDetails.title || property.title}
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          {onChainDetails.location || property.location}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold">
              €56 <span className="text-sm font-normal">/token</span>
            </p>
            <p className="text-sm text-gray-500">
              (Total: €{(56 * Number(tokenStats.total)).toLocaleString()})
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Token Sales Progress</span>
            <span>{tokenProgress.toFixed(1)}%</span>
          </div>
          <Progress value={tokenProgress} className={cn("h-2", getProgressColor(tokenProgress))} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Available</p>
            <p className="font-medium">{formatTokenAmount(tokenStats.remaining)} tokens</p>
          </div>
          <div>
            <p className="text-gray-500">Total Supply</p>
            <p className="font-medium">{formatTokenAmount(tokenStats.total)} tokens</p>
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <Button
            className="flex-1"
            variant="outline"
            asChild
            onClick={handleViewDetails}
          >
            <Link href={`/property/${property.token_address}`}>
              View Details
            </Link>
          </Button>
          {property.status === 'funding' && (
            <Button
              className="flex-1"
              variant="default"
              asChild
            >
              <Link href={`/property/stake/${property.token_address}`}>
                Stake Tokens
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
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
