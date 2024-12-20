'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWalletEvents } from '@/app/wallet-events-provider';

export function CustomConnectButton() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected, connect } = useWalletEvents();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!isConnected) {
    return (
      <Button onClick={connect}>
        Connect Wallet
      </Button>
    );
  }

  return (
    <Button variant="outline">
      {address?.slice(0, 6)}...{address?.slice(-4)}
    </Button>
  );
}
