'use client';

import propertyFactoryJSON from '@contracts/abis/PropertyFactory.json';
import whitelistJSON from '@contracts/abis/Whitelist.json';
import propertyTokenJSON from '@contracts/abis/PropertyToken.json';

export const PROPERTY_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS;
export const WHITELIST_ADDRESS = process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS;
export const EURC_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;

export const propertyFactoryABI = [
  'function owner() view returns (address)',
  'function createProperty(string title, string description, string location, string imageUrl, uint256 price, uint256 totalSupply, string tokenName, string tokenSymbol) returns (address)',
  'function purchasePropertyTokens(address propertyToken, uint256 amount) returns (bool)',
  'function paymentToken() view returns (address)',
  'function getAllProperties() view returns (address[])',
  'event PropertyCreated(address indexed propertyToken, address indexed creator, string title, string location, uint256 price)'
];

export const propertyTokenABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function owner() view returns (address)',
  'function propertyDetails() view returns (string title, string description, string location, string imageUrl, uint256 price, bool isActive)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function transferFrom(address from, address to, uint256 value) returns (bool)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
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
