import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia, hardhat } from 'viem/chains';
import { http } from 'wagmi';
import { createPublicClient, http as viemHttp } from 'viem';

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';

// Use Hardhat's local network
const localHardhat = {
  ...hardhat,
  id: 31337,
  name: 'Hardhat Local',
  network: 'hardhat',
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
};

const chains = [localHardhat];

// Create a public client for read operations
export const publicClient = createPublicClient({
  chain: localHardhat,
  transport: viemHttp('http://127.0.0.1:8545'),
});

export const config = getDefaultConfig({
  appName: 'Blockchain Real Estate',
  projectId,
  chains,
  transports: {
    [localHardhat.id]: http('http://127.0.0.1:8545'),
  },
  ssr: true,
});

export { chains };
