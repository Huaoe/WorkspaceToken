import { ethers, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import { Contract } from "ethers";

// Load environment variables
dotenv.config();

async function getExistingAddresses() {
  const envLocalPath = "C:/Users/thoma/Desktop/WorkspacesToken/blockchain-real-estate/.env.local";
  if (!fs.existsSync(envLocalPath)) {
    return {};
  }
  
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const addresses: { [key: string]: string } = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^NEXT_PUBLIC_(.+)_ADDRESS=(.+)$/);
    if (match) {
      addresses[match[1]] = match[2];
    }
  });
  
  return addresses;
}

async function hasCodeChanged(contractName: string, existingAddress: string) {
  if (!existingAddress) return true;
  
  try {
    const provider = ethers.provider;
    const deployedBytecode = await provider.getCode(existingAddress);
    const factory = await ethers.getContractFactory(contractName);
    const newBytecode = factory.bytecode;
    
    return deployedBytecode !== newBytecode;
  } catch (error) {
    console.log(`Error checking bytecode for ${contractName}:`, error);
    return true;
  }
}

function updateEnvLocalFile(envPath: string, newValues: { [key: string]: string }) {
  // Read existing content before Smart Contract Addresses section
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }

  // Split content into lines and find where contract addresses start
  const lines = content.split('\n');
  const newContent: string[] = [];
  let foundContractSection = false;

  // Keep all lines until we find the first contract address section
  for (const line of lines) {
    if (line.includes('_ADDRESS') || line.includes('# Smart Contract Addresses')) {
      foundContractSection = true;
      break;
    }
    newContent.push(line);
  }

  // Add new contract addresses section
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
  
  // Add Staking Factory Contract section
  newContent.push('# Staking Factory Contract');
  newContent.push(`NEXT_PUBLIC_STAKING_FACTORY_ADDRESS=${newValues.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS}\n`);

  // Write the updated content back to the file
  fs.writeFileSync(envPath, newContent.join('\n'));
}

function updateEnvFile(envPath: string, newValues: { [key: string]: string }) {
  // Read existing content before Smart Contract Addresses section
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }

  // Split content into lines and find where contract addresses start
  const lines = content.split('\n');
  const newContent: string[] = [];
  let foundContractSection = false;

  // Keep all lines until we find the first contract address section
  for (const line of lines) {
    if (line.includes('_ADDRESS') || line.includes('# Smart Contract Addresses')) {
      foundContractSection = true;
      break;
    }
    newContent.push(line);
  }

  // Add new contract addresses section
  newContent.push('\n# Smart Contract Addresses\n');
  
  // Add Whitelist Contract section
  newContent.push('# Whitelist Contract');
  newContent.push(`WHITELIST_PROXY_ADDRESS=${newValues.WHITELIST_PROXY_ADDRESS}`);
  newContent.push(`WHITELIST_IMPLEMENTATION_ADDRESS=${newValues.WHITELIST_IMPLEMENTATION_ADDRESS}`);
  newContent.push(`WHITELIST_ADMIN_ADDRESS=${newValues.WHITELIST_ADMIN_ADDRESS}\n`);
  
  // Add Property Token Contract section
  newContent.push('# Property Token Contract');
  newContent.push(`PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS=${newValues.PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS}\n`);
  
  // Add Property Factory Contract section
  newContent.push('# Property Factory Contract');
  newContent.push(`PROPERTY_FACTORY_PROXY_ADDRESS=${newValues.PROPERTY_FACTORY_PROXY_ADDRESS}`);
  newContent.push(`PROPERTY_FACTORY_IMPLEMENTATION_ADDRESS=${newValues.PROPERTY_FACTORY_IMPLEMENTATION_ADDRESS}`);
  newContent.push(`PROPERTY_FACTORY_ADMIN_ADDRESS=${newValues.PROPERTY_FACTORY_ADMIN_ADDRESS}\n`);
  
  // Add EURC Token Contract section
  newContent.push('# EURC Token Contract');
  newContent.push(`EURC_TOKEN_ADDRESS=${newValues.EURC_TOKEN_ADDRESS}\n`);
  
  // Add Staking Factory Contract section
  newContent.push('# Staking Factory Contract');
  newContent.push(`STAKING_FACTORY_ADDRESS=${newValues.STAKING_FACTORY_ADDRESS}\n`);

  // Write the updated content back to the file
  fs.writeFileSync(envPath, newContent.join('\n'));
}

async function deployOrGetWhitelist(deployer: any, existingAddress: string) {
  if (existingAddress && !(await hasCodeChanged("Whitelist", existingAddress))) {
    console.log("Whitelist contract hasn't changed, using existing deployment at:", existingAddress);
    return ethers.getContractAt("Whitelist", existingAddress);
  }

  console.log("\nDeploying new Whitelist...");
  const Whitelist = await ethers.getContractFactory("Whitelist");
  const whitelist = await upgrades.deployProxy(
    Whitelist,
    [deployer.address],
    {
      initializer: 'initialize',
      kind: 'transparent',
      initialOwner: deployer.address
    }
  );
  await whitelist.waitForDeployment();
  return whitelist;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying/Updating contracts with account:", deployer.address);

  // Get existing addresses
  const existingAddresses = await getExistingAddresses();

  // Deploy or get Whitelist
  const whitelist = await deployOrGetWhitelist(
    deployer, 
    existingAddresses.WHITELIST_PROXY_ADDRESS
  );
  const whitelistAddress = await whitelist.getAddress();

  // Get implementation and admin addresses
  const whitelistImplAddress = await upgrades.erc1967.getImplementationAddress(whitelistAddress);
  const whitelistAdminAddress = await upgrades.erc1967.getAdminAddress(whitelistAddress);

  console.log("\nWhitelist Addresses:");
  console.log("- Proxy:", whitelistAddress);
  console.log("- Implementation:", whitelistImplAddress);
  console.log("- Admin:", whitelistAdminAddress);

  // Check if deployer is already whitelisted
  const isWhitelisted = await whitelist.isWhitelisted(deployer.address);
  if (!isWhitelisted) {
    console.log("\nAdding deployer to whitelist...");
    await whitelist.addToWhitelist(deployer.address);
    console.log("Deployer added to whitelist");
  } else {
    console.log("\nDeployer is already whitelisted");
  }

  // Get or deploy EURC
  let eurcAddress = existingAddresses.EURC_TOKEN_ADDRESS;
  if (!eurcAddress || await hasCodeChanged("MockEURC", eurcAddress)) {
    console.log("\nDeploying new MockEURC...");
    const MockEURC = await ethers.getContractFactory("MockEURC");
    const mockEURC = await MockEURC.deploy(deployer.address);
    await mockEURC.waitForDeployment();
    eurcAddress = await mockEURC.getAddress();
    console.log("MockEURC deployed to:", eurcAddress);
  } else {
    console.log("\nUsing existing MockEURC at:", eurcAddress);
  }

  // Deploy or get PropertyToken implementation
  let propertyTokenImplAddress = existingAddresses.PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS;
  if (!propertyTokenImplAddress || await hasCodeChanged("PropertyToken", propertyTokenImplAddress)) {
    console.log("\nDeploying new PropertyToken implementation...");
    const PropertyToken = await ethers.getContractFactory("PropertyToken");
    const propertyTokenImpl = await PropertyToken.deploy();
    await propertyTokenImpl.waitForDeployment();
    propertyTokenImplAddress = await propertyTokenImpl.getAddress();
    console.log("PropertyToken implementation deployed to:", propertyTokenImplAddress);
  } else {
    console.log("\nUsing existing PropertyToken implementation at:", propertyTokenImplAddress);
  }

  // Deploy or update PropertyFactory
  let propertyFactory: Contract;
  const existingFactoryAddress = existingAddresses.PROPERTY_FACTORY_PROXY_ADDRESS;
  
  if (!existingFactoryAddress || await hasCodeChanged("PropertyFactory", existingFactoryAddress)) {
    console.log("\nDeploying new PropertyFactory...");
    const PropertyFactory = await ethers.getContractFactory("PropertyFactory");
    propertyFactory = await upgrades.deployProxy(
      PropertyFactory,
      [
        "PropertyToken",
        "PT",
        eurcAddress,
        deployer.address,
        deployer.address,
        whitelistAddress,
      ],
      {
        initializer: 'initialize',
        kind: 'transparent',
        initialOwner: deployer.address
      }
    );
  } else {
    console.log("\nUpdating existing PropertyFactory...");
    propertyFactory = await ethers.getContractAt("PropertyFactory", existingFactoryAddress);
    
    // Update dependencies if needed
    const currentWhitelist = await propertyFactory.whitelistContract();
    if (currentWhitelist.toLowerCase() !== whitelistAddress.toLowerCase()) {
      console.log("Updating whitelist address in PropertyFactory...");
      await propertyFactory.setWhitelistContract(whitelistAddress);
    }
  }

  await propertyFactory.waitForDeployment();
  const propertyFactoryAddress = await propertyFactory.getAddress();
  
  // Get implementation and admin addresses
  const propertyFactoryImplAddress = await upgrades.erc1967.getImplementationAddress(propertyFactoryAddress);
  const propertyFactoryAdminAddress = await upgrades.erc1967.getAdminAddress(propertyFactoryAddress);

  console.log("\nPropertyFactory Addresses:");
  console.log("- Proxy:", propertyFactoryAddress);
  console.log("- Implementation:", propertyFactoryImplAddress);
  console.log("- Admin:", propertyFactoryAdminAddress);

  // Deploy or update StakingFactory
  let stakingFactoryAddress = existingAddresses.STAKING_FACTORY_ADDRESS;
  if (!stakingFactoryAddress || await hasCodeChanged("StakingFactory", stakingFactoryAddress)) {
    console.log("\nDeploying new StakingFactory...");
    const StakingFactory = await ethers.getContractFactory("StakingFactory");
    const stakingFactory = await StakingFactory.deploy(
      eurcAddress,      // rewardsToken (EURC)
      deployer.address  // initialOwner
    );
    await stakingFactory.waitForDeployment();
    stakingFactoryAddress = await stakingFactory.getAddress();
    console.log("StakingFactory deployed to:", stakingFactoryAddress);
  } else {
    console.log("\nUsing existing StakingFactory at:", stakingFactoryAddress);
  }

  // Update both .env and .env.local files
  const frontendEnvPath = "C:/Users/thoma/Desktop/WorkspacesToken/blockchain-real-estate/.env.local";
  const contractsEnvPath = path.join(process.cwd(), '.env');
  
  const addresses = {
    NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS: whitelistAddress,
    NEXT_PUBLIC_WHITELIST_IMPLEMENTATION_ADDRESS: whitelistImplAddress,
    NEXT_PUBLIC_WHITELIST_ADMIN_ADDRESS: whitelistAdminAddress,
    NEXT_PUBLIC_PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS: propertyTokenImplAddress,
    NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS: propertyFactoryAddress,
    NEXT_PUBLIC_PROPERTY_FACTORY_IMPLEMENTATION_ADDRESS: propertyFactoryImplAddress,
    NEXT_PUBLIC_PROPERTY_FACTORY_ADMIN_ADDRESS: propertyFactoryAdminAddress,
    NEXT_PUBLIC_EURC_TOKEN_ADDRESS: eurcAddress,
    NEXT_PUBLIC_STAKING_FACTORY_ADDRESS: stakingFactoryAddress
  };

  // Update .env.local in frontend
  updateEnvLocalFile(frontendEnvPath, addresses);
  console.log("\nUpdated frontend environment variables in .env.local");

  // Update .env in contracts directory
  const contractAddresses = {
    WHITELIST_PROXY_ADDRESS: whitelistAddress,
    WHITELIST_IMPLEMENTATION_ADDRESS: whitelistImplAddress,
    WHITELIST_ADMIN_ADDRESS: whitelistAdminAddress,
    PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS: propertyTokenImplAddress,
    PROPERTY_FACTORY_PROXY_ADDRESS: propertyFactoryAddress,
    PROPERTY_FACTORY_IMPLEMENTATION_ADDRESS: propertyFactoryImplAddress,
    PROPERTY_FACTORY_ADMIN_ADDRESS: propertyFactoryAdminAddress,
    EURC_TOKEN_ADDRESS: eurcAddress,
    STAKING_FACTORY_ADDRESS: stakingFactoryAddress
  };

  updateEnvFile(contractsEnvPath, contractAddresses);
  console.log("Updated contract environment variables in .env");

  console.log("\nContract Addresses:");
  console.log("\nWhitelist Addresses:");
  console.log("- Proxy:", whitelistAddress);
  console.log("- Implementation:", whitelistImplAddress);
  console.log("- Admin:", whitelistAdminAddress);
  console.log("\nPropertyFactory Addresses:");
  console.log("- Proxy:", propertyFactoryAddress);
  console.log("- Implementation:", propertyFactoryImplAddress);
  console.log("- Admin:", propertyFactoryAdminAddress);
  console.log("\nStakingFactory:", stakingFactoryAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
