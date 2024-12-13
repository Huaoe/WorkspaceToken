import { ethers, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import { updateEnvFiles } from "../utils/env-management";

async function main() {
  // Load environment variables
  dotenv.config();

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy Whitelist first
  console.log("\nDeploying Whitelist...");
  const Whitelist = await ethers.getContractFactory("Whitelist");
  const whitelist = await upgrades.deployProxy(Whitelist,
    [deployer.address],
    {
      initializer: 'initialize',
      kind: 'transparent',
      initialOwner: deployer.address
    }
  );
  await whitelist.waitForDeployment();
  const whitelistAddress = await whitelist.getAddress();
  console.log("Whitelist proxy deployed to:", whitelistAddress);

  // Get implementation and admin addresses
  const whitelistImplAddress = await upgrades.erc1967.getImplementationAddress(whitelistAddress);
  const whitelistAdminAddress = await upgrades.erc1967.getAdminAddress(whitelistAddress);
  
  console.log("\nWhitelist Addresses:");
  console.log("- Proxy:", whitelistAddress);
  console.log("- Implementation:", whitelistImplAddress);
  console.log("- Admin:", whitelistAdminAddress);

  // Add deployer to whitelist
  console.log("\nAdding deployer to whitelist...");
  await whitelist.addToWhitelist(deployer.address);
  console.log("Deployer added to whitelist");

  // Deploy MockEURC
  console.log("\nDeploying MockEURC...");
  const MockEURC = await ethers.getContractFactory("MockEURC");
  const mockEURC = await MockEURC.deploy(deployer.address);
  await mockEURC.waitForDeployment();
  const eurcAddress = await mockEURC.getAddress();
  console.log("MockEURC deployed to:", eurcAddress);

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
  const propertyFactory = await upgrades.deployProxy(
    PropertyFactory,
    [
      "PropertyToken", // _name
      "PT", // _symbol
      eurcAddress, // _paymentToken
      deployer.address, // _admin
      deployer.address, // _validator
      whitelistAddress, // _whitelistContract
    ],
    {
      initializer: 'initialize',
      kind: 'transparent',
      initialOwner: deployer.address
    }
  );
  await propertyFactory.waitForDeployment();
  const propertyFactoryAddress = await propertyFactory.getAddress();
  
  // Get implementation and admin addresses
  const propertyFactoryImplAddress = await upgrades.erc1967.getImplementationAddress(propertyFactoryAddress);
  const propertyFactoryAdminAddress = await upgrades.erc1967.getAdminAddress(propertyFactoryAddress);
  
  console.log("\nPropertyFactory Addresses:");
  console.log("- Proxy:", propertyFactoryAddress);
  console.log("- Implementation:", propertyFactoryImplAddress);
  console.log("- Admin:", propertyFactoryAdminAddress);

  // Update environment variables
  const envValues = {
    WHITELIST_PROXY_ADDRESS: whitelistAddress,
    WHITELIST_IMPLEMENTATION_ADDRESS: whitelistImplAddress,
    WHITELIST_ADMIN_ADDRESS: whitelistAdminAddress,
    PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS: propertyTokenImplAddress,
    PROPERTY_FACTORY_PROXY_ADDRESS: propertyFactoryAddress,
    PROPERTY_FACTORY_IMPLEMENTATION_ADDRESS: propertyFactoryImplAddress,
    PROPERTY_FACTORY_ADMIN_ADDRESS: propertyFactoryAdminAddress,
    EURC_TOKEN_ADDRESS: eurcAddress,
  };

  // Update .env and .env.local files
  console.log("\nUpdating environment files with new values");
  const projectRoot = path.resolve(__dirname, '../..');
  updateEnvFiles(projectRoot, envValues);

  console.log("\nDeployment complete! Environment variables have been updated in .env and .env.local");

  console.log("\nContract Addresses:");
  console.log("Whitelist Proxy:", whitelistAddress);
  console.log("Whitelist Implementation:", whitelistImplAddress);
  console.log("Whitelist Admin:", whitelistAdminAddress);
  console.log("\nPropertyToken Implementation:", propertyTokenImplAddress);
  console.log("\nPropertyFactory Proxy:", propertyFactoryAddress);
  console.log("PropertyFactory Implementation:", propertyFactoryImplAddress);
  console.log("PropertyFactory Admin:", propertyFactoryAdminAddress);
  console.log("\nEURC Token:", eurcAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
