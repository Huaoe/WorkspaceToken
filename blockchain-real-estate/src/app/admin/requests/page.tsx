'use client';

import { useEffect, useState } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import propertyFactoryABI from '@contracts/abis/PropertyFactory.json';
import { supabase } from '@/lib/supabase';
import { Address } from 'viem';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge'; 
import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon, FileTextIcon, MapPinIcon, CalendarIcon, CoinsIcon, PercentIcon, ClockIcon, BuildingIcon, UserIcon } from "lucide-react"; 
import { PropertyRequest } from '@/types/property';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';

export default function AdminRequests() {
  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { address, isConnected } = useAccount();
  const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as Address;

  // Read owner from the contract
  const { data: owner } = useContractRead({
    address: contractAddress,
    abi: propertyFactoryABI.abi,
    functionName: 'owner',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isConnected || !address) {
      router.push('/');
      return;
    }

    // Check if the connected address is the owner
    if (owner && address !== owner) {
      router.push('/');
      return;
    }

    fetchRequests();
  }, [address, isConnected, owner, mounted]);

  async function fetchRequests() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('property_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched requests:', data);
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  }

  // Calculate pagination values
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = requests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(requests.length / itemsPerPage);

  // Add pagination handlers
  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'live': return 'bg-purple-100 text-purple-800';
      case 'onchain': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Early return for non-mounted state
  if (!mounted) {
    return null;
  }

  if (!isConnected || !address) {
    return <div className="text-center p-8">Please connect your wallet</div>;
  }

  if (owner && address !== owner) {
    return <div className="text-center p-8">Access restricted to factory owner</div>;
  }

  if (loading) {
    return <div className="text-center p-8">Loading requests...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Property Requests</h1>
        <div className="flex gap-2">
          <Badge variant="outline">{requests.length} Total Requests</Badge>
          <Badge variant="outline">
            {requests.filter(r => r.status === 'pending').length} Pending
          </Badge>
          <Badge variant="outline">
            {requests.filter(r => r.status === 'live').length} Live
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentItems.map((request) => (
          <Card 
            key={request.id} 
            className="flex flex-col hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="line-clamp-1">{request.title}</CardTitle>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPinIcon className="w-4 h-4" />
                    <CardDescription>{request.location}</CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(request.status)}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="aspect-video relative mb-4 overflow-hidden rounded-lg">
                <img
                  src={request.image_url}
                  alt={request.title}
                  className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-sm mb-4 line-clamp-3">{request.description}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-2">
                        <CoinsIcon className="w-4 h-4 text-muted-foreground" />
                        <div className="text-left">
                          <p className="text-sm font-medium">{request.expected_price} EURC</p>
                          <p className="text-xs text-muted-foreground">Price</p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Expected property price</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-2">
                        <BuildingIcon className="w-4 h-4 text-muted-foreground" />
                        <div className="text-left">
                          <p className="text-sm font-medium">{request.number_of_tokens}</p>
                          <p className="text-xs text-muted-foreground">Tokens</p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Number of property tokens</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-muted-foreground" />
                        <div className="text-left">
                          <p className="text-sm font-medium">{request.payout_duration}m</p>
                          <p className="text-xs text-muted-foreground">Payout</p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Payout frequency in months</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-2">
                        <PercentIcon className="w-4 h-4 text-muted-foreground" />
                        <div className="text-left">
                          <p className="text-sm font-medium">{request.roi}%</p>
                          <p className="text-xs text-muted-foreground">ROI</p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Expected annual return on investment</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        <div className="text-left">
                          <p className="text-sm font-medium">
                            {new Date(request.finish_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">End Date</p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Contract end date</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                        <div className="text-left">
                          <p className="text-sm font-medium truncate w-24">
                            {request.creator_address?.slice(0, 6)}...{request.creator_address?.slice(-4)}
                          </p>
                          <p className="text-xs text-muted-foreground">Creator</p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Property creator address</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {request.token_address && (
                <div className="mt-4 p-2 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Token Address:</span>
                    <code className="text-xs">{request.token_address.slice(0, 6)}...{request.token_address.slice(-4)}</code>
                  </div>
                </div>
              )}

              <div className="mt-4 text-xs text-muted-foreground">
                Created {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </div>
            </CardContent>

            <CardFooter className="flex justify-between gap-2">
              {request.documents_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(request.documents_url, '_blank');
                  }}
                >
                  <FileTextIcon className="w-4 h-4" />
                  Documents
                  <ExternalLinkIcon className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/admin/requests/${request.id}`);
                }}
              >
                Review Request
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {requests.length > itemsPerPage && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            size="sm"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            size="sm"
          >
            Next
            <ChevronRightIcon className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
