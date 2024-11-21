import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig } from 'wagmi';
import { hardhat } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { createPublicClient, http, createWalletClient, custom } from 'viem';

export const hardhatChain = {
  id: 31337,
  name: 'Hardhat',
  network: 'hardhat',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  blockExplorers: {
    default: { name: 'Hardhat', url: 'http://127.0.0.1:8545' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 0,
    },
  },
  testnet: true,
};

const { chains, publicClient } = configureChains(
  [hardhatChain],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: 'Blockchain Real Estate',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
  chains,
});

export const config = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

export const wagmiConfig = createConfig({
  chains: [hardhatChain],
  transports: {
    [hardhatChain.id]: http(),
  },
  ssr: true,
});

export const createPropertyConfig = {
  gas: 12000000n,
  gasPrice: 'auto',
} as const;

// Create a public client for direct contract interactions
export const localClient = createPublicClient({
  chain: hardhatChain,
  transport: http('http://127.0.0.1:8545'),
});
