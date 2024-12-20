'use client';
import { useWriteContract } from 'wagmi'
import { useEffect, useState } from 'react';
import { useAccount, useContractRead } from 'wagmi';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import propertyFactoryABI from '../../../contracts/abis/PropertyFactory.json';
import whitelistABI from '../../../contracts/abis/Whitelist.json';
import { supabase } from '@/lib/supabase/client';
import { Address } from 'viem';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge'; 
import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon, FileTextIcon, MapPinIcon, CalendarIcon, CoinsIcon, PercentIcon, ClockIcon, BuildingIcon, UserIcon } from "lucide-react"; 
import { PropertyRequest } from '@/types/property';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

export default function AdminRequests() {
  const [requests, setRequests] = useState<PropertyRequest[]>([]);
  const [kycSubmissions, setKYCSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [selectedRequest, setSelectedRequest] = useState<PropertyRequest | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });
  const [geocodedLocations, setGeocodedLocations] = useState<Map<string, { lat: number; lng: number }>>(new Map());
  const [selectedKYC, setSelectedKYC] = useState<any>(null);
  const { toast } = useToast();

  // Whitelist contract configuration
  const whitelistContract = {
    address: process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS as `0x${string}`,
    abi: whitelistABI.abi,
  };

  // Setup contract write for whitelist
  const { writeContract } = useWriteContract()

  // Calculate pagination values
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = requests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(requests.length / itemsPerPage);

  const { address, isConnected } = useAccount();
  const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS as Address;

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
      const [propertyResponse, kycResponse] = await Promise.all([
        supabase
          .from('property_requests')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('kyc_submissions')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (propertyResponse.error) throw propertyResponse.error;
      if (kycResponse.error) throw kycResponse.error;

      console.log('Fetched requests:', propertyResponse.data);
      console.log('Fetched KYC submissions:', kycResponse.data);
      
      setRequests(propertyResponse.data || []);
      setKYCSubmissions(kycResponse.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  async function handleKYCValidation(kycId: string, status: 'approved' | 'rejected') {
    try {
      setLoading(true);
  
      // Get the KYC submission to get the wallet address
      const { data: kycData, error: kycError } = await supabase
        .from('kyc_submissions')
        .select('wallet_address')
        .eq('id', kycId)
        .single();
  
      if (kycError) throw kycError;
  
      let tx;
      // If approving, add the address to the whitelist
      if (status === 'approved' && kycData?.wallet_address) {
        try {
          console.log('Adding to whitelist:', kycData.wallet_address);
          
          // Add to whitelist
          const hash = await writeContract({
            address: process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS as `0x${string}`,
            abi: whitelistABI.abi,
            functionName: 'addToWhitelist',
            args: [kycData.wallet_address as `0x${string}`],
          });
      
          console.log('Transaction hash:', hash);
          
          // Update database with hash
          const { error } = await supabase
            .from('kyc_submissions')
            .update({ 
              status: status, 
              validated_at: new Date().toISOString(),
              whitelist_tx_hash: hash,
            })
            .eq('id', kycId);
      
          if (error) throw error;
      
          toast({
            title: "✨ Success! ✨",
            description: "Address successfully added to whitelist 🎉",
          });
        } catch (error) {
          console.error('Error:', error);
          toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to add to whitelist",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Just update the status for rejection
        const { error } = await supabase
          .from('kyc_submissions')
          .update({ 
            status: status, 
            validated_at: new Date().toISOString(),
          })
          .eq('id', kycId);
  
        if (error) throw error;
      }
  
      // Refresh the data
      await fetchRequests();
  
      toast({
        title: "Success!",
        description: `KYC submission ${status} successfully`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process KYC validation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!mounted || !isConnected || address !== owner) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Property Requests</CardTitle>
          <CardDescription>
            Review and manage property tokenization requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentItems.map((request) => (
              <Card key={request.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{request.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {request.description.substring(0, 100)}...
                      </CardDescription>
                    </div>
                    <Badge
                      className={
                        request.status === 'pending'
                          ? 'bg-yellow-500'
                          : request.status === 'approved'
                          ? 'bg-green-500'
                          : request.status === 'rejected'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }
                    >
                      {request.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <MapPinIcon className="h-4 w-4" />
                      <span className="text-sm">{request.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(request.createdAt || ''), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CoinsIcon className="h-4 w-4" />
                      <span className="text-sm">
                        {request.expected_price} EURC
                      </span>
                    </div>
                    {request.roi && (
                      <div className="flex items-center space-x-2">
                        <PercentIcon className="h-4 w-4" />
                        <span className="text-sm">{request.roi}% ROI</span>
                      </div>
                    )}
                    {request.payoutDuration && (
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-4 w-4" />
                        <span className="text-sm">
                          {request.payoutDuration} days payout
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/requests/${request.id}`)}
                  >
                    View Details
                  </Button>
                  {request.token_address && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="px-2"
                            onClick={() =>
                              window.open(
                                `https://sepolia.etherscan.io/address/${request.token_address}`,
                                '_blank'
                              )
                            }
                          >
                            <ExternalLinkIcon className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View on Etherscan</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <span className="px-4 py-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KYC Submissions Section */}
      <Card>
        <CardHeader>
          <CardTitle>KYC Submissions</CardTitle>
          <CardDescription>
            Review and validate KYC submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {kycSubmissions.map((submission) => (
              <Card key={submission.id}>
                <CardContent className="flex justify-between items-center py-4">
                  <div className="flex items-center space-x-4">
                    <UserIcon className="h-6 w-6" />
                    <div>
                      <p className="font-medium">
                        {submission.wallet_address.substring(0, 6)}...
                        {submission.wallet_address.substring(
                          submission.wallet_address.length - 4
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        Submitted{' '}
                        {formatDistanceToNow(new Date(submission.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {submission.status === 'pending' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleKYCValidation(submission.id, 'rejected')
                          }
                          disabled={loading}
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleKYCValidation(submission.id, 'approved')
                          }
                          disabled={loading}
                        >
                          Approve
                        </Button>
                      </>
                    ) : (
                      <Badge
                        className={
                          submission.status === 'approved'
                            ? 'bg-green-500'
                            : 'bg-red-500'
                        }
                      >
                        {submission.status}
                      </Badge>
                    )}
                    {submission.whitelist_tx_hash && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="px-2"
                              onClick={() =>
                                window.open(
                                  `https://sepolia.etherscan.io/tx/${submission.whitelist_tx_hash}`,
                                  '_blank'
                                )
                              }
                            >
                              <ExternalLinkIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View transaction on Etherscan</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
