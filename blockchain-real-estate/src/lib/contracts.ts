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

export const eurcABI = [
  // Read-only functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  
  // Write functions
  'function approve(address spender, uint256 value) returns (bool)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function transferFrom(address from, address to, uint256 value) returns (bool)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
] as const;

export const propertyTokenABI = [
  {
    type: "function",
    name: "tokenHolder",
    inputs: [],
    outputs: [{ type: "address", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "purchaseTokens",
    inputs: [{ type: "uint256", name: "_amount" }],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ type: "string", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ type: "string", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ type: "uint8", name: "" }],
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
    name: "balanceOf",
    inputs: [{ type: "address", name: "account" }],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "transfer",
    inputs: [
      { type: "address", name: "to" },
      { type: "uint256", name: "amount" }
    ],
    outputs: [{ type: "bool", name: "" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { type: "address", name: "owner" },
      { type: "address", name: "spender" }
    ],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "approve",
    inputs: [
      { type: "address", name: "spender" },
      { type: "uint256", name: "amount" }
    ],
    outputs: [{ type: "bool", name: "" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "transferFrom",
    inputs: [
      { type: "address", name: "from" },
      { type: "address", name: "to" },
      { type: "uint256", name: "amount" }
    ],
    outputs: [{ type: "bool", name: "" }],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "propertyDetails",
    inputs: [],
    outputs: [
      { type: "string", name: "title" },
      { type: "string", name: "description" },
      { type: "string", name: "location" },
      { type: "string", name: "imageUrl" },
      { type: "uint256", name: "price" },
      { type: "bool", name: "isActive" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getPrice",
    inputs: [],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "whitelistContract",
    inputs: [],
    outputs: [{ type: "address", name: "" }],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "eurcToken",
    inputs: [],
    outputs: [{ type: "address", name: "" }],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { type: "address", indexed: true, name: "from" },
      { type: "address", indexed: true, name: "to" },
      { type: "uint256", indexed: false, name: "value" }
    ]
  },
  {
    type: "event",
    name: "Approval",
    inputs: [
      { type: "address", indexed: true, name: "owner" },
      { type: "address", indexed: true, name: "spender" },
      { type: "uint256", indexed: false, name: "value" }
    ]
  },
  {
    type: "event",
    name: "TokensPurchased",
    inputs: [
      { type: "address", indexed: true, name: "buyer" },
      { type: "uint256", indexed: false, name: "amount" },
      { type: "uint256", indexed: false, name: "eurcAmount" }
    ]
  },
  {
    type: "event",
    name: "TokensSold",
    inputs: [
      { type: "address", indexed: true, name: "seller" },
      { type: "uint256", indexed: false, name: "amount" },
      { type: "uint256", indexed: false, name: "eurcAmount" }
    ]
  },
  {
    type: "event",
    name: "PropertyStatusUpdated",
    inputs: [
      { type: "bool", indexed: false, name: "status" }
    ]
  },
  {
    type: "event",
    name: "TokenHolderUpdated",
    inputs: [
      { type: "address", indexed: true, name: "previousHolder" },
      { type: "address", indexed: true, name: "newHolder" }
    ]
  }
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

export const stakingFactoryV2ABI = [
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
    type: "function",
    name: "owner",
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
    name: "Staked",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Withdrawn",
    inputs: [
      {
        name: "user",
        type: "address",
        indexed: true,
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        indexed: false,
        internalType: "uint256"
      }
    ],
    anonymous: false
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
