'use client';

import { createContext, useContext, useState } from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

interface WalletEventsContextType {
  address: string | null;
  isConnected: boolean;
  connect: () => void;
  loading: boolean;
}

const WalletEventsContext = createContext<WalletEventsContextType>({
  address: null,
  isConnected: false,
  connect: () => {},
  loading: false,
});

export function WalletEventsProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [loading, setLoading] = useState(false);

  const connect = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  return (
    <WalletEventsContext.Provider
      value={{
        address: address || null,
        isConnected: !!isConnected,
        connect,
        loading,
      }}
    >
      {children}
    </WalletEventsContext.Provider>
  );
}

export const useWalletEvents = () => useContext(WalletEventsContext);