'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getPropertyFactoryContract } from '@/lib/ethereum';
import { useWalletEvents } from '@/app/wallet-events-provider';

export function AdminCheck({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useWalletEvents();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!isConnected || !address) {
        setIsAdmin(false);
        setLoading(false);
        router.push('/');
        return;
      }

      try {
        const contract = await getPropertyFactoryContract();
        const owner = await contract.owner();
        
        if (address.toLowerCase() !== owner.toLowerCase()) {
          router.push('/');
          setIsAdmin(false);
        } else {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [address, isConnected, router]);

  if (loading) {
    return null;
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}