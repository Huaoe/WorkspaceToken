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
import { formatEther, parseAbiItem, parseUnits } from "ethers"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image";
import { useWalletEvents } from '@/app/wallet-events-provider';
import { getPropertyFactoryContract, getPropertyTokenContract, getEURCContract } from '@/lib/ethereum';
import { EURC_TOKEN_ADDRESS } from '@/lib/constants';
import { formatUnits } from 'viem';

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
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [tokenStats, setTokenStats] = useState<{
    total: string;
    remaining: string;
    sold: string;
    holders: number;
    price: string;
    name: string;
    symbol: string;
    totalValue: string;
    soldValue: string;
  }>({
    total: "0",
    remaining: "0",
    sold: "0",
    holders: 0,
    price: "0",
    name: "",
    symbol: "",
    totalValue: "0",
    soldValue: "0"
  });
  const [userTokens, setUserTokens] = useState<string>("0");
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
    const num = Number(amount);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  const formatPrice = (price: bigint) => {
    return Number(formatUnits(price, 6)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const calculateLogProgress = (sold: number, total: number): number => {
    if (sold <= 0) return 0;
    if (sold >= total) return 100;
    
    // Use natural log (ln) for the calculation
    // Add 1 to avoid ln(0)
    const progress = Math.log(sold + 1) / Math.log(total + 1) * 100;
    
    // Ensure the progress is between 0 and 100
    return Math.min(Math.max(progress, 0), 100);
  };

  useEffect(() => {
    const fetchTokenSupply = async () => {
      if (!property.token_address) {
        setIsLoadingProgress(false);
        setIsLoadingStats(false);
        return;
      }

      try {
        setIsLoadingStats(true);
        const propertyToken = await getPropertyTokenContract(property.token_address);

        // Get total supply
        const totalSupply = await propertyToken.totalSupply();
        console.log('Total supply:', totalSupply.toString());

        // Get contract owner
        const contractOwner = await propertyToken.owner();
        console.log('Contract owner:', contractOwner);

        // Get owner's balance for remaining tokens
        const ownerBalance = await propertyToken.balanceOf(contractOwner);
        console.log('Owner balance:', ownerBalance.toString());

        // Get the connected user's balance
        let userBalance = BigInt(0);
        if (address) {
          userBalance = await propertyToken.balanceOf(address);
          console.log('User balance:', userBalance.toString());
        }

        // Calculate token stats with proper decimal handling
        const total = Number(formatUnits(totalSupply, 18));
        const remaining = Number(formatUnits(ownerBalance, 18));
        const userTokenAmount = Number(formatUnits(userBalance, 18));
        
        // Calculate sold tokens (total - owner's balance)
        const soldToOthers = total - remaining;
        const totalSold = soldToOthers + (address !== contractOwner ? userTokenAmount : 0);

        console.log('Token stats:', {
          total,
          remaining,
          userTokens: userTokenAmount,
          soldToOthers,
          totalSold,
          isOwner: address === contractOwner
        });
        
        // Get price from property details
        const details = await propertyToken.propertyDetails();
        const pricePerToken = property.price_per_token ? 
          Number(formatUnits(BigInt(property.price_per_token), 6)) : 
          Number(formatUnits(details.price, 6));
        
        // Calculate total value
        const totalValue = total * pricePerToken;
        const soldValue = totalSold * pricePerToken;

        // Calculate logarithmic progress
        const logProgress = calculateLogProgress(totalSold, total);
        console.log('Progress calculation:', {
          totalSold,
          total,
          linearProgress: (totalSold / total) * 100,
          logProgress
        });

        setUserTokens(userTokenAmount.toString());
        setTokenProgress(logProgress);
        
        // Get holders count
        const holdersCount = address && userBalance > 0 ? 2 : 1;

        setTokenStats({
          total: total.toString(),
          remaining: remaining.toString(),
          sold: totalSold.toString(),
          holders: holdersCount,
          price: pricePerToken.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }),
          name: property.token_name || '',
          symbol: property.token_symbol || '',
          totalValue: totalValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }),
          soldValue: soldValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })
        });

        setOnChainDetails({
          title: details.title || property.title,
          description: details.description || property.description,
          location: details.location || property.location,
          imageUrl: details.imageUrl || property.image_url || PLACEHOLDER_IMAGE,
          price: details.price,
          isActive: details.isApproved
        });

      } catch (error) {
        console.error('Error fetching token data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch token data",
          variant: "destructive"
        });
      } finally {
        setIsLoadingProgress(false);
        setIsLoadingStats(false);
      }
    };

    fetchTokenSupply();
  }, [property.token_address, property.owner, property.price_per_token, toast, property.title, property.description, property.location, property.image_url, property.token_name, property.token_symbol, address]);

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
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
        {isLoadingStats ? (
          <div className="flex items-center justify-center py-4">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">
                  €{tokenStats.price} <span className="text-sm font-normal">/token</span>
                </p>
                <p className="text-sm text-gray-500">
                  Total Value: €{tokenStats.totalValue}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Holders</p>
                <p className="text-lg font-bold">{tokenStats.holders}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Available</p>
                <p className="font-medium">{formatTokenAmount(tokenStats.remaining) || '0'} tokens</p>
                <p className="text-xs text-gray-400">€{(Number(tokenStats.remaining || 0) * Number(tokenStats.price)).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Total Supply</p>
                <p className="font-medium">{formatTokenAmount(tokenStats.total) || '0'} tokens</p>
                <p className="text-xs text-gray-400">€{tokenStats.totalValue}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Token Sales Progress</span>
                <span>{(Number(tokenStats.sold) / Number(tokenStats.total) * 100).toFixed(1)}%</span>
              </div>
              <div className="relative">
                <Progress 
                  value={tokenProgress} 
                  className={cn(
                    "h-2",
                    tokenProgress >= 90 ? "bg-green-200" :
                    tokenProgress >= 50 ? "bg-blue-200" :
                    "bg-gray-200"
                  )} 
                />
                {Number(userTokens) > 0 && (
                  <div 
                    className="absolute top-0 h-2 bg-blue-500 opacity-50"
                    style={{
                      width: `${(Number(userTokens) / Number(tokenStats.total)) * 100}%`,
                      left: `${((Number(tokenStats.sold) - Number(userTokens)) / Number(tokenStats.total)) * 100}%`
                    }}
                  />
                )}
              </div>
              {Number(userTokens) > 0 && (
                <p className="text-xs text-gray-500">
                  You own {formatTokenAmount(userTokens)} tokens
                </p>
              )}
            </div>

            <div className="mt-2 space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Sold Tokens</span>
                <span>{formatTokenAmount(tokenStats.sold) || '0'} tokens</span>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Total Value Sold</span>
                <span>€{tokenStats.soldValue}</span>
              </div>
            </div>

            <div className="flex justify-between gap-2">
              <Button
                className="flex-1"
                variant="outline"
                asChild
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
                    Stake
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
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
