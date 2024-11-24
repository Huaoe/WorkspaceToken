'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/lib/wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { Toaster } from '@/components/ui/toaster';
import '@rainbow-me/rainbowkit/styles.css';
import { WalletEventsProvider } from './wallet-events-provider';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <WalletEventsProvider>
            {children}
            <Toaster />
          </WalletEventsProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
