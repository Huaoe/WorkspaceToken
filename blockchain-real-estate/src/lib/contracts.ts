'use client';

import propertyFactoryJSON from '@contracts/abis/PropertyFactory.json';
import whitelistJSON from '@contracts/abis/Whitelist.json';
import propertyTokenJSON from '@contracts/abis/PropertyToken.json';

export const PROPERTY_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS;
export const WHITELIST_ADDRESS = process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS;
export const EURC_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;

export const propertyFactoryABI = [
  // Admin functions
  'function owner() view returns (address)',
  'function transferOwnership(address newOwner)',
  
  // Property management
  'function createProperty(string title, string description, string location, string imageUrl, uint256 price, uint256 totalSupply, string tokenName, string tokenSymbol) returns (address)',
  'function purchasePropertyTokens(address propertyToken, uint256 amount) returns (bool)',
  'function paymentToken() view returns (address)',
  'function getAllProperties() view returns (address[])',
  
  // Events
  'event PropertyCreated(address indexed propertyToken, address indexed creator, string title, string location, uint256 price)',
  'event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)'
];

export const propertyTokenABI = [
  // ERC20 functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function transferFrom(address from, address to, uint256 value) returns (bool)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  
  // Property specific functions
  'function owner() view returns (address)',
  'function propertyDetails() view returns (string title, string description, string location, string imageUrl, uint256 price, bool isActive)',
  'function getTokenPrice() view returns (uint256)',
  'function isActive() view returns (bool)',
  'function eurcToken() view returns (address)',
  'function purchaseTokens(uint256 amount) returns (bool)',
  
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  'event TokensPurchased(address indexed buyer, uint256 amount, uint256 eurcPaid)',
  'event TokensSold(address indexed seller, uint256 amount, uint256 eurcReceived)',
  'event PropertyStatusUpdated(bool isActive)'
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
