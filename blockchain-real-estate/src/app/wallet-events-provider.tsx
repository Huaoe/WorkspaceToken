'use client';

import { useWalletEvents } from '@/hooks/useWalletEvents';

export function WalletEventsProvider({ children }: { children: React.ReactNode }) {
  useWalletEvents();
  return <>{children}</>;
}
