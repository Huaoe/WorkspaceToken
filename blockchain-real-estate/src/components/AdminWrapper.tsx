'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useWalletEvents } from '@/app/wallet-events-provider';
import { getPropertyFactoryContract } from '@/lib/ethereum';

export function AdminWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

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
function AdminCheck({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useWalletEvents();
  const router = useRouter();
  const [owner, setOwner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkOwner() {
      if (!isConnected || !address) {
        router.push('/');
        return;
      }

      try {
        setLoading(true);
        const contract = await getPropertyFactoryContract();
        const ownerAddress = await contract.owner();
        setOwner(ownerAddress);

        if (ownerAddress && address.toLowerCase() !== ownerAddress.toLowerCase()) {
          router.push('/');
        }
      } catch (error) {
        console.error('Error checking owner:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    }

    checkOwner();
  }, [address, isConnected, router]);

  if (loading) return null;
  if (!isConnected || !owner || address.toLowerCase() !== owner.toLowerCase()) return null;

  return <>{children}</>;
}