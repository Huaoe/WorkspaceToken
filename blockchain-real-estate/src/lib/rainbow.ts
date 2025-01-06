import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'viem/chains';
import { http } from 'wagmi';
import { createPublicClient, http as viemHttp } from 'viem';

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';
const alchemyId = process.env.NEXT_PUBLIC_ALCHEMY_ID || '';

// Configure Sepolia with Alchemy RPC
const sepoliaChain = {
  ...sepolia,
  rpcUrls: {
    ...sepolia.rpcUrls,
    default: {
      http: [`https://eth-sepolia.g.alchemy.com/v2/${alchemyId}`],
    },
    public: {
      http: [`https://eth-sepolia.g.alchemy.com/v2/${alchemyId}`],
    },
  },
};

// Use Sepolia in production, Hardhat in development
const isDevelopment = process.env.NODE_ENV === 'development';
const chains = isDevelopment ? [sepoliaChain] : [sepoliaChain];

// Create a public client for read operations
export const publicClient = createPublicClient({
  chain: sepoliaChain,
  transport: viemHttp(`https://eth-sepolia.g.alchemy.com/v2/${alchemyId}`),
});

export const config = getDefaultConfig({
  appName: 'Blockchain Real Estate',
  projectId,
  chains,
  transports: {
    [sepoliaChain.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${alchemyId}`),
  },
  ssr: true,
});

export { chains };
