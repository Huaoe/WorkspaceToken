'use client';

import Link from 'next/link';
import { CustomConnectButton } from '@/components/connect-button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <nav className="border-b">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center space-x-4 lg:space-x-6">
            <Link
              href="/"
              className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
            >
              Home
            </Link>
            <Link
              href="/property/request"
              className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
            >
              Submit Property
            </Link>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <CustomConnectButton />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="border-b">
      <div className="container flex h-16 items-center px-4">
        <div className="flex items-center space-x-4 lg:space-x-6">
          <Link
            href="/"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/" ? "text-foreground" : "text-muted-foreground"
            )}
          >
            Home
          </Link>
          <Link
            href="/property/request"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/property/request"
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            Submit Property
          </Link>
          {address && (
            <Link
              href="/admin/requests"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname.startsWith("/admin")
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              Admin
            </Link>
          )}
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <CustomConnectButton />
        </div>
      </div>
    </nav>
  );
}
