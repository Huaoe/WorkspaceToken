import { http, createConfig, Chain } from 'wagmi';
import { hardhat } from 'viem/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
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

export const config = getDefaultConfig({
  appName: 'Blockchain Real Estate',
  projectId,
  chains: [hardhatChain],
  transports: {
    [hardhatChain.id]: http(),
  },
  ssr: true // Enable server-side rendering support
});
