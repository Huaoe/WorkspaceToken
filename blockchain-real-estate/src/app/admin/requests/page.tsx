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
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

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

  // Calculate pagination values
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = requests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(requests.length / itemsPerPage);

  const mapContainerStyle = {
    width: '100%',
    height: '200px'
  };

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

  const geocodeLocation = async (location: string) => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) return null;
    
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          location
        )}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results[0]) {
        return data.results[0].geometry.location;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  useEffect(() => {
    const geocodeLocations = async () => {
      for (const request of requests.slice(indexOfFirstItem, indexOfLastItem)) {
        if (!geocodedLocations.has(request.id!) && request.location) {
          const coords = await geocodeLocation(request.location);
          if (coords) {
            setGeocodedLocations(prev => new Map(prev).set(request.id!, coords));
          }
        }
      }
    };

    geocodeLocations();
  }, [requests, indexOfFirstItem, indexOfLastItem]);

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
      case 'funding': return 'bg-purple-100 text-purple-800';
      case 'onchain': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  async function handleKYCValidation(kycId: string, status: 'approved' | 'rejected') {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('kyc_submissions')
        .update({ status: status, validated_at: new Date().toISOString() })
        .eq('id', kycId);

      if (error) throw error;

      // Update local state
      setKYCSubmissions(prev => 
        prev.map(kyc => 
          kyc.id === kycId ? { ...kyc, status: status, validated_at: new Date().toISOString() } : kyc
        )
      );

      // Close the modal if open
      setSelectedKYC(null);
    } catch (err) {
      console.error('Error updating KYC status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update KYC status');
    } finally {
      setLoading(false);
    }
  }

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
      {/* Property Requests Section */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Property Requests</h1>
          <div className="flex gap-2">
            <Badge variant="outline">{requests.length} Total Requests</Badge>
            <Badge variant="outline">
              {requests.filter(r => r.status === 'pending').length} Pending
            </Badge>
            <Badge variant="outline">
              {requests.filter(r => r.status === 'funding').length} Funding
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
                {request.id && geocodedLocations.has(request.id) && (
                  <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
                    <GoogleMap
                      mapContainerStyle={mapContainerStyle}
                      center={geocodedLocations.get(request.id)}
                      zoom={13}
                    >
                      <Marker position={geocodedLocations.get(request.id)!} />
                    </GoogleMap>
                  </LoadScript>
                )}
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
      </div>

      {/* KYC Submissions Section */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">KYC Submissions</h1>
          <div className="flex gap-2">
            <Badge variant="outline">{kycSubmissions.length} Total Submissions</Badge>
            <Badge variant="outline">
              {kycSubmissions.filter(k => !k.status || k.status === 'pending').length} Pending
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kycSubmissions.map((kyc) => (
            <Card key={kyc.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span className="truncate">
                    {kyc.first_name} {kyc.last_name}
                  </span>
                  <Badge className={getStatusColor(kyc.status || 'pending')}>
                    {kyc.status || 'Pending'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    <span className="truncate">{kyc.wallet_address}</span>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Nationality:</span> {kyc.nationality}
                  </div>
                  <div>
                    <span className="font-medium">Country of Residence:</span> {kyc.country_of_residence}
                  </div>
                  <div>
                    <span className="font-medium">Employment:</span> {kyc.employment_status}
                  </div>
                  <div>
                    <span className="font-medium">Trading Experience:</span> {kyc.trading_experience}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between mt-auto">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedKYC(kyc)}
                >
                  View Details
                </Button>
                {(!kyc.status || kyc.status === 'pending') && (
                  <div className="flex gap-2">
                    <Button 
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleKYCValidation(kyc.id, 'approved')}
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => handleKYCValidation(kyc.id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* KYC Details Modal */}
      {selectedKYC && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>KYC Details</CardTitle>
                <Button variant="ghost" onClick={() => setSelectedKYC(null)}>×</Button>
              </div>
              <Badge className={getStatusColor(selectedKYC.status || 'pending')}>
                {selectedKYC.status || 'Pending'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Personal Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Full Name:</span> {selectedKYC.salutation} {selectedKYC.first_name} {selectedKYC.middle_name} {selectedKYC.last_name}</p>
                    <p><span className="font-medium">Date of Birth:</span> {selectedKYC.date_of_birth}</p>
                    <p><span className="font-medium">Nationality:</span> {selectedKYC.nationality}</p>
                    <p><span className="font-medium">Country of Residence:</span> {selectedKYC.country_of_residence}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Contact Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Email:</span> {selectedKYC.email}</p>
                    <p><span className="font-medium">Phone:</span> {selectedKYC.phone_country_code} {selectedKYC.phone_number}</p>
                    <p><span className="font-medium">Address:</span> {selectedKYC.street_address}, {selectedKYC.city}, {selectedKYC.state} {selectedKYC.postal_code}, {selectedKYC.country}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Identity Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">ID Type:</span> {selectedKYC.identification_type}</p>
                    <p><span className="font-medium">ID Number:</span> {selectedKYC.identification_number}</p>
                    <p><span className="font-medium">Issue Date:</span> {selectedKYC.identification_issue_date}</p>
                    <p><span className="font-medium">Expiry Date:</span> {selectedKYC.identification_expiry_date}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Financial Information</h3>
                  <div className="space-y-2">
                    <p><span className="font-medium">Employment:</span> {selectedKYC.employment_status}</p>
                    <p><span className="font-medium">Source of Funds:</span> {selectedKYC.source_of_funds}</p>
                    <p><span className="font-medium">Annual Income:</span> {selectedKYC.annual_income}</p>
                    <p><span className="font-medium">Trading Experience:</span> {selectedKYC.trading_experience}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              {(!selectedKYC.status || selectedKYC.status === 'pending') && (
                <>
                  <Button 
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleKYCValidation(selectedKYC.id, 'approved')}
                  >
                    Approve
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleKYCValidation(selectedKYC.id, 'rejected')}
                  >
                    Reject
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setSelectedKYC(null)}>
                Close
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

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
