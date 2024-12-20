import { http, createConfig, Chain } from 'wagmi';
import { hardhat } from 'viem/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

console.log('[Wagmi] Initializing wagmi configuration');

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
  console.error('[Wagmi] Missing NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID');
  throw new Error('Missing NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID');
}

// Define our own Hardhat chain to ensure correct chain ID
const hardhatChain: Chain = {
  ...hardhat,
  id: 31337,
  name: 'Hardhat',
  network: 'hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
};

console.log('[Wagmi] Creating wagmi config with chain:', hardhatChain.name);

export const config = getDefaultConfig({
  appName: 'Blockchain Real Estate',
  projectId,
  chains: [hardhatChain],
  transports: {
    [hardhatChain.id]: http({
      retryCount: 2,
      timeout: 10_000,
    }),
  },
  ssr: true, // Enable server-side rendering support
  syncConnectedChain: true, // Keep chain in sync
  pollingInterval: 4_000, // 4 seconds
  batch: {
    multicall: true,
  },
});

console.log('[Wagmi] Wagmi configuration initialized');
