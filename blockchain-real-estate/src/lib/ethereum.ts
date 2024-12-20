import { Web3Provider } from '@ethersproject/providers';
import { Contract, Signer } from 'ethers';
import { propertyFactoryABI, propertyTokenABI, eurcABI, whitelistABI } from './contracts';

declare global {
  interface Window {
    ethereum?: any;
  }
}

let _provider: Web3Provider | null = null;
let _signer: Signer | null = null;

export const getSigner = async (): Promise<Signer> => {
  if (!window.ethereum) {
    throw new Error('No ethereum provider found. Please install MetaMask.');
  }

  try {
    if (!_provider) {
      _provider = new Web3Provider(window.ethereum);
      await _provider.send('eth_requestAccounts', []);
    }
    if (!_signer) {
      _signer = _provider.getSigner();
    }
    return _signer;
  } catch (error) {
    console.error('Error getting signer:', error);
    throw error;
  }
};

const getProvider = async (): Promise<Web3Provider> => {
  if (!window.ethereum) {
    throw new Error('No ethereum provider found. Please install MetaMask.');
  }

  if (!_provider) {
    _provider = new Web3Provider(window.ethereum);
    await _provider.send('eth_requestAccounts', []);
  }
  return _provider;
};

export const getContract = async (address: string, abi: any[], needsSigner = false): Promise<Contract> => {
  if (!address) {
    throw new Error('Contract address is not defined');
  }

  const provider = await getProvider();
  if (needsSigner) {
    const signer = await getSigner();
    return new Contract(address, abi, signer);
  }
  return new Contract(address, abi, provider);
};

export const getPropertyFactoryContract = async (needsSigner = false): Promise<Contract> => {
  const address = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS;
  if (!address) throw new Error('Property factory address not found');
  return getContract(address, propertyFactoryABI, needsSigner);
};

export const getPropertyTokenContract = async (address: string, needsSigner = false): Promise<Contract> => {
  return getContract(address, propertyTokenABI, needsSigner);
};

export const getEURCContract = async (address: string, needsSigner = false): Promise<Contract> => {
  return getContract(address, eurcABI, needsSigner);
};

export const getWhitelistContract = async (needsSigner = false): Promise<Contract> => {
  const address = process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS;
  if (!address) throw new Error('Whitelist proxy address not found');
  return getContract(address, whitelistABI, needsSigner);
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