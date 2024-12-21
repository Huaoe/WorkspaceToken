'use client';

import { Contract, Signer, ethers } from 'ethers';
import { propertyFactoryABI, propertyTokenABI, eurcABI, whitelistABI, stakingFactoryABI, stakingABI } from './contracts';
import { PROPERTY_FACTORY_ADDRESS, WHITELIST_ADDRESS, EURC_TOKEN_ADDRESS, STAKING_FACTORY_ADDRESS } from './contracts';

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

const getContract = async (address: string, abi: any[], withSigner = false) => {
  console.log('Initializing contract at address:', address);
  console.log('Using ABI:', abi);

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
    const contract = new ethers.Contract(address, abi, provider);

    // Return contract with signer if requested
    if (withSigner) {
      const signer = await provider.getSigner();
      return contract.connect(signer);
    }

    return contract;
  } catch (error) {
    console.error('Error initializing contract:', error);
    throw error;
  }
};

export const getEURCContract = async (address: string, withSigner = false) => {
  console.log('Getting EURC contract at address:', address);
  return getContract(address, eurcABI, withSigner);
};

export const getPropertyFactoryContract = async (withSigner = false) => {
  if (!PROPERTY_FACTORY_ADDRESS) {
    throw new Error('Property factory address not configured');
  }
  console.log('Getting property factory contract at address:', PROPERTY_FACTORY_ADDRESS);
  return getContract(PROPERTY_FACTORY_ADDRESS, propertyFactoryABI, withSigner);
};

export const getPropertyTokenContract = async (address: string, withSigner = false) => {
  console.log('Getting property token contract at address:', address);
  return getContract(address, propertyTokenABI, withSigner);
};

export const getWhitelistContract = async (withSigner = false) => {
  if (!WHITELIST_ADDRESS) {
    throw new Error('Whitelist address not configured');
  }
  console.log('Getting whitelist contract at address:', WHITELIST_ADDRESS);
  return getContract(WHITELIST_ADDRESS, whitelistABI, withSigner);
};

export const getStakingFactoryContract = async (withSigner = false) => {
  if (!STAKING_FACTORY_ADDRESS) {
    throw new Error('Staking factory address not configured');
  }
  console.log('Getting staking factory contract at address:', STAKING_FACTORY_ADDRESS);
  return getContract(STAKING_FACTORY_ADDRESS, stakingFactoryABI, withSigner);
};

export const getStakingContract = async (address: string, withSigner = false) => {
  return getContract(address, stakingABI, withSigner);
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