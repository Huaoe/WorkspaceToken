import { ethers, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

function updateEnvLocalFile(envPath: string, newValues: { [key: string]: string }) {
  let content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  let newContent: string[] = [];
  let inContractSection = false;
  let contractSectionFound = false;

  // Keep everything before Smart Contract Addresses section
  for (const line of lines) {
    if (line.trim() === '# Smart Contract Addresses') {
      inContractSection = true;
      contractSectionFound = true;
      newContent.push('\n# Smart Contract Addresses\n');
      
      // Add Whitelist Contract section
      newContent.push('# Whitelist Contract');
      newContent.push(`NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS=${newValues.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS}`);
      newContent.push(`NEXT_PUBLIC_WHITELIST_IMPLEMENTATION_ADDRESS=${newValues.NEXT_PUBLIC_WHITELIST_IMPLEMENTATION_ADDRESS}`);
      newContent.push(`NEXT_PUBLIC_WHITELIST_ADMIN_ADDRESS=${newValues.NEXT_PUBLIC_WHITELIST_ADMIN_ADDRESS}\n`);
      
      // Add Property Token Contract section
      newContent.push('# Property Token Contract');
      newContent.push(`NEXT_PUBLIC_PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS=${newValues.NEXT_PUBLIC_PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS}\n`);
      
      // Add Property Factory Contract section
      newContent.push('# Property Factory Contract');
      newContent.push(`NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS=${newValues.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS}`);
      newContent.push(`NEXT_PUBLIC_PROPERTY_FACTORY_IMPLEMENTATION_ADDRESS=${newValues.NEXT_PUBLIC_PROPERTY_FACTORY_IMPLEMENTATION_ADDRESS}`);
      newContent.push(`NEXT_PUBLIC_PROPERTY_FACTORY_ADMIN_ADDRESS=${newValues.NEXT_PUBLIC_PROPERTY_FACTORY_ADMIN_ADDRESS}\n`);
      
      // Add EURC Token Contract section
      newContent.push('# EURC Token Contract');
      newContent.push(`NEXT_PUBLIC_EURC_TOKEN_ADDRESS=${newValues.NEXT_PUBLIC_EURC_TOKEN_ADDRESS}\n`);
      break;
    }
    newContent.push(line);
  }

  if (!contractSectionFound) {
    // If Smart Contract Addresses section doesn't exist, add it at the end
    newContent.push('\n# Smart Contract Addresses\n');
    // Add all contract sections as above...
    newContent.push('# Whitelist Contract');
    newContent.push(`NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS=${newValues.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS}`);
    newContent.push(`NEXT_PUBLIC_WHITELIST_IMPLEMENTATION_ADDRESS=${newValues.NEXT_PUBLIC_WHITELIST_IMPLEMENTATION_ADDRESS}`);
    newContent.push(`NEXT_PUBLIC_WHITELIST_ADMIN_ADDRESS=${newValues.NEXT_PUBLIC_WHITELIST_ADMIN_ADDRESS}\n`);
    newContent.push('# Property Token Contract');
    newContent.push(`NEXT_PUBLIC_PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS=${newValues.NEXT_PUBLIC_PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS}\n`);
    newContent.push('# Property Factory Contract');
    newContent.push(`NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS=${newValues.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS}`);
    newContent.push(`NEXT_PUBLIC_PROPERTY_FACTORY_IMPLEMENTATION_ADDRESS=${newValues.NEXT_PUBLIC_PROPERTY_FACTORY_IMPLEMENTATION_ADDRESS}`);
    newContent.push(`NEXT_PUBLIC_PROPERTY_FACTORY_ADMIN_ADDRESS=${newValues.NEXT_PUBLIC_PROPERTY_FACTORY_ADMIN_ADDRESS}\n`);
    newContent.push('# EURC Token Contract');
    newContent.push(`NEXT_PUBLIC_EURC_TOKEN_ADDRESS=${newValues.NEXT_PUBLIC_EURC_TOKEN_ADDRESS}\n`);
  }

  // Write the updated content back to the file
  fs.writeFileSync(envPath, newContent.join('\n'));
}

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

  // Update frontend .env.local with NEXT_PUBLIC_ values
  const frontendAddresses = {
    NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS: whitelistAddress,
    NEXT_PUBLIC_WHITELIST_IMPLEMENTATION_ADDRESS: whitelistImplAddress,
    NEXT_PUBLIC_WHITELIST_ADMIN_ADDRESS: whitelistAdminAddress,
    NEXT_PUBLIC_PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS: propertyTokenImplAddress,
    NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS: propertyFactoryAddress,
    NEXT_PUBLIC_PROPERTY_FACTORY_IMPLEMENTATION_ADDRESS: propertyFactoryImplAddress,
    NEXT_PUBLIC_PROPERTY_FACTORY_ADMIN_ADDRESS: propertyFactoryAdminAddress,
    NEXT_PUBLIC_EURC_TOKEN_ADDRESS: eurcAddress,
  };

  // Update frontend .env.local
  console.log("\nUpdating frontend .env.local with NEXT_PUBLIC_ values");
  const envLocalPath = path.resolve(__dirname, '../../.env.local');
  updateEnvLocalFile(envLocalPath, frontendAddresses);

  console.log("\nDeployment complete! Environment variables have been updated in .env.local");

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
