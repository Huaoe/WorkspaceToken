import { ethers, upgrades } from "hardhat";
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

async function main() {
  // Load environment variables
  dotenv.config();

  // Set mock EURC address if not provided
  const EURC_TOKEN_ADDRESS = process.env.EURC_TOKEN_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Using EURC token address:", EURC_TOKEN_ADDRESS);

  // Deploy Whitelist
  console.log("\nDeploying Whitelist...");
  const Whitelist = await ethers.getContractFactory("Whitelist");
  const whitelist = await upgrades.deployProxy(Whitelist, [deployer.address]);
  await whitelist.waitForDeployment();
  const whitelistAddress = await whitelist.getAddress();
  console.log("Whitelist proxy deployed to:", whitelistAddress);

  // Add deployer to whitelist
  console.log("\nAdding deployer to whitelist...");
  await whitelist.addToWhitelist(deployer.address);
  console.log("Deployer added to whitelist");

  // Deploy PropertyToken implementation
  console.log("\nDeploying PropertyToken implementation...");
  const PropertyToken = await ethers.getContractFactory("PropertyToken");
  const propertyTokenImpl = await PropertyToken.deploy();
  await propertyTokenImpl.waitForDeployment();
  const propertyTokenImplAddress = await propertyTokenImpl.getAddress();
  console.log("PropertyToken implementation deployed to:", propertyTokenImplAddress);

  // Deploy PropertyFactory
  console.log("\nDeploying PropertyFactory...");
  const PropertyFactory = await ethers.getContractFactory("PropertyFactory");
  const propertyFactory = await upgrades.deployProxy(PropertyFactory, [
    "PropertyToken", // _name
    "PT", // _symbol
    EURC_TOKEN_ADDRESS, // _paymentToken
    deployer.address, // _admin
    deployer.address, // _validator
    whitelistAddress // _whitelistContract
  ]);
  await propertyFactory.waitForDeployment();
  const propertyFactoryAddress = await propertyFactory.getAddress();
  console.log("PropertyFactory proxy deployed to:", propertyFactoryAddress);

  // Get implementation addresses
  const whitelistImplAddress = await upgrades.erc1967.getImplementationAddress(whitelistAddress);
  const propertyFactoryImplAddress = await upgrades.erc1967.getImplementationAddress(propertyFactoryAddress);

  // Get proxy admin addresses
  const whitelistAdminAddress = await upgrades.erc1967.getAdminAddress(whitelistAddress);
  const propertyFactoryAdminAddress = await upgrades.erc1967.getAdminAddress(propertyFactoryAddress);

  // Prepare environment variables
  const envContent = `
# Contract Addresses
WHITELIST_PROXY_ADDRESS="${whitelistAddress}"
WHITELIST_IMPLEMENTATION_ADDRESS="${whitelistImplAddress}"
WHITELIST_ADMIN_ADDRESS="${whitelistAdminAddress}"

PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS="${propertyTokenImplAddress}"

PROPERTY_FACTORY_PROXY_ADDRESS="${propertyFactoryAddress}"
PROPERTY_FACTORY_IMPLEMENTATION_ADDRESS="${propertyFactoryImplAddress}"
PROPERTY_FACTORY_ADMIN_ADDRESS="${propertyFactoryAdminAddress}"

# External Contracts
EURC_TOKEN_ADDRESS="${EURC_TOKEN_ADDRESS}"
`;

  // Write to both .env and .env.local
  const envPath = path.join(__dirname, '..', '.env');
  const envLocalPath = path.join(__dirname, '..', '.env.local');

  fs.writeFileSync(envPath, envContent.trim());
  fs.writeFileSync(envLocalPath, envContent.trim());

  console.log("\nDeployment complete! Environment variables have been updated in .env and .env.local");
  console.log("\nContract Addresses:");
  console.log("Whitelist Proxy:", whitelistAddress);
  console.log("Whitelist Implementation:", whitelistImplAddress);
  console.log("Whitelist Admin:", whitelistAdminAddress);
  console.log("\nPropertyToken Implementation:", propertyTokenImplAddress);
  console.log("\nPropertyFactory Proxy:", propertyFactoryAddress);
  console.log("PropertyFactory Implementation:", propertyFactoryImplAddress);
  console.log("PropertyFactory Admin:", propertyFactoryAdminAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
