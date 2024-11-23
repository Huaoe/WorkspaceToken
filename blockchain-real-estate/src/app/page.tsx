'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAccount, useContractRead } from 'wagmi';
import { propertyFactoryABI } from '@/contracts/abis/propertyFactoryABI';
import { useEffect, useState } from 'react';
import { Building2, List, ShieldCheck } from "lucide-react";

const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as `0x${string}`;

export default function Home() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  const { data: owner } = useContractRead({
    address: contractAddress,
    abi: propertyFactoryABI,
    functionName: 'owner',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isAdmin = isConnected && address === owner;

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 pt-20 pb-32">
        <div className="text-center space-y-6 mb-20">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Blockchain Real Estate Marketplace
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover and invest in tokenized real estate properties with blockchain technology
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 max-w-6xl mx-auto">
          <Link href="/property/submit" className="group w-full max-w-md">
            <div className="relative h-full overflow-hidden rounded-xl border bg-background p-6 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Building2 className="h-8 w-8 text-primary" />
                <h2 className="text-2xl font-semibold">Submit Property</h2>
              </div>
              <p className="text-center text-muted-foreground">
                List your property on our blockchain marketplace and reach global investors.
              </p>
              <span className="absolute bottom-4 right-4 text-primary transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>

          <Link href="/property/list" className="group w-full max-w-md">
            <div className="relative h-full overflow-hidden rounded-xl border bg-background p-6 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center justify-center gap-4 mb-4">
                <List className="h-8 w-8 text-primary" />
                <h2 className="text-2xl font-semibold">View Properties</h2>
              </div>
              <p className="text-center text-muted-foreground">
                Explore our curated collection of tokenized real estate properties.
              </p>
              <span className="absolute bottom-4 right-4 text-primary transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>

          {isAdmin && (
            <Link href="/admin/requests" className="group w-full max-w-md">
              <div className="relative h-full overflow-hidden rounded-xl border bg-background p-6 transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                  <h2 className="text-2xl font-semibold">Admin Panel</h2>
                </div>
                <p className="text-center text-muted-foreground">
                  Manage property listings and review verification requests.
                </p>
                <span className="absolute bottom-4 right-4 text-primary transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
