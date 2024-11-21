'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useContractRead, useWaitForTransaction, usePublicClient, useWalletClient } from 'wagmi';
import { propertyFactoryABI } from '@/contracts/abis/propertyFactoryABI';
import { propertyTokenABI } from '@/contracts/abis/propertyTokenABI';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { parseEther } from 'viem';

export default function PropertyReview() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const tokenAddress = params.tokenAddress as `0x${string}`;
  const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as `0x${string}`;

  // Check if user is factory owner
  const { data: factoryOwner } = useContractRead({
    address: contractAddress,
    abi: propertyFactoryABI,
    functionName: 'owner',
  });

  // Get property details
  const { data: propertyDetails } = useContractRead({
    address: tokenAddress,
    abi: propertyTokenABI,
    functionName: 'getPropertyDetails',
  });

  useEffect(() => {
    const checkOwnership = async () => {
      try {
        if (!address) {
          toast({
            title: "Error",
            description: "Please connect your wallet",
            variant: "destructive",
          });
          router.push('/property/list');
          return;
        }

        // Check if user is factory owner
        if (factoryOwner) {
          console.log('Ownership check:', {
            factoryOwner,
            currentAddress: address,
            isOwner: factoryOwner.toLowerCase() === address.toLowerCase()
          });

          const owner = await publicClient.readContract({
            address: contractAddress,
            abi: propertyFactoryABI,
            functionName: 'owner',
          });

          console.log('Contract owner from direct call:', owner);
          
          if (owner.toLowerCase() !== address.toLowerCase()) {
            toast({
              title: "Access Denied",
              description: "Only the factory owner can review properties",
              variant: "destructive",
            });
            router.push('/property/list');
          }
        }
      } catch (error) {
        console.error('Error checking ownership:', error);
        toast({
          title: "Error",
          description: "Failed to verify ownership",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    };

    checkOwnership();
  }, [factoryOwner, address, router, publicClient, contractAddress, toast]);

  const handleApprove = async () => {
    try {
      setIsApproving(true);

      if (!address || !walletClient) {
        toast({
          title: "Error",
          description: "Please connect your wallet",
          variant: "destructive",
        });
        return;
      }

      // Double check ownership before proceeding
      const owner = await publicClient.readContract({
        address: contractAddress,
        abi: propertyFactoryABI,
        functionName: 'owner',
      });

      console.log('Approving property with:', {
        contractAddress,
        tokenAddress,
        factoryOwner,
        currentAddress: address,
        contractOwner: owner,
        isOwner: owner.toLowerCase() === address.toLowerCase()
      });

      if (owner.toLowerCase() !== address.toLowerCase()) {
        toast({
          title: "Error",
          description: "Connected wallet is not the contract owner",
          variant: "destructive",
        });
        return;
      }

      // Use walletClient to send transaction directly
      const { request } = await publicClient.simulateContract({
        account: address,
        address: contractAddress,
        abi: propertyFactoryABI,
        functionName: 'approveProperty',
        args: [tokenAddress],
      });

      const hash = await walletClient.writeContract(request);
      console.log('Transaction hash:', hash);

      // Wait for transaction
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log('Transaction receipt:', receipt);

      toast({
        title: "Success",
        description: "Property has been approved successfully",
      });
      
      router.push('/property/list');
    } catch (error) {
      console.error('Error approving property:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve property",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  const [title, description, location, imageUrl, price] = propertyDetails || [];

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Review Property</CardTitle>
          <CardDescription>Review and approve the property listing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">Title</h3>
            <p>{title}</p>
          </div>
          <div>
            <h3 className="font-semibold">Description</h3>
            <p>{description}</p>
          </div>
          <div>
            <h3 className="font-semibold">Location</h3>
            <p>{location}</p>
          </div>
          <div>
            <h3 className="font-semibold">Price</h3>
            <p>{price} ETH</p>
          </div>
          {imageUrl && (
            <div>
              <h3 className="font-semibold">Image</h3>
              <img src={imageUrl} alt={title} className="mt-2 max-w-md rounded-lg" />
            </div>
          )}
        </CardContent>
        <CardFooter className="space-x-2">
          <Button 
            onClick={handleApprove}
            disabled={isApproving}
          >
            {isApproving ? 'Approving...' : 'Approve Property'}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/property/list')}
          >
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
