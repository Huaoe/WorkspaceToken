"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import propertyFactoryABI from "@contracts/abis/PropertyFactory.json";
import { useEffect, useState } from "react";
import { Building2, List, ShieldCheck, UserCheck } from "lucide-react";
import Image from "next/image";

const contractAddress = process.env
  .NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as `0x${string}`;

export default function Home() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const publicClient = usePublicClient();

  const { data: owner, isError: ownerError } = useReadContract({
    address: contractAddress,
    abi: propertyFactoryABI.abi,
    functionName: "owner",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      console.log("Contract Debug:", {
        contractAddress,
        owner,
        ownerError,
        address,
        isConnected,
      });

      if (contractAddress && publicClient) {
        publicClient
          .readContract({
            address: contractAddress,
            abi: propertyFactoryABI.abi,
            functionName: "owner",
          })
          .then((result) => {
            console.log("Direct contract read result:", result);
          })
          .catch((error) => {
            console.error("Contract read error:", error);
          });
      }
    }
  }, [
    mounted,
    address,
    owner,
    isConnected,
    contractAddress,
    publicClient,
    ownerError,
  ]);

  if (!mounted) return null;

  const isAdmin =
    isConnected && address?.toLowerCase() === owner?.toLowerCase();

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      {/* Logo and Title Section */}
      <div className="text-center mb-12">
        <div className="relative w-96 h-96 mx-auto mb-8">
          <Image
            src="/images/OIG4.jpeg"
            alt="Work Space Token Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-4xl font-bold mb-4">Work Space Token</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Revolutionizing real estate investment through blockchain technology.
          Invest in premium properties with fractional ownership and earn yields
          through secure token-based transactions.
        </p>
      </div>

      {/* Property Carousel */}
      <div className="w-full max-w-5xl mb-12">
        <h2 className="text-2xl font-semibold mb-6">Featured Properties</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Example Property Cards */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden">
              <div className="relative aspect-video">
                <Image
                  src={`/images/testimonials/${i}Test.jpg`}
                  alt={`Featured Property ${i}`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-2">
                  Premium Office Space {i}
                </h2>
                <p className="text-muted-foreground">
                  Modern workspace in prime location. High yield potential with
                  proven track record.
                </p>
              </div>
              <div className="p-6 border-t">
                <p className="font-semibold">Expected Yield: 8-12% APY</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-6 max-w-6xl mx-auto">
        <Link href="/property/list" className="group w-full max-w-md">
          <div className="relative h-full overflow-hidden rounded-xl border bg-background p-6 transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="flex items-center justify-center gap-4 mb-4">
              <List className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-semibold">View Properties</h2>
            </div>
            <p className="text-center text-muted-foreground">
              Explore our curated collection of tokenized real estate
              properties.
            </p>
            <span className="absolute bottom-4 right-4 text-primary transition-transform group-hover:translate-x-1">
              →

            </span>
          </div>
        </Link>

        {!isAdmin && isConnected && (
          <Link href="/kyc" className="group w-full max-w-md">
            <div className="relative h-full overflow-hidden rounded-xl border bg-background p-6 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center justify-center gap-4 mb-4">
                <UserCheck className="h-8 w-8 text-primary" />
                <h2 className="text-2xl font-semibold">Complete KYC</h2>
              </div>
              <p className="text-center text-muted-foreground">
                Complete your KYC verification to start investing in properties.
                Get verified in minutes.
              </p>
              <span className="absolute bottom-4 right-4 text-primary transition-transform group-hover:translate-x-1">
                →

              </span>
            </div>
          </Link>
        )}
        {isAdmin && (
          <Link href="/property/submit" className="group w-full max-w-md">
            <div className="relative h-full overflow-hidden rounded-xl border bg-background p-6 transition-all hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center justify-center gap-4 mb-4">
                <Building2 className="h-8 w-8 text-primary" />
                <h2 className="text-2xl font-semibold">Submit Property</h2>
              </div>
              <p className="text-center text-muted-foreground">
                List your property on our blockchain marketplace and reach
                global investors.
              </p>
              <span className="absolute bottom-4 right-4 text-primary transition-transform group-hover:translate-x-1">
                →

              </span>
            </div>
          </Link>
        )}
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
    </main>
  );
}
