'use client';

import Link from 'next/link';
import { CustomConnectButton } from '@/components/connect-button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAccount, useReadContract } from 'wagmi';
import { useState, useEffect } from 'react';
import propertyFactoryABI from '@contracts/abis/PropertyFactory.json';
import { ThemeToggle } from '@/components/theme/theme-toggle';

const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS as `0x${string}`;

export function Navbar() {
  const pathname = usePathname();
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Read admin address from contract
  const { data: contractAdmin } = useReadContract({
    address: contractAddress,
    abi: propertyFactoryABI.abi,
    functionName: 'admin',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if connected address is admin
  useEffect(() => {
    if (address && contractAdmin) {
      setIsAdmin(address.toLowerCase() === contractAdmin.toLowerCase());
    } else {
      setIsAdmin(false);
    }
  }, [address, contractAdmin]);

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
              Work Space Token
            </Link>
            <Link
              href="/property/list"
              className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
            >
              Properties
            </Link>
            {isAdmin && (
              <Link
                href="/property/request"
                className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground"
              >
                Submit Property
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

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/" ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Work Space Token
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/property/list"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === "/property/list" ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Properties
              </Link>
              <Link
                href="/how-it-works"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === "/how-it-works" ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Comment ça marche ?
              </Link>
              {isAdmin && (
                <>
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
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <CustomConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
