'use client';

import Link from 'next/link';
import { CustomConnectButton } from '@/components/connect-button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAccount } from 'wagmi';

export function Navbar() {
  const pathname = usePathname();
  const { address } = useAccount();

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
