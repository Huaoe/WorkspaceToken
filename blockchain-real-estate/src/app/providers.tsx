'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { Toaster } from '@/components/ui/toaster';
import '@rainbow-me/rainbowkit/styles.css';
import { WalletEventsProvider } from './wallet-events-provider';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { useState, useEffect, useCallback } from 'react';

console.log('[Providers] Starting to initialize providers');

export function Providers({ children }: { children: React.ReactNode }) {
  console.log('[Providers] Rendering Providers component');
  
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(() => {
    console.log('[Providers] Creating QueryClient');
    return new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: 1,
          staleTime: 5000,
        },
      },
    });
  });

  const initializeProviders = useCallback(async () => {
    console.log('[Providers] Initializing providers');
    try {
      // Ensure window is defined
      if (typeof window !== 'undefined') {
        // Initialize any required provider state here
        await Promise.resolve(); // Simulating any async initialization
        console.log('[Providers] Providers initialized successfully');
        setMounted(true);
      }
    } catch (error) {
      console.error('[Providers] Error initializing providers:', error);
      // You might want to show an error state here
    }
  }, []);

  useEffect(() => {
    console.log('[Providers] Running mount effect');
    initializeProviders();
    
    return () => {
      console.log('[Providers] Cleaning up providers');
      queryClient.clear();
    };
  }, [initializeProviders, queryClient]);

  // Return early loading state for SSR
  if (typeof window === 'undefined') {
    console.log('[Providers] SSR detected, returning minimal providers');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Return loading state while initializing on client
  if (!mounted) {
    console.log('[Providers] Not mounted yet, returning loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="text-center text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  console.log('[Providers] Mounted, rendering providers tree');
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={config.chains}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <WalletEventsProvider>
              {children}
              <Toaster />
            </WalletEventsProvider>
          </ThemeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
