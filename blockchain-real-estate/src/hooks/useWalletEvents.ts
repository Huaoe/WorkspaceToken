'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

export function useWalletEvents() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const { toast } = useToast();

  const connect = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast({
        title: 'Wallet Not Found',
        description: 'Please install MetaMask or another Web3 wallet.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const newSigner = await provider.getSigner();
      const network = await provider.getNetwork();

      setAddress(accounts[0]);
      setIsConnected(true);
      setSigner(newSigner);
      setChainId(Number(network.chainId));

      toast({
        title: 'Wallet Connected',
        description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect wallet.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setIsConnected(false);
    setSigner(null);
    setChainId(null);
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected.',
    });
  }, [toast]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum?.isMetaMask) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== address && isConnected) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const newSigner = await provider.getSigner();
        setAddress(accounts[0]);
        setSigner(newSigner);
        toast({
          title: 'Account Changed',
          description: `Switched to account: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });
      }
    };

    const handleChainChanged = async (chainId: string) => {
      const newChainId = parseInt(chainId);
      setChainId(newChainId);
      
      // Update signer with new chain
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const newSigner = await provider.getSigner();
        setSigner(newSigner);
      }

      toast({
        title: 'Network Changed',
        description: `Switched to chain ID: ${newChainId}`,
      });
    };

    // Add event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Initial connection check
    if (window.ethereum.selectedAddress) {
      connect();
    }

    // Cleanup function
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [address, isConnected, disconnect, connect, toast]);

  return {
    address,
    isConnected,
    signer,
    chainId,
    connect,
    disconnect,
  };
}
