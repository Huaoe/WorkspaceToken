import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { CustomConnectButton } from '@/components/connect-button';
import Link from 'next/link';
import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Blockchain Real Estate',
  description: 'A decentralized platform for tokenizing and trading real estate assets',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow">
              <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                  <Link 
                    href="/" 
                    className="text-xl font-bold tracking-tight text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    Blockchain Real Estate
                  </Link>
                  <CustomConnectButton />
                </div>
              </div>
            </header>
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
