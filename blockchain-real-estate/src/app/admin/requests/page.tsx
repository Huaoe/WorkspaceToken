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
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"; 
import { PropertyRequest } from '@/types/property';


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
      <h1 className="text-3xl font-bold mb-8">Property Requests</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentItems.map((request) => (
          <Card 
            key={request.id} 
            className="flex flex-col hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <CardTitle>{request.title}</CardTitle>
              <CardDescription>{request.location}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="aspect-video relative mb-4">
                <img
                  src={request.image_url}
                  alt={request.title}
                  className="rounded-lg object-cover w-full h-full"
                />
              </div>
              <p className="text-sm mb-2 line-clamp-3">{request.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">
                  {request.expected_price} EURC
                </Badge>
                <Badge 
                  variant={
                    request.status === 'approved' ? 'success' :
                    request.status === 'rejected' ? 'destructive' :
                    request.status === 'pending' ? 'secondary' :
                    request.status === 'live' ? 'purple' :
                    'outline'
                  }
                >
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                disabled={!request.documents_url}
                variant="link"
                onClick={(e) => {
                  e.stopPropagation();
                  if (request.documents_url) {
                    window.open(request.documents_url, '_blank');
                  }
                }
              }
              >
                View Documents
              </Button>
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/admin/requests/${request.id}`);
                }}
              >
                Review
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {requests.length > 0 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <Button
            variant="outline"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            Previous
          </Button>
          
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
