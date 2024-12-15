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
import { useAccount } from 'wagmi'
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
import { usePublicClient } from 'wagmi'
import { formatUnits, parseAbiItem } from "viem"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { propertyTokenABI, mockEURCABI } from "@/lib/contracts"
import Image from "next/image";

interface PropertyCardProps {
  property: PropertyRequest;
  showAdminControls: boolean;
}

function PropertyCard({ property, showAdminControls }: PropertyCardProps) {
  const { address } = useAccount();
  const { hasSubmittedKYC, isLoading: isKYCLoading } = useKYCStatus(address);
  const { toast } = useToast();
  const router = useRouter();
  const publicClient = usePublicClient();
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
    const num = parseFloat(amount);
    return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
  };

  const formatPrice = (price: string) => {
    return parseFloat(price).toFixed(2);
  };

  useEffect(() => {
    const fetchTokenSupply = async () => {
      if (!property.token_address) {
        setIsLoadingProgress(false);
        return;
      }

      try {
        const propertyContract = {
          address: property.token_address as `0x${string}`,
          abi: propertyTokenABI,
        };

        // First get the owner address
        const owner = await publicClient.readContract({
          ...propertyContract,
          functionName: "owner",
        });

        // Fetch all token data in parallel
        const [
          totalSupply,
          ownerBalance,
          price,
          name,
          symbol
        ] = await Promise.all([
          publicClient.readContract({
            ...propertyContract,
            functionName: "totalSupply",
          }),
          publicClient.readContract({
            ...propertyContract,
            functionName: "balanceOf",
            args: [owner], // Use owner address instead of contract address
          }),
          publicClient.readContract({
            ...propertyContract,
            functionName: "getPrice",
          }),
          publicClient.readContract({
            ...propertyContract,
            functionName: "name",
          }),
          publicClient.readContract({
            ...propertyContract,
            functionName: "symbol",
          })
        ]);

        // Calculate token metrics
        const total = Number(formatUnits(totalSupply, 18));
        const available = Number(formatUnits(ownerBalance, 18));
        const sold = total - available;
        const progress = Math.min((sold / total) * 100, 100);
        const priceInEurc = Number(formatUnits(price, 6));

        setTokenProgress(progress);
        setTokenStats({
          total: total.toString(),
          remaining: available.toString(),
          sold: sold.toString(),
          holders: 0,
          price: priceInEurc.toString(),
          name,
          symbol,
        });

        // Fetch token holders
        try {
          const filter = await publicClient.createEventFilter({
            address: property.token_address as `0x${string}`,
            event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
            fromBlock: 0n
          });
          
          const logs = await publicClient.getFilterLogs({ filter });
          
          // Track current balances
          const balances = new Map<string, bigint>();
          
          for (const log of logs) {
            const { from, to, value } = log.args;
            
            // Skip if from/to is zero address or contract
            if (from !== '0x0000000000000000000000000000000000000000' && 
                from !== property.token_address) {
              const fromBalance = balances.get(from) || 0n;
              balances.set(from, fromBalance - value);
            }
            
            if (to !== '0x0000000000000000000000000000000000000000' && 
                to !== property.token_address) {
              const toBalance = balances.get(to) || 0n;
              balances.set(to, toBalance + value);
            }
          }
          
          // Count addresses with positive balance
          const activeHolders = Array.from(balances.entries())
            .filter(([_, balance]) => balance > 0n);

          setTokenStats(prev => ({
            ...prev,
            holders: activeHolders.length
          }));

        } catch (error) {
          console.error("Error fetching holders:", error);
        }

      } catch (error) {
        console.error("Error fetching token data:", error);
      } finally {
        setIsLoadingProgress(false);
      }
    };

    fetchTokenSupply();
  }, [property.token_address, publicClient]);

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
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <MiniMap location={property.location} height="100%" />
        </div>
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="w-64 p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Supply:</span>
                        <span className="font-medium">{formatTokenAmount(tokenStats.total)} tokens</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tokens Sold:</span>
                        <span className="font-medium">{formatTokenAmount(tokenStats.sold)} tokens</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Available:</span>
                        <span className="font-medium">{formatTokenAmount(tokenStats.remaining)} tokens</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Holders:</span>
                        <span className="font-medium">{tokenStats.holders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{tokenStats.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Symbol:</span>
                        <span className="font-medium">{tokenStats.symbol}</span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="font-medium">{Math.round(tokenProgress)}%</span>
            </div>
            {isLoadingProgress ? (
              <div className="h-2 w-full bg-primary/20 rounded-full animate-pulse" />
            ) : (
              <div className="space-y-1">
                <Progress 
                  value={tokenProgress} 
                  className={cn(
                    "h-2",
                    getProgressColor(tokenProgress)
                  )}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTokenAmount(tokenStats.remaining)} available • {formatPrice(tokenStats.price)} EURC/token</span>
                  <span className="text-xs text-muted-foreground">{tokenStats.holders} holders</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-4">
          {property.token_address ? (
            isKYCLoading ? (
              <Button className="w-full" disabled>
                <Spinner className="mr-2 h-4 w-4" />
                Checking KYC Status
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={handleViewDetails}
                asChild={hasSubmittedKYC}
              >
                {hasSubmittedKYC ? (
                  <Link href={`/property/${property.token_address}`}>
                    View Details
                  </Link>
                ) : (
                  "Submit KYC to View"
                )}
              </Button>
            )
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

  const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS as `0x${string}`;

  // Read admin from contract
  const { data: contractAdmin } = useReadContract({
    address: contractAddress,
    abi: mockEURCABI,
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
