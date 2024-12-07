'use client';

import { PropertyRequest } from '@/types/property';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useAccount, useContractRead, useContractWrite, useReadContract } from 'wagmi';
import { Address } from 'viem';
import propertyFactoryABI from '@contracts/abis/PropertyFactory.json';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useState, useContext } from 'react';
import { supabase } from '@/lib/supabase';
import { PropertyViewContext } from '@/contexts/property-view-context';

interface PropertyCardProps {
  property: PropertyRequest;
  showAdminControls?: boolean;
}

export function PropertyCard({ property, showAdminControls = false }: PropertyCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { address } = useAccount();
  const router = useRouter();
  const { toast } = useToast();
  const view = useContext(PropertyViewContext);

  const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as Address;

  // Read owner from the contract
  const { data: owner } = useReadContract({
    address: contractAddress,
    abi: propertyFactoryABI.abi,
    functionName: 'owner',
    query: {
      enabled: address !== undefined, // Optional: only fetch when connected
    },
  });

  // Contract write for approving properties
  const { writeAsync: approveProperty } = useContractWrite({
    address: contractAddress,
    abi: propertyFactoryABI.abi,
    functionName: 'approveProperty',
  });

  const isAdmin = address !== undefined && address === owner;

  async function handleStatusChange(newStatus: 'approved' | 'rejected') {
    try {
      setIsUpdating(true);

      // Update status in Supabase
      const { error: updateError } = await supabase
        .from('property_requests')
        .update({ status: newStatus })
        .eq('id', property.id);

      if (updateError) throw updateError;

      // If approving, also update the blockchain
      if (newStatus === 'approved') {
        try {
          await approveProperty({
            args: [property.owner_address as Address],
          });
        } catch (contractError) {
          console.error('Contract error:', contractError);
          toast({
            title: "Contract Error",
            description: "Failed to approve property on the blockchain",
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Success",
        description: `Property ${newStatus} successfully`,
      });

      setIsDialogOpen(false);
      router.refresh();
    } catch (err) {
      console.error('Error updating status:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update status',
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  const renderGridView = () => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 w-full group">
        <Image
          src={property.image_url || '/placeholder-property.jpg'}
          alt={property.address}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-2 right-2">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
            property.status === 'funding' 
              ? 'bg-purple-100 text-purple-800'
              : property.status === 'staking'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {property.status === 'funding' ? 'Funding' : property.status === 'staking' ? 'Staking' : property.status}
          </span>
        </div>
      </div>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2 w-full">
            <CardTitle className="text-xl flex items-center justify-between">
              <span className="truncate">{property.address}</span>
              <span className="text-2xl font-bold text-primary">${property.price?.toLocaleString()}</span>
            </CardTitle>
            <CardDescription>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">PROPERTY TYPE</span>
                    <p className="font-medium capitalize">{property.property_type}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">BEDROOMS</span>
                    <p className="font-medium">{property.bedrooms || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">YEAR BUILT</span>
                    <p className="font-medium">{property.year_built || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">SIZE</span>
                    <p className="font-medium">{property.square_feet?.toLocaleString()} sq ft</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">BATHROOMS</span>
                    <p className="font-medium">{property.bathrooms || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">PARKING</span>
                    <p className="font-medium">{property.parking_spots ? `${property.parking_spots} spots` : 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Description</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{property.description}</p>
          </div>
          {property.token_address && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div>
                  <span className="font-semibold">Token Address:</span>
                  <p className="truncate font-mono">{property.token_address}</p>
                </div>
                {property.total_supply && (
                  <div className="text-right">
                    <span className="font-semibold">Total Supply:</span>
                    <p>{property.total_supply.toLocaleString()} tokens</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {property.owner_address && (
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold">Owner:</span>
              <p className="truncate font-mono">{property.owner_address}</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.push(`/property/${property.id}`)}
        >
          View Details
        </Button>
        {showAdminControls && property.status === 'pending' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1" onClick={() => setIsDialogOpen(true)}>
                Review
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Property Status</DialogTitle>
                <DialogDescription>
                  Choose whether to approve or reject this property listing.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <p><strong>Title:</strong> {property.address}</p>
                <p><strong>Location:</strong> {property.location}</p>
                <p><strong>Price:</strong> {property.price} ETH</p>
              </div>
              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleStatusChange('rejected')}
                  disabled={isUpdating}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => handleStatusChange('approved')}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Processing...' : 'Approve'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );

  const renderListView = () => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="flex">
        <div className="relative w-72 h-full">
          <Image
            src={property.image_url || '/placeholder-property.jpg'}
            alt={property.address}
            width={288}
            height={216}
            className="object-cover h-full"
          />
          <div className="absolute top-2 right-2">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
              property.status === 'funding' 
                ? 'bg-purple-100 text-purple-800'
                : property.status === 'staking'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {property.status === 'funding' ? 'Funding' : property.status === 'staking' ? 'Staking' : property.status}
            </span>
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-2xl font-bold">{property.address}</h3>
              <p className="text-muted-foreground">{property.location}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">${property.price?.toLocaleString()}</p>
              {property.price_per_token && (
                <p className="text-sm text-muted-foreground">
                  ${property.price_per_token} per token
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6 mb-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Property Details</h4>
              <div className="space-y-1">
                <p className="text-sm"><span className="text-muted-foreground">Type:</span> {property.property_type}</p>
                <p className="text-sm"><span className="text-muted-foreground">Size:</span> {property.square_feet?.toLocaleString()} sq ft</p>
                <p className="text-sm"><span className="text-muted-foreground">Year Built:</span> {property.year_built || 'N/A'}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Features</h4>
              <div className="space-y-1">
                <p className="text-sm"><span className="text-muted-foreground">Bedrooms:</span> {property.bedrooms}</p>
                <p className="text-sm"><span className="text-muted-foreground">Bathrooms:</span> {property.bathrooms}</p>
                <p className="text-sm"><span className="text-muted-foreground">Parking:</span> {property.parking_spots} spots</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Investment Info</h4>
              <div className="space-y-1">
                <p className="text-sm"><span className="text-muted-foreground">Total Supply:</span> {property.total_supply?.toLocaleString() || 'N/A'}</p>
                <p className="text-sm"><span className="text-muted-foreground">Available:</span> {property.available_supply?.toLocaleString() || 'N/A'}</p>
                <p className="text-sm"><span className="text-muted-foreground">Min Investment:</span> ${property.min_investment?.toLocaleString() || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="space-y-1 flex-1">
              <p className="text-sm line-clamp-2 text-muted-foreground">{property.description}</p>
              {property.token_address && (
                <p className="text-xs text-muted-foreground font-mono truncate">
                  Token: {property.token_address}
                </p>
              )}
            </div>
            <div className="flex gap-2 ml-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/property/${property.id}`)}
              >
                View Details
              </Button>
              {showAdminControls && property.status === 'pending' && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  Review
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  return view === 'list' ? renderListView() : renderGridView();
}
