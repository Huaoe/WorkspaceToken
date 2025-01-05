'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAccount, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

export function CustomConnectButton() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDisconnect = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    disconnect();
  };

  const handleConnect = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (openConnectModal) {
      openConnectModal();
    }
  };

  if (!mounted) return null;

  if (!isConnected) {
    return (
      <Button onClick={handleConnect}>
        Connect Wallet
      </Button>
    );
  }

  return (
    <Button 
      variant="destructive" 
      onClick={handleDisconnect}
      className="hover:bg-red-600 transition-colors"
    >
      {address?.slice(0, 6)}...{address?.slice(-4)}
    </Button>
  );
}
