'use client';

import { useAccount, useContractRead } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import propertyFactoryABI from '../../../contracts/abis/PropertyFactory.json';

const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS as `0x${string}`;

export function AdminCheck({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const { data: owner } = useContractRead({
    address: contractAddress,
    abi: propertyFactoryABI.abi,
    functionName: 'owner',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!isConnected || !address) {
      router.push('/');
      return;
    }

    if (owner && address !== owner) {
      router.push('/');
      return;
    }
  }, [address, isConnected, owner, mounted, router]);

  if (!mounted || !isConnected || address !== owner) return null;

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 border-2 border-red-500/50 pointer-events-none z-50 shadow-[0_0_15px_rgba(239,68,68,0.2)]" />
      {children}
    </div>
  );
}