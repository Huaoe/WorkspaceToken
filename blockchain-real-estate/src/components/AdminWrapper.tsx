'use client';

import { useAccount, useContractRead } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import propertyFactoryABI from '@contracts/abis/PropertyFactory.json';

const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as `0x${string}`;

export function AdminWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Move Wagmi hooks inside useEffect to ensure they're only called after mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen relative">
      <AdminCheck>
        <div className="fixed inset-0 border-2 border-red-500/50 pointer-events-none z-50 shadow-[0_0_15px_rgba(239,68,68,0.2)]" />
        {children}
      </AdminCheck>
    </div>
  );
}

// Separate component for Wagmi hooks
function AdminCheck({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const { data: owner } = useContractRead({
    address: contractAddress,
    abi: propertyFactoryABI.abi,
    functionName: 'owner',
  });

  useEffect(() => {
    if (!isConnected || !address) {
      router.push('/');
      return;
    }

    if (owner && address !== owner) {
      router.push('/');
      return;
    }
  }, [address, isConnected, owner, router]);

  if (!isConnected || address !== owner) return null;

  return <>{children}</>;
}