import { http, createConfig, Chain } from 'wagmi';
import { hardhat } from 'viem/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error('Missing NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID');
}

// Define Hardhat chain with explicit RPC URL
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
    default: {
      http: ['http://localhost:8545'],
    },
    public: {
      http: ['http://localhost:8545'],
    },
  },
};

// Configure HTTP transport with retries and timeout
const transport = http({
  batch: false, // Disable batching to avoid URL object issues
  retryCount: 3,
  timeout: 30_000,
  fetchOptions: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

// Create wagmi config with improved settings
export const config = getDefaultConfig({
  appName: 'Blockchain Real Estate',
  projectId,
  chains: [hardhatChain],
  transports: {
    [hardhatChain.id]: transport,
  },
  ssr: true,
  syncConnectedChain: true,
  pollingInterval: 4_000,
});
