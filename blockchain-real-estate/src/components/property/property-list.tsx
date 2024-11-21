'use client';

import { useEffect, useState } from 'react';
import { useAccount, usePublicClient, useNetwork, useSwitchNetwork } from 'wagmi';
import { PropertyCard } from './property-card';
import { Property } from '@/types/property';
import { propertyFactoryABI } from '@/contracts/abis/propertyFactoryABI';
import { propertyTokenABI } from '@/contracts/abis/propertyTokenABI';
import { Address, formatEther } from 'viem';
import { hardhatChain } from '@/app/providers';

interface PropertyToken {
  tokenAddress: string;
  isApproved: boolean;
}

export function PropertyList() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();

  const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as Address;

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

        if (!isConnected || !address) {
          setError('Please connect your wallet');
          return;
        }

        console.log('Chain:', chain);
        console.log('Connected address:', address);
        console.log('Contract address:', contractAddress);

        // Check if contract exists
        const code = await publicClient.getBytecode({ address: contractAddress });
        console.log('Contract exists:', code !== undefined && code !== '0x');
        
        if (code === undefined || code === '0x') {
          console.error('❌ No contract code found at the specified address');
          return;
        }

        // Get user's property tokens
        const data = await publicClient.readContract({
          address: contractAddress,
          abi: propertyFactoryABI,
          functionName: 'getUserProperties',
          args: [address],
        }) as PropertyToken[];

        console.log('Raw properties data:', data);

        if (!data || data.length === 0) {
          console.log('No properties found');
          setProperties([]);
          return;
        }

        // Fetch details for each property token
        const propertyPromises = data.map(async (token) => {
          try {
            console.log('Fetching details for token:', token.tokenAddress);
            
            const [details, owner] = await Promise.all([
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
              name: title,
              description,
              location,
              price: formatEther(price),
              imageUrl,
              owner: owner as string,
              isApproved: token.isApproved,
              isSold: false, // We'll add this to the contract later
            };
          } catch (err) {
            console.error('Error fetching property details:', err, token.tokenAddress);
            return null;
          }
        });

        const propertyDetails = await Promise.all(propertyPromises);
        const validProperties = propertyDetails.filter((p): p is Property => p !== null);
        
        console.log('Formatted properties:', validProperties);
        setProperties(validProperties);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Error fetching properties. Check console for details.');
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, [address, isConnected, publicClient, contractAddress, chain, switchNetwork]);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
        <p className="text-gray-600">Please connect your wallet to view your properties</p>
      </div>
    );
  }

  if (chain?.unsupported) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4 text-red-600">Wrong Network</h2>
        <p className="text-gray-600">Please switch to {hardhatChain.name} (Chain ID: {hardhatChain.id})</p>
        <p className="text-sm text-gray-500 mt-4">
          Network Details:
          <br />
          Network Name: {hardhatChain.name}
          <br />
          RPC URL: {hardhatChain.rpcUrls.default.http[0]}
          <br />
          Chain ID: {hardhatChain.id}
          <br />
          Currency Symbol: {hardhatChain.nativeCurrency.symbol}
        </p>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  if (loading) {
    return <div className="text-center p-4">Loading properties...</div>;
  }

  if (properties.length === 0) {
    return <div className="text-center p-4">No properties found</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
