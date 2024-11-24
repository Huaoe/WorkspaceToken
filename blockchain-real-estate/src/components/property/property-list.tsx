'use client';

import { useEffect, useState } from 'react';
import { useAccount, usePublicClient, useNetwork, useSwitchNetwork, useContractRead } from 'wagmi';
import { PropertyCard } from './property-card';
import { PropertyRequest } from '@/types/property';
import { propertyFactoryABI } from '@contracts/abis/propertyFactoryABI';
import { propertyTokenABI } from '@contracts/abis/propertyTokenABI';
import { Address, formatEther } from 'viem';
import { hardhatChain } from '@/app/providers';

interface PropertyToken {
  tokenAddress: string;
  isApproved: boolean;
}

export function PropertyList() {
  const [properties, setProperties] = useState<PropertyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();

  const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as Address;

  // Read owner from the contract
  const { data: owner } = useContractRead({
    address: contractAddress,
    abi: propertyFactoryABI,
    functionName: 'owner',
  });

  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        setError(null);

        // Check if we're on the right network
        if (chain?.id !== hardhatChain.id) {
          console.log('Wrong network detected:', chain);
          setError(`Please switch to ${hardhatChain.name} (Chain ID: ${hardhatChain.id})`);
          if (switchNetwork) {
            switchNetwork(hardhatChain.id);
          }
          return;
        }

        // Check if contract exists
        const code = await publicClient.getBytecode({ address: contractAddress });
        if (code === undefined || code === '0x') {
          console.error('❌ No contract code found at the specified address');
          return;
        }

        if (!owner) {
          console.error('❌ Could not fetch factory owner');
          return;
        }

        // Get owner's property tokens
        const data = await publicClient.readContract({
          address: contractAddress,
          abi: propertyFactoryABI,
          functionName: 'getUserProperties',
          args: [owner as Address],
        }) as PropertyToken[];

        if (!data || data.length === 0) {
          console.log('No properties found');
          setProperties([]);
          return;
        }

        // Fetch details for each property token
        const propertyPromises = data.map(async (token) => {
          try {
            const [details, tokenOwner] = await Promise.all([
              publicClient.readContract({
                address: token.tokenAddress as Address,
                abi: propertyTokenABI,
                functionName: 'getPropertyDetails',
              }),
              publicClient.readContract({
                address: token.tokenAddress as Address,
                abi: propertyTokenABI,
                functionName: 'owner',
              }),
            ]);

            const [title, description, location, imageUrl, price] = details as [string, string, string, string, bigint];

            return {
              id: token.tokenAddress,
              property_type: title,
              description,
              location,
              imageUrl,
              price: formatEther(price),
              owner_address: tokenOwner as string,
              status: token.isApproved ? 'approved' as const : 'pending' as const,
              area: 0, // Default value since it's not in the contract
              latitude: 0, // Default value since it's not in the contract
              longitude: 0, // Default value since it's not in the contract
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          } catch (err) {
            console.error('Error fetching property details:', err);
            return null;
          }
        });

        const fetchedProperties = (await Promise.all(propertyPromises))
          .filter((property): property is PropertyRequest => property !== null);

        console.log('Fetched properties:', fetchedProperties);
        setProperties(fetchedProperties);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch properties');
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [chain, contractAddress, owner, publicClient, switchNetwork]);

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  if (loading) {
    return <div className="text-center p-4">Loading properties...</div>;
  }

  if (properties.length === 0) {
    return <div className="text-center p-4">No properties available</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <PropertyCard 
          key={property.id} 
          property={property}
          showAdminControls={false}
        />
      ))}
    </div>
  );
}
