'use client';

import propertyFactoryJSON from '@contracts/abis/PropertyFactory.json';
import whitelistJSON from '@contracts/abis/Whitelist.json';
import propertyTokenJSON from '@contracts/abis/PropertyToken.json';

export const PROPERTY_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS;
export const WHITELIST_ADDRESS = process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS;
export const EURC_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;
export const STAKING_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;

export const propertyFactoryABI = [
  // Admin functions
  'function owner() view returns (address)',
  'function transferOwnership(address newOwner)',
  
  // Property management
  'function createProperty(string title, string description, string location, string imageUrl, uint256 price, uint256 totalSupply, string tokenName, string tokenSymbol) returns (address)',
  'function purchasePropertyTokens(address propertyToken, uint256 amount) returns (bool)',
  'function paymentToken() view returns (address)',
  'function getAllProperties() view returns (address[])',
  
  // Staking management
  'function createStakingRewards(address _stakingToken, uint256 _duration, uint256 _rewardRate) returns (address)',
  'function getStakingRewards(address propertyToken) view returns (address)',
  'function hasStakingRewards(address propertyToken) view returns (bool)',
  'function getAllStakingContracts() view returns (address[])',
  
  // Events
  'event PropertyCreated(address indexed propertyToken, address indexed creator, string title, string location, uint256 price)',
  'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
  'event StakingRewardsCreated(address indexed stakingToken, address indexed stakingRewards)'
];

export const propertyTokenABI = [
  // View functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function eurcToken() view returns (address)',
  'function owner() view returns (address)',
  'function isApproved() view returns (bool)',
  'function getPropertyDetails() view returns (tuple(string title, string description, string location, string imageUrl, uint256 price))',

  // State-changing functions
  'function transfer(address to, uint256 value) returns (bool)',
  'function transferFrom(address from, address to, uint256 value) returns (bool)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function setApproved(bool _approved)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event PropertyApproved(address indexed propertyToken)'
];

export const eurcABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function transferFrom(address from, address to, uint256 value) returns (bool)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

export const whitelistABI = [
  'function isWhitelisted(address) view returns (bool)',
  'function addWhitelisted(address)',
  'function removeWhitelisted(address)',
  'event Whitelisted(address indexed account)',
  'event RemovedWhitelist(address indexed account)'
];

export const stakingFactoryABI = [
  // View functions
  'function rewardsToken() view returns (address)',
  'function propertyToStaking(address) view returns (address)',
  'function stakingContracts(uint256) view returns (address)',
  'function owner() view returns (address)',
  'function hasStakingRewards(address propertyToken) view returns (bool)',
  'function getStakingRewards(address propertyToken) view returns (address)',
  'function getAllStakingContracts() view returns (address[])',
  'function getStakingContractsCount() view returns (uint256)',

  // State-changing functions
  'function createStakingRewards(address _stakingToken, uint256 _duration, uint256 _rewardRate) returns (address)',
  'function transferOwnership(address newOwner)',

  // Events
  'event StakingRewardsCreated(address indexed stakingToken, address indexed stakingRewards)',
  'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)'
];

// Contract Interfaces
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
