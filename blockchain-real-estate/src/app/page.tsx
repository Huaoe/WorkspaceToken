'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PropertyList } from '@/components/property/property-list';
import { useWalletEvents } from './wallet-events-provider';
import { getWhitelistContract } from '@/lib/ethereum';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PROPERTY_FACTORY_ADDRESS } from "@/lib/contracts";
import { Building2, List, ShieldCheck, UserCheck, Coins, Lock, TrendingUp } from "lucide-react";
import Image from "next/image";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/components/ui/use-toast";

export default function Home() {
  const { address, isConnected } = useWalletEvents();
  const [isKYCVerified, setIsKYCVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkKYCStatus = async () => {
      if (!isConnected || !address) {
        setIsKYCVerified(false);
        setLoading(false);
        return;
      }

      try {
        const contract = await getWhitelistContract();
        const isVerified = await contract.isWhitelisted(address);
        setIsKYCVerified(isVerified);
      } catch (error) {
        console.error('Error checking KYC status:', error);
        setIsKYCVerified(false);
      } finally {
        setLoading(false);
      }
    };

    checkKYCStatus();
  }, [address, isConnected]);

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!mounted) return null;

  const isAdmin =
    isConnected && address?.toLowerCase() === PROPERTY_FACTORY_ADDRESS?.toLowerCase();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyan-400 via-[#93d2d9] to-blue-500 text-white p-8 md:p-16 rounded-2xl shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute w-72 h-72 rounded-full bg-white/30 -top-12 -right-12 animate-blob"></div>
          <div className="absolute w-72 h-72 rounded-full bg-white/30 -bottom-12 -left-12 animate-blob animation-delay-2000"></div>
          <div className="absolute w-72 h-72 rounded-full bg-white/30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-shrink-0 order-2 md:order-1 transform hover:scale-110 transition-transform duration-300">
            <Image
              src="/images/OIG4.jpeg"
              alt="Work Space Token Logo"
              width={200}
              height={200}
              className="object-contain rounded-2xl shadow-xl"
            />
          </div>
          <div className="max-w-3xl order-1 md:order-2">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100 animate-gradient">
              L&apos;immobilier de bureaux à portée de clic
            </h1>
            <div className="space-y-4 text-lg md:text-xl">
              <p className="opacity-0 animate-fadeIn animation-delay-500 flex items-center gap-3">
                <span className="inline-block w-2 h-2 bg-white rounded-full"></span>
                Investissez simplement, rapidement et bénéficiez de parts des revenus locatifs.
              </p>
              <p className="opacity-0 animate-fadeIn animation-delay-1000 flex items-center gap-3">
                <span className="inline-block w-2 h-2 bg-white rounded-full"></span>
                Diversifiez votre patrimoine avec une faible mise de départ.
              </p>
              <p className="opacity-0 animate-fadeIn animation-delay-1500 flex items-center gap-3">
                <span className="inline-block w-2 h-2 bg-white rounded-full"></span>
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
            sizes="(max-width: 768px) 100vw, 50vw"
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
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover rounded-lg"
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
              Pourquoi Choisir Work Space Token ?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-lg mb-4">
                <Building2 className="h-6 w-6 text-cyan-600 dark:text-cyan-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Propriétés Premium
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Accédez à des investissements immobiliers commerciaux de haute qualité auparavant réservés aux investisseurs institutionnels.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-lg mb-4">
                <Coins className="h-6 w-6 text-cyan-600 dark:text-cyan-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Investissement Fractionné
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Commencez à investir avec un capital réduit grâce à la propriété fractionnée de biens immobiliers premium.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-lg mb-4">
                <TrendingUp className="h-6 w-6 text-cyan-600 dark:text-cyan-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Rendements Réguliers
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Percevez des revenus locatifs réguliers et bénéficiez de l'appréciation de la valeur des biens.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-lg mb-4">
                <Lock className="h-6 w-6 text-cyan-600 dark:text-cyan-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Sécurisé & Transparent
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                La technologie blockchain garantit une propriété transparente et des transactions sécurisées.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Properties Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Propriétés en Vedette
        </h2>
        {!isConnected ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              Veuillez connecter votre portefeuille pour afficher les propriétés
            </p>
          </div>
        ) : !isKYCVerified ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              Veuillez compléter la vérification KYC pour afficher les propriétés
            </p>
          </div>
        ) : (
          <PropertyList />
        )}
      </div>
    </div>
  );
}
