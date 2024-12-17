"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAccount, useReadContract, usePublicClient } from "wagmi";
import propertyFactoryABI from "@contracts/abis/PropertyFactory.json";
import { useEffect, useState } from "react";
import { Building2, List, ShieldCheck, UserCheck, Coins, Lock, TrendingUp } from "lucide-react";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { PropertyList } from '@/components/property/property-list';

const contractAddress = process.env
  .NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS as `0x${string}`;

export default function Home() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [hasKYC, setHasKYC] = useState(false);
  const publicClient = usePublicClient();
  const supabase = createClientComponentClient();

  const { data: owner, isError: ownerError } = useReadContract({
    address: contractAddress,
    abi: propertyFactoryABI.abi,
    functionName: "owner",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function checkKYCStatus() {
      if (!address) return;
      try {
        const { data } = await supabase
          .from('kyc_submissions')
          .select('*')
          .eq('wallet_address', address)
          .single();
        
        setHasKYC(!!data);
      } catch (error) {
        console.error('Error checking KYC status:', error);
        setHasKYC(false);
      }
    }

    if (mounted && address) {
      checkKYCStatus();
    }
  }, [mounted, address, supabase]);

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
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="bg-[#93d2d9] text-white p-8 md:p-16 rounded-lg">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-shrink-0 order-2 md:order-1">
            <Image
              src="/images/OIG4.jpeg"
              alt="Work Space Token Logo"
              width={200}
              height={200}
              className="object-contain"
            />
          </div>
          <div className="max-w-3xl order-1 md:order-2">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              L&apos;immobilier de bureaux à portée de clic
            </h1>
            <div className="space-y-4 text-lg md:text-xl">
              <p>
                Investissez simplement, rapidement et bénéficiez de parts des revenus locatifs.
              </p>
              <p>
                Diversifiez votre patrimoine avec une faible mise de départ.
              </p>
              <p>
                Votre investissement est sécurisé par la meilleure garantie du marché.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Future of Real Estate Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="relative h-[400px] w-full">
          <Image
            src="/images/about/city-blocks.jpg"
            alt="Future of Real Estate"
            fill
            className="object-cover rounded-lg"
          />
        </div>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Devenez le propriétaire du futur
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Pour la première fois, les investisseurs du monde entier peuvent acheter sur le marché
            immobilier professionnel Français grâce à une propriété entièrement conforme,
            fractionnée et tokenisée. Alimentée par blockchain.
          </p>
        </div>
      </div>

      {/* Investment Benefits Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 order-2 md:order-1">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Investissez dans le futur de l&apos;immobilier professionnel
          </h2>
          <div className="space-y-4">
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Transformez votre argent en propriété : Investissez dans le RWA
              immobilier professionnel et générez des revenus positifs.
            </p>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Diversifiez votre portefeuille avec des biens immobiliers RWA et
              assurez votre sécurité financière.
            </p>
          </div>
        </div>
        <div className="relative h-[400px] w-full order-1 md:order-2">
          <Image
            src="/images/about/modern-building.jpg"
            alt="Modern Commercial Building"
            fill
            className="object-cover rounded-lg"
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Why Choose Work Space Token?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-lg mb-4">
                <Building2 className="h-6 w-6 text-cyan-600 dark:text-cyan-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Premium Properties
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Access high-quality commercial real estate investments previously reserved for institutional investors.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-lg mb-4">
                <Coins className="h-6 w-6 text-cyan-600 dark:text-cyan-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Fractional Investment
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Start investing with lower capital through fractional ownership of premium properties.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-lg mb-4">
                <TrendingUp className="h-6 w-6 text-cyan-600 dark:text-cyan-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Regular Returns
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Earn consistent rental income and benefit from property value appreciation.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-lg mb-4">
                <Lock className="h-6 w-6 text-cyan-600 dark:text-cyan-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Secure & Transparent
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Blockchain technology ensures transparent ownership and secure transactions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Properties Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Featured Properties
        </h2>
        <PropertyList />
      </div>
    </div>
  );
}
