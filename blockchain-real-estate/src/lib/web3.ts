import { ethers } from 'ethers';

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
    default: 'http://127.0.0.1:8545',
    public: 'http://127.0.0.1:8545',
  },
  blockExplorer: 'http://127.0.0.1:8545',
  testnet: true,
};

// Create a provider instance
export const getProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return new ethers.JsonRpcProvider(hardhatChain.rpcUrls.default);
};

// Get a signer instance
export const getSigner = async () => {
  const provider = getProvider();
  if (provider instanceof ethers.BrowserProvider) {
    return provider.getSigner();
  }
  throw new Error('No signer available');
};

// Contract factory functions
import propertyFactoryABI from '@contracts/abis/PropertyFactoryProxy.json';
import propertyTokenABI from '@contracts/abis/PropertyToken.json';

export const getPropertyFactoryContract = () => {
  const provider = getProvider();
  const address = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS;
  if (!address) throw new Error('Property factory address not found');
  return new ethers.Contract(address, propertyFactoryABI.abi, provider);
};

export const getPropertyTokenContract = (address: string) => {
  const provider = getProvider();
  return new ethers.Contract(address, propertyTokenABI.abi, provider);
};
