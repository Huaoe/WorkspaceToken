import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <nav className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Blockchain Real Estate</h1>
        <ConnectButton />
      </nav>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link 
          href="/property/submit"
          className="p-6 border rounded-lg hover:border-blue-500 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Submit Property</h2>
          <p className="text-gray-600">List your real estate property for tokenization</p>
        </Link>
        
        <Link 
          href="/property/list"
          className="p-6 border rounded-lg hover:border-blue-500 transition-colors"
        >
          <h2 className="text-xl font-semibold mb-2">Browse Properties</h2>
          <p className="text-gray-600">Explore and invest in tokenized properties</p>
        </Link>
      </div>
    </main>
  );
}
