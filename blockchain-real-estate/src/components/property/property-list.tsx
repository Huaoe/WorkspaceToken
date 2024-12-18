'use client';

import { useEffect, useState } from 'react';
import { useAccount, useContractRead, usePublicClient } from 'wagmi';
import { Address } from 'viem';
import propertyFactoryABI from '@contracts/abis/PropertyFactory.json';
import { PropertyCard } from './property-card';

const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS as Address;

export function PropertyList() {
  const [properties, setProperties] = useState<any[]>([]);
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();

  // Read property count from the contract
  const { data: propertyCount } = useContractRead({
    address: contractAddress,
    abi: propertyFactoryABI,
    functionName: 'getPropertyCount',
  });

  useEffect(() => {
    const fetchProperties = async () => {
      if (!propertyCount || !publicClient) return;

      const count = Number(propertyCount);
      const propertyPromises = [];

      for (let i = 0; i < count; i++) {
        propertyPromises.push(
          publicClient.readContract({
            address: contractAddress,
            abi: propertyFactoryABI,
            functionName: 'properties',
            args: [i],
          })
        );
      }

      try {
        const propertyAddresses = await Promise.all(propertyPromises);
        setProperties(propertyAddresses);
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    };

    fetchProperties();
  }, [propertyCount, publicClient]);

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your wallet to view properties
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((propertyAddress, index) => (
        <PropertyCard key={index} tokenAddress={propertyAddress} />
      ))}
      {properties.length === 0 && (
        <div className="col-span-full text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">
            No properties available at the moment
          </p>
        </div>
      )}
    </div>
  );
}
