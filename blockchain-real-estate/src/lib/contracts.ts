'use client';

import { propertyTokenABI as propertyTokenJSONABI } from '@contracts/abis/PropertyToken.json';
import { propertyFactoryABI as propertyFactoryJSONABI } from '@contracts/abis/PropertyFactory.json';
import { whitelistABI as whitelistJSONABI } from '@contracts/abis/Whitelist.json';
import { stakingRewardsABI as stakingRewardsJSONABI } from '@contracts/abis/StakingRewards.json';

export const PROPERTY_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS;
export const WHITELIST_ADDRESS = process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS;
export const STAKING_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
export const EURC_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;

if (!PROPERTY_FACTORY_ADDRESS) {
  throw new Error('NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS is not defined');
}

if (!WHITELIST_ADDRESS) {
  throw new Error('NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS is not defined');
}

if (!STAKING_FACTORY_ADDRESS) {
  throw new Error('NEXT_PUBLIC_STAKING_FACTORY_ADDRESS is not defined');
}

if (!EURC_TOKEN_ADDRESS) {
  throw new Error('NEXT_PUBLIC_EURC_TOKEN_ADDRESS is not defined');
}

export const propertyFactoryABI = [
  // Admin functions
  'function owner() view returns (address)',
  'function transferOwnership(address newOwner)',
  'function initialize(address _validator, address _whitelistContract, address _eurcTokenAddress)',
  'function validator() view returns (address)',
  'function whitelistContract() view returns (address)',
  'function eurcTokenAddress() view returns (address)',
  
  // Property management
  'function createProperty(string _tokenName, string _tokenSymbol, string _title, string _description, string _location, string _imageUrl, uint256 _price, uint256 _totalSupply) returns (address)',
  'function approveProperty(address _propertyAddress)',
  'function properties(uint256) view returns (address tokenAddress, bool isApproved)',
  'function getProperties() view returns (tuple(address tokenAddress, bool isApproved)[])',
  'function getPropertyCount() view returns (uint256)',
  
  // Events
  'event PropertyCreated(address indexed propertyToken, address indexed creator)',
  'event PropertyApproved(address indexed propertyToken)',
  'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
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
  
  // Property functions
  'function initialize(tuple(string name, string symbol, string title, string description, string location, string imageUrl, uint256 price, uint256 totalSupply, address initialOwner, address eurcTokenAddress, address whitelistContract) params)',
  'function propertyDetails() view returns (string title, string description, string location, string imageUrl, uint256 price, bool isActive)',
  'function owner() view returns (address)',
  'function transferOwnership(address newOwner)',
  'function updatePropertyStatus(bool status)',
  
  // Trading functions
  'function purchaseTokens(uint256 amount)',
  'function sellTokens(uint256 amount)',
  
  // Events
  'event TokensPurchased(address indexed buyer, uint256 amount, uint256 eurcAmount)',
  'event TokensSold(address indexed seller, uint256 amount, uint256 eurcAmount)',
  'event PropertyStatusUpdated(bool status)',
  'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event Initialized(uint64 version)'
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
  // View functions
  'function isWhitelisted(address account) view returns (bool)',
  'function getWhitelistedAddresses() view returns (address[])',
  
  // Admin functions
  'function addToWhitelist(address account)',
  'function removeFromWhitelist(address account)',
  'function addBatchToWhitelist(address[] calldata accounts)',
  'function removeBatchFromWhitelist(address[] calldata accounts)',
  
  // Events
  'event AddressWhitelisted(address indexed account)',
  'event AddressRemovedFromWhitelist(address indexed account)',
  'event BatchWhitelistAdded(address[] accounts)',
  'event BatchWhitelistRemoved(address[] accounts)'
] as const;

export const stakingFactoryABI = [
  // Admin functions
  'function owner() view returns (address)',
  'function rewardToken() view returns (address)',
  'function stakingContracts(address) view returns (bool isActive)',
  'function fundContract(uint256 amount)',
  
  // Staking management
  'function createStakingContract(address stakingToken, uint256 rewardRate, uint256 duration)',
  'function getStakingContract(address stakingToken) view returns (address)',
  
  // Events
  'event StakingContractCreated(address indexed stakingToken, address indexed stakingContract)',
  'event ContractFunded(uint256 amount)',
  'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)'
] as const;

export const stakingABI = [
  {
    type: "function",
    name: "stake",
    inputs: [{ type: "uint256", name: "amount" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [{ type: "uint256", name: "amount" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getReward",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "exit",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ type: "address", name: "account" }],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "earned",
    inputs: [{ type: "address", name: "account" }],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getRewardForDuration",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "lastTimeRewardApplicable",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "rewardPerToken",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "rewardRate",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "rewards",
    inputs: [{ type: "address", name: "account" }],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "stakingToken",
    inputs: [],
    outputs: [{ type: "address", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "rewardsToken",
    inputs: [],
    outputs: [{ type: "address", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "duration",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "userRewardPerTokenPaid",
    inputs: [{ type: "address", name: "account" }],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "RewardAdded",
    inputs: [{ type: "uint256", indexed: false, name: "reward" }]
  },
  {
    type: "event",
    name: "Staked",
    inputs: [
      { type: "address", indexed: true, name: "user" },
      { type: "uint256", indexed: false, name: "amount" }
    ]
  },
  {
    type: "event",
    name: "Withdrawn",
    inputs: [
      { type: "address", indexed: true, name: "user" },
      { type: "uint256", indexed: false, name: "amount" }
    ]
  },
  {
    type: "event",
    name: "RewardPaid",
    inputs: [
      { type: "address", indexed: true, name: "user" },
      { type: "uint256", indexed: false, name: "reward" }
    ]
  }
] as const;

export const stakingRewardsABI = [
  {
    type: "function",
    name: "stake",
    inputs: [{ type: "uint256", name: "amount" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [{ type: "uint256", name: "amount" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getReward",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "exit",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ type: "address", name: "account" }],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "earned",
    inputs: [{ type: "address", name: "account" }],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "rewardRate",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "rewardsDuration",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "lastTimeRewardApplicable",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "rewardPerToken",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "rewardPerTokenStored",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "rewards",
    inputs: [{ type: "address", name: "" }],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "userRewardPerTokenPaid",
    inputs: [{ type: "address", name: "" }],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "RewardAdded",
    inputs: [{ type: "uint256", indexed: false, name: "reward" }]
  },
  {
    type: "event",
    name: "Staked",
    inputs: [
      { type: "address", indexed: true, name: "user" },
      { type: "uint256", indexed: false, name: "amount" }
    ]
  },
  {
    type: "event",
    name: "Withdrawn",
    inputs: [
      { type: "address", indexed: true, name: "user" },
      { type: "uint256", indexed: false, name: "amount" }
    ]
  },
  {
    type: "event",
    name: "RewardPaid",
    inputs: [
      { type: "address", indexed: true, name: "user" },
      { type: "uint256", indexed: false, name: "reward" }
    ]
  }
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

export interface PropertyToken extends Contract {
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
  transferTokensToContract(amount: bigint): Promise<ContractTransaction>;
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
