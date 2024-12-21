'use client';

import { propertyTokenABI as propertyTokenJSONABI } from '@contracts/abis/PropertyToken.json';
import { propertyFactoryABI as propertyFactoryJSONABI } from '@contracts/abis/PropertyFactory.json';
import { whitelistABI as whitelistJSONABI } from '@contracts/abis/Whitelist.json';

export const PROPERTY_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS;
export const WHITELIST_ADDRESS = process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS;
export const EURC_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;
export const STAKING_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;

export const propertyFactoryABI = [
  // Admin functions
  'function owner() view returns (address)',
  'function transferOwnership(address newOwner)',
  'function initialize(string _name, string _symbol, address _paymentToken, address _admin, address _validator)',
  'function renounceOwnership()',
  
  // Property management
  'function createProperty(string title, string description, string location, string imageUrl, uint256 price, uint256 totalSupply, string tokenName, string tokenSymbol) returns (address)',
  'function approveProperty(address _propertyAddress)',
  'function rejectProperty(address _propertyAddress)',
  'function getPropertyStatus(address _propertyAddress) view returns (bool)',
  'function getUserProperties(address _user) view returns (tuple(address tokenAddress, bool isApproved)[])',
  'function getPropertyCreators() view returns (address[])',
  
  // Token management
  'function paymentToken() view returns (address)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function eurcTokenAddress() view returns (address)',
  
  // Events
  'event PropertyCreated(address indexed propertyToken, address indexed creator, string title, string location, uint256 price)',
  'event PropertyApproved(address indexed tokenAddress)',
  'event PropertyRejected(address indexed tokenAddress)',
  'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
  'event EURCTokenUpdated(address indexed newAddress)',
  'event Initialized(uint64 version)'
] as const;

export const propertyTokenABI = [
  // ERC20 functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  
  // Property-specific functions
  'function propertyDetails() view returns (string title, string description, string location, string imageUrl, uint256 price, address owner, bool isApproved)',
  'function purchaseTokens(uint256 _amount) external',
  'function owner() view returns (address)',
  
  // Events
  'event PropertyDetailsUpdated(string title, string description, string location, string imageUrl, uint256 price)',
  'event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost)',
  'event TokensSold(address indexed seller, uint256 amount, uint256 payment)'
] as const;

export const eurcABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
] as const;

export const whitelistABI = [
  'function isWhitelisted(address account) view returns (bool)',
  'function addWhitelisted(address account)',
  'function removeWhitelisted(address account)',
  'event Whitelisted(address indexed account)',
  'event RemovedWhitelist(address indexed account)'
] as const;

export const stakingFactoryABI = [
  // View functions
  'function rewardsToken() view returns (address)',
  'function propertyToStaking(address) view returns (address)',
  'function stakingContracts(uint256) view returns (address)',
  'function stakingContractsLength() view returns (uint256)',
  
  // State-changing functions
  'function createStakingRewards(address stakingToken, uint256 duration, uint256 rewardRate) returns (address)',
  'function setRewardsToken(address _rewardsToken)',
  
  // Events
  'event StakingRewardsCreated(address indexed stakingToken, address indexed stakingRewards)',
  'event RewardsTokenSet(address indexed rewardsToken)'
] as const;

export const stakingABI = [
  'function stake(uint256 amount)',
  'function withdraw(uint256 amount)',
  'function getReward()',
  'function exit()',
  'function balanceOf(address account) view returns (uint256)',
  'function earned(address account) view returns (uint256)',
  'function rewardPerToken() view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function rewardRate() view returns (uint256)',
  'function lastTimeRewardApplicable() view returns (uint256)',
  'function rewardsDuration() view returns (uint256)',
  'function periodFinish() view returns (uint256)',
  'event RewardAdded(uint256 reward)',
  'event Staked(address indexed user, uint256 amount)',
  'event Withdrawn(address indexed user, uint256 amount)',
  'event RewardPaid(address indexed user, uint256 reward)'
] as const;

// Contract Interfaces
export interface PropertyDetails {
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  price: bigint;
  owner: string;
  isApproved: boolean;
}

export interface PropertyToken extends BaseContract {
  propertyDetails(): Promise<PropertyDetails>;
  purchaseTokens(amount: bigint): Promise<ContractTransaction>;
  owner(): Promise<string>;
  name(): Promise<string>;
  symbol(): Promise<string>;
  decimals(): Promise<number>;
  totalSupply(): Promise<bigint>;
  balanceOf(account: string): Promise<bigint>;
  transfer(to: string, amount: bigint): Promise<boolean>;
  allowance(owner: string, spender: string): Promise<bigint>;
  approve(spender: string, amount: bigint): Promise<boolean>;
  transferFrom(from: string, to: string, amount: bigint): Promise<boolean>;
}

export interface StakingFactory extends Contract {
  createStakingRewards(
    stakingToken: string,
    duration: number,
    rewardRate: number,
    options?: any
  ): Promise<any>;
  getStakingRewards(propertyToken: string): Promise<string>;
  hasStakingRewards(propertyToken: string): Promise<boolean>;
  getAllStakingContracts(): Promise<string[]>;
}
