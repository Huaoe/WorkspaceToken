'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAccount, useContractRead } from 'wagmi';
import { propertyFactoryABI } from '@/contracts/abis/propertyFactoryABI';

export default function Home() {
  const { address } = useAccount();
  const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as `0x${string}`;

  const { data: factoryOwner } = useContractRead({
    address: contractAddress,
    abi: propertyFactoryABI,
    functionName: 'owner',
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center space-y-8">
        <h1 className="text-4xl font-bold">Welcome to Blockchain Real Estate</h1>
        <p className="text-xl text-gray-600">Discover and invest in tokenized properties</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link href="/property/list">
            <Button size="lg">
              View Properties
            </Button>
          </Link>
          <Link href="/property/request">
            <Button variant="outline" size="lg">
              Request Property Listing
            </Button>
          </Link>
          {factoryOwner?.toLowerCase() === address?.toLowerCase() && (
            <Link href="/admin/requests">
              <Button variant="secondary" size="lg">
                View Property Requests
              </Button>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
