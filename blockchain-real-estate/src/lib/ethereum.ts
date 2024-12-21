'use client';

import { Contract, Signer, ethers } from 'ethers';
import { propertyFactoryABI, propertyTokenABI, eurcABI, whitelistABI } from './contracts';
import { PROPERTY_FACTORY_ADDRESS, WHITELIST_ADDRESS, EURC_TOKEN_ADDRESS } from './contracts';

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

export const getStakingFactoryContract = async (needsSigner = false) => {
  try {
    const factoryAddress = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
    if (!factoryAddress) {
      throw new Error('StakingFactory address not found in environment variables');
    }

    const factoryABI = [
      'function rewardsToken() view returns (address)',
      'function propertyToStaking(address) view returns (address)',
      'function stakingContracts(uint256) view returns (address)',
      'function owner() view returns (address)',
      'function createStakingRewards(address stakingToken, uint256 duration, uint256 rewardRate) returns (address)',
      'event StakingRewardsCreated(address indexed stakingToken, address indexed stakingRewards)',
      'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)'
    ];

    return getContract(factoryAddress, factoryABI, needsSigner);
  } catch (error) {
    console.error('Error getting staking factory contract:', error);
    throw error;
  }
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