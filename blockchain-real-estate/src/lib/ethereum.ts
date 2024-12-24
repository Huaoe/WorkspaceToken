'use client';

import { Contract, Signer, ethers, BaseContract, ContractTransaction } from 'ethers';
import { 
  propertyFactoryABI, 
  propertyTokenABI, 
  eurcABI, 
  whitelistABI, 
  stakingFactoryABI, 
  stakingABI, 
  stakingRewardsABI, 
  PropertyToken,
  PROPERTY_FACTORY_ADDRESS,
  WHITELIST_ADDRESS,
  STAKING_FACTORY_ADDRESS,
  EURC_TOKEN_ADDRESS
} from './contracts';

declare global {
  interface Window {
    ethereum?: any;
  }
}

let _provider: ethers.BrowserProvider | null = null;

const initializeProvider = async () => {
  if (!window.ethereum) {
    throw new Error('No ethereum provider found. Please install MetaMask.');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  return provider;
};

export const getProvider = async () => {
  if (typeof window === 'undefined') return null;
  
  try {
    if (!_provider) {
      _provider = await initializeProvider();
    }
    return _provider;
  } catch (error) {
    console.error('Error initializing provider:', error);
    throw error;
  }
};

export const getSigner = async (): Promise<Signer> => {
  const provider = await getProvider();
  if (!provider) throw new Error('No provider available');
  return provider.getSigner();
};

const getContract = async <T extends BaseContract>(address: string, abi: any[], withSigner = false): Promise<T> => {

  try {
    // Get provider
    const provider = await getProvider();
    if (!provider) {
      throw new Error('Failed to initialize provider');
    }

    // Check if contract exists
    const code = await provider.getCode(address);
    if (code === '0x') {
      throw new Error(`No contract found at address ${address}`);
    }

    // Create contract instance with provider first
    const contract = new ethers.Contract(address, abi, provider) as T;

    // Return contract with signer if requested
    if (withSigner) {
      const signer = await provider.getSigner();
      console.log('Using signer:', await signer.getAddress());
      return contract.connect(signer);
    }

    return contract;
  } catch (error) {
    console.error('Error initializing contract:', error);
    throw error;
  }
};

export async function getEURCContract(withSigner = false) {
  const eurcAddress = EURC_TOKEN_ADDRESS;
  if (!eurcAddress) {
    throw new Error('EURC token address not configured');
  }
  console.log('Getting EURC contract at address:', eurcAddress);

  const provider = await getProvider();
  const contract = new ethers.Contract(
    eurcAddress,
    eurcABI,
    provider
  );

  if (withSigner) {
    const signer = await getSigner();
    console.log('Using signer:', await signer.getAddress());
    return contract.connect(signer);
  }

  return contract;
};

export async function getPropertyFactoryContract(withSigner = false) {
  const factoryAddress = PROPERTY_FACTORY_ADDRESS;
  if (!factoryAddress) {
    throw new Error('Property factory address not configured');
  }
  console.log('Getting property factory contract at address:', factoryAddress);

  const provider = await getProvider();
  const contract = new ethers.Contract(
    factoryAddress,
    propertyFactoryABI,
    provider
  );

  if (withSigner) {
    const signer = await getSigner();
    console.log('Using signer:', await signer.getAddress());
    return contract.connect(signer);
  }

  return contract;
};

export async function getPropertyTokenContract(address: string, withSigner = false): Promise<PropertyToken> {
  console.log('Getting property token contract at address:', address);

  const provider = await getProvider();
  const contract = new ethers.Contract(
    address,
    propertyTokenABI,
    provider
  );

  if (withSigner) {
    const signer = await getSigner();
    console.log('Using signer:', await signer.getAddress());
    return contract.connect(signer);
  }

  return contract;
};

export async function getWhitelistContract(withSigner = false) {
  if (!WHITELIST_ADDRESS) {
    throw new Error('Whitelist address not configured');
  }
  console.log('Getting whitelist contract at address:', WHITELIST_ADDRESS);

  const provider = await getProvider();
  const contract = new ethers.Contract(
    WHITELIST_ADDRESS,
    whitelistABI,
    provider
  );

  if (withSigner) {
    const signer = await getSigner();
    console.log('Using signer:', await signer.getAddress());
    return contract.connect(signer);
  }

  return contract;
};

export async function getStakingFactoryContract(withSigner = false) {
  if (!STAKING_FACTORY_ADDRESS) {
    throw new Error('Staking factory address not configured');
  }
  console.log('Getting staking factory contract at address:', STAKING_FACTORY_ADDRESS);

  const provider = await getProvider();
  const contract = new ethers.Contract(
    STAKING_FACTORY_ADDRESS,
    stakingFactoryABI,
    provider
  );

  if (withSigner) {
    const signer = await getSigner();
    console.log('Using signer:', await signer.getAddress());
    return contract.connect(signer);
  }

  return contract;
};

export async function getStakingContract(address: string, withSigner = false) {
  console.log('Getting staking contract at address:', address);

  const provider = await getProvider();
  const contract = new ethers.Contract(
    address,
    stakingABI,
    provider
  );

  if (withSigner) {
    const signer = await getSigner();
    console.log('Using signer:', await signer.getAddress());
    return contract.connect(signer);
  }

  return contract;
};

export async function getStakingRewardsContract(address: string, withSigner = false) {
  console.log('Getting staking rewards contract at address:', address);

  const provider = await getProvider();
  const contract = new ethers.Contract(
    address,
    stakingRewardsABI,
    provider
  );

  if (withSigner) {
    const signer = await getSigner();
    console.log('Using signer:', await signer.getAddress());
    return contract.connect(signer);
  }

  return contract;
};

export const connectWallet = async () => {
  throw new Error('Please use RainbowKit to connect wallet');
};

export const getCurrentAddress = async () => {
  throw new Error('Please use RainbowKit to get current address');
};

export const setupWalletEventListeners = (
  onAccountsChanged?: (accounts: string[]) => void,
  onChainChanged?: (chainId: string) => void
) => {
  throw new Error('Please use RainbowKit to setup wallet event listeners');
};