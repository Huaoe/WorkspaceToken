import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, fallback } from 'wagmi';
import { hardhat } from 'wagmi/chains';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
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

// Create providers with different polling intervals
const providers = [
  jsonRpcProvider({
    rpc: () => ({
      http: 'http://127.0.0.1:8545',
    }),
    static: true,
    pollingInterval: 1000,
  }),
  jsonRpcProvider({
    rpc: () => ({
      http: 'http://127.0.0.1:8545',
    }),
    static: true,
    pollingInterval: 4000,
  })
];

const { chains, publicClient } = configureChains(
  [hardhatChain],
  providers
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
