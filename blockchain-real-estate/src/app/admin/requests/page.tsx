'use client';

import { useEffect, useState } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { propertyFactoryABI } from '@/contracts/abis/propertyFactoryABI';
import { supabase } from '@/lib/supabase';
import { Address } from 'viem';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface PropertyRequest {
  id: string;
  title: string;
  description: string;
  location: string;
  image_url: string;
  expected_price: string;
  documents?: string;
  wallet_address: string;
  created_at: string;
  status: string;
}

export default function AdminRequests() {
  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const { address, isConnected } = useAccount();
  const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as Address;

  // Read owner from the contract
  const { data: owner } = useContractRead({
    address: contractAddress,
    abi: propertyFactoryABI,
    functionName: 'owner',
  });

  useEffect(() => {
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
  }, [address, isConnected, owner]);

  async function fetchRequests() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('property_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
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
        {requests.map((request) => (
          <Card key={request.id} className="flex flex-col">
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
                  {request.expected_price} ETH
                </Badge>
                <Badge 
                  variant={
                    request.status === 'approved' ? 'success' :
                    request.status === 'rejected' ? 'destructive' :
                    'outline'
                  }
                >
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => window.open(request.documents, '_blank')}
                disabled={!request.documents}
              >
                View Documents
              </Button>
              <Button
                variant="default"
                onClick={() => router.push(`/admin/requests/${request.id}`)}
              >
                Review
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
