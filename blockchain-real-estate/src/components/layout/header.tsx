'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Real Estate NFT
        </Link>
        
        <nav className="flex items-center gap-4">
          <Link href="/property/submit">
            <Button variant="outline">Submit Property</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
          <ConnectButton />
        </nav>
      </div>
    </header>
  );
}
