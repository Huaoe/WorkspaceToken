import { http, createConfig } from 'wagmi';
import { hardhat } from 'viem/chains';

if (!process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID) {
  throw new Error('Missing NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID');
}

export const config = createConfig({
  chains: [hardhat],
  transports: {
    [hardhat.id]: http(),
  },
});
