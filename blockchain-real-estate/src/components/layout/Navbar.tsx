'use client';

import Link from 'next/link';
import { CustomConnectButton } from '@/components/connect-button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useWalletEvents } from '@/app/wallet-events-provider';
import { getPropertyFactoryContract } from '@/lib/ethereum';
import { ThemeToggle } from '@/components/theme/theme-toggle';

const Navbar = () => {
  const pathname = usePathname();
  const { address, isConnected } = useWalletEvents();
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [contractOwner, setContractOwner] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get contract owner using ethers.js
  useEffect(() => {
    async function getContractOwner() {
      if (!mounted || !isConnected) return;
      
      try {
        const contract = await getPropertyFactoryContract();
        const owner = await contract.owner();
        setContractOwner(owner);
      } catch (error) {
        console.error('Error getting contract owner:', error);
        setContractOwner(null);
      }
    }

    getContractOwner();
  }, [mounted, isConnected]);

  // Check if connected address is admin
  useEffect(() => {
    if (!mounted || !isConnected) {
      setIsAdmin(false);
      return;
    }

    if (address && contractOwner) {
      setIsAdmin(address.toLowerCase() === contractOwner.toLowerCase());
    } else {
      setIsAdmin(false);
    }
  }, [address, contractOwner, mounted, isConnected]);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
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
              {isConnected && (
                <Link
                  href="/dashboard"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/dashboard" ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  Dashboard
                </Link>
              )}
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
};

export default Navbar;
