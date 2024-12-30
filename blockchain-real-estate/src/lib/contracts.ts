'use client';

import propertyFactoryJSONABI from '@contracts/abis/PropertyFactory.json';
import whitelistJSONABI from '@contracts/abis/Whitelist.json';
import stakingRewardsJSONABI from '@contracts/abis/StakingRewards.json';

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
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [{ name: "newOwner", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "initialize",
    inputs: [
      { name: "_validator", type: "address" },
      { name: "_whitelistContract", type: "address" },
      { name: "_eurcTokenAddress", type: "address" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "validator",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "whitelistContract",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "eurcTokenAddress",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view"
  },
  
  // Property management
  {
    type: "function",
    name: "createProperty",
    inputs: [
      { name: "_tokenName", type: "string" },
      { name: "_tokenSymbol", type: "string" },
      { name: "_title", type: "string" },
      { name: "_description", type: "string" },
      { name: "_location", type: "string" },
      { name: "_imageUrl", type: "string" },
      { name: "_price", type: "uint256" },
      { name: "_totalSupply", type: "uint256" }
    ],
    outputs: [{ type: "address" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "approveProperty",
    inputs: [{ name: "_propertyAddress", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "properties",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "tokenAddress", type: "address" },
      { name: "isApproved", type: "bool" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getProperties",
    inputs: [],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "tokenAddress", type: "address" },
          { name: "isApproved", type: "bool" }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getPropertyCount",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view"
  },
  
  // Events
  {
    type: "event",
    name: "PropertyCreated",
    inputs: [
      { indexed: true, name: "propertyToken", type: "address" },
      { indexed: true, name: "creator", type: "address" }
    ]
  },
  {
    type: "event",
    name: "PropertyApproved",
    inputs: [
      { indexed: true, name: "propertyToken", type: "address" }
    ]
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      { indexed: true, name: "previousOwner", type: "address" },
      { indexed: true, name: "newOwner", type: "address" }
    ]
  },
  {
    type: "event",
    name: "Initialized",
    inputs: [
      { indexed: false, name: "version", type: "uint64" }
    ]
  }
] as const;

export const eurcABI = [
  {
    type: 'function',
    name: 'name',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'function',
    name: 'transferFrom',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable'
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ]
  }
] as const;

export const propertyTokenABI = [
  // Property details
  {
    type: "function",
    name: "propertyDetails",
    inputs: [],
    outputs: [
      { name: "title", type: "string" },
      { name: "description", type: "string" },
      { name: "location", type: "string" },
      { name: "imageUrl", type: "string" },
      { name: "price", type: "uint256" },
      { name: "isActive", type: "bool" }
    ],
    stateMutability: "view"
  },
  // Whitelist contract
  {
    type: "function",
    name: "whitelistContract",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view"
  },
  // Token holder
  {
    type: "function",
    name: "tokenHolder",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view"
  },
  // Purchase tokens
  {
    type: "function",
    name: "purchaseTokens",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  // Sell tokens
  {
    type: "function",
    name: "sellTokens",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  // ERC20 functions
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ type: "string" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ type: "string" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ type: "uint8" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ type: "uint256" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable"
  }
] as const;

export const whitelistABI = [
  {
    type: "function",
    name: "isWhitelisted",
    inputs: [
      {
        name: "account",
        type: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bool"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "addToWhitelist",
    inputs: [
      {
        name: "account",
        type: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view"
  }
] as const;

export const stakingFactoryV2ABI = [
  {
    type: "function",
    name: "stakingImplementation",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "eurcToken",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "stakingContracts",
    inputs: [{ type: "address", name: "propertyToken" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { type: "address", name: "contractAddress" },
          { type: "uint256", name: "rewardRate" },
          { type: "uint256", name: "duration" },
          { type: "bool", name: "isActive" }
        ]
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "createStakingContract",
    inputs: [
      { type: "address", name: "propertyToken" },
      { type: "uint256", name: "rewardRate" },
      { type: "uint256", name: "rewardsDuration" }
    ],
    outputs: [{ type: "address" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "fundStakingContract",
    inputs: [
      { type: "address", name: "propertyToken" },
      { type: "uint256", name: "amount" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getStakingContracts",
    inputs: [{ type: "address", name: "propertyToken" }],
    outputs: [{ type: "address[]" }],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "StakingContractCreated",
    inputs: [
      { type: "address", indexed: true, name: "propertyToken" },
      { type: "address", indexed: false, name: "stakingContract" }
    ]
  },
  {
    type: "event",
    name: "StakingContractFunded",
    inputs: [
      { type: "address", indexed: true, name: "stakingContract" },
      { type: "uint256", indexed: false, name: "amount" }
    ]
  }
] as const;

export const stakingRewardsV2ABI = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "error",
    name: "InvalidAmount",
    inputs: []
  },
  {
    type: "error",
    name: "OnlyFactory",
    inputs: []
  },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address"
      }
    ]
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address"
      }
    ]
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RewardAdded",
    inputs: [
      {
        name: "reward",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RewardPaid",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "reward",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "RewardRateUpdated",
    inputs: [
      {
        name: "newRate",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "function",
    name: "notifyRewardRate",
    inputs: [
      {
        name: "rate",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "duration",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "earned",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
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
    name: "finishAt",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
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
    name: "initialize",
    inputs: [
      {
        name: "_stakingToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "_rewardToken",
        type: "address",
        internalType: "address"
      },
      {
        name: "_duration",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "lastTimeRewardApplicable",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "lastUpdateTime",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "notifyRewardAmount",
    inputs: [
      {
        name: "reward",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "periodFinish",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "rewardPerToken",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "rewardPerTokenStored",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "rewardRate",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "rewardToken",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "rewards",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "stake",
    inputs: [
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "stakingToken",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "newOwner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "userRewardPerTokenPaid",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "withdraw",
    inputs: [
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "totalSupply",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  }
] as const;

export const stakingFactoryABI = stakingFactoryV2ABI;
export const stakingABI = stakingRewardsV2ABI;
export const stakingRewardsABI = stakingRewardsV2ABI;

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
  getPrice(): Promise<bigint>;
}

export interface EURC extends Contract {
  name(): Promise<string>;
  symbol(): Promise<string>;
  decimals(): Promise<number>;
  totalSupply(): Promise<bigint>;
  balanceOf(account: string): Promise<bigint>;
  allowance(owner: string, spender: string): Promise<bigint>;
  approve(spender: string, amount: bigint): Promise<ContractTransaction>;
  transfer(to: string, amount: bigint): Promise<ContractTransaction>;
  transferFrom(from: string, to: string, amount: bigint): Promise<ContractTransaction>;
}

export interface StakingFactory extends Contract {
  createStakingContract(
    stakingToken: string,
    rewardRate: number,
    duration: number,
    options?: any
  ): Promise<any>;
  getStakingContracts(propertyToken: string): Promise<string>;
  hasStakingRewards(propertyToken: string): Promise<boolean>;
  getAllStakingContracts(): Promise<string[]>;
  stakingContracts(propertyToken: string): Promise<{
    contractAddress: string;
    rewardRate: number;
    duration: number;
    isActive: boolean;
  }>;
}
