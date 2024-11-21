'use client';

import { Property } from '@/types/property';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { Address } from 'viem';
import { propertyFactoryABI } from '@/contracts/abis/propertyFactoryABI';
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
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PropertyCardProps {
  property: Property;
  showAdminControls?: boolean;
}

export function PropertyCard({ property, showAdminControls = false }: PropertyCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const { address, isConnected } = useAccount();
  const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as Address;

  // Read owner from the contract
  const { data: owner } = useContractRead({
    address: contractAddress,
    abi: propertyFactoryABI,
    functionName: 'owner',
  });

  // Contract write for approving properties
  const { writeAsync: approveProperty } = useContractWrite({
    address: contractAddress,
    abi: propertyFactoryABI,
    functionName: 'approveProperty',
  });

  const isAdmin = isConnected && address === owner;

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
            args: [property.owner as Address],
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

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="relative h-48 w-full">
        {property.imageUrl ? (
          <Image
            src={property.imageUrl}
            alt={property.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
            No Image Available
          </div>
        )}
      </div>
      <CardHeader className="flex-none">
        <div className="flex justify-between items-start gap-2">
          <div>
            <CardTitle className="text-xl line-clamp-1">{property.name}</CardTitle>
            <CardDescription className="line-clamp-1">{property.location}</CardDescription>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
            property.status === 'approved'
              ? "bg-green-100 text-green-800"
              : property.status === 'rejected'
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
          }`}>
            {property.status === 'approved' ? "Approved" : property.status === 'rejected' ? "Rejected" : "Pending"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 line-clamp-2">{property.description}</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold">{property.price} ETH</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-none">
        {showAdminControls && isAdmin && property.status === 'pending' && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                Review Status
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
                <p><strong>Title:</strong> {property.name}</p>
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
        {!showAdminControls && property.status === 'approved' && (
          <Button className="w-full">
            View Details
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
