'use client';

import { useEffect } from 'react';
import { useAccount, useDisconnect, useConfig } from 'wagmi';
import { useToast } from '@/components/ui/use-toast';

declare global {
  interface Window {
    ethereum?: {
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export function useWalletEvents() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const config = useConfig();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum?.isMetaMask) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        disconnect();
        toast({
          title: 'Wallet Disconnected',
          description: 'Your wallet has been disconnected.',
          variant: 'destructive',
        });
      } else if (accounts[0] !== address && isConnected) {
        // Account changed
        toast({
          title: 'Account Changed',
          description: `Switched to account: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      }
    };

    const handleChainChanged = (chainId: string) => {
      const newChainId = parseInt(chainId);
      const supportedChains = config.chains.map(chain => chain.id);
      
      if (!supportedChains.includes(newChainId)) {
        toast({
          title: 'Network Not Supported',
          description: 'Please switch to a supported network.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Network Changed',
        description: `Switched to ${config.chains.find(chain => chain.id === newChainId)?.name || 'new network'}`,
      });
      
      // Refresh the page to ensure all state is updated correctly
      window.location.reload();
    };

    // Add event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Cleanup function
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [address, isConnected, disconnect, config.chains, toast]);
}
