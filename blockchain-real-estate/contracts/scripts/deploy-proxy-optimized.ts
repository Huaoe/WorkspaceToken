import { ethers, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import { Contract } from "ethers";

// Load environment variables
dotenv.config();

async function getExistingAddresses() {
  const envLocalPath = path.join(process.cwd(), '..', '.env.local');
  let addresses: { [key: string]: string } = {};

  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.includes('=')) {
        const [key, value] = line.split('=').map(part => part.trim());
        if (key && value) {
          addresses[key] = value;
        }
      }
    }
  }

  return {
    WHITELIST_PROXY_ADDRESS: addresses.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS || '',
    PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS: addresses.NEXT_PUBLIC_PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS || '',
    PROPERTY_FACTORY_PROXY_ADDRESS: addresses.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS || '',
    EURC_TOKEN_ADDRESS: addresses.NEXT_PUBLIC_EURC_TOKEN_ADDRESS || '',
    STAKING_FACTORY_ADDRESS: addresses.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS || ''
  };
}

function updateEnvFile(envPath: string, newValues: { [key: string]: string }) {
  if (!fs.existsSync(envPath)) {
    console.log(`Creating new ${envPath}`);
  }

  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const lines = content.split('\n');
  let newContent: string[] = [];
  let hasContractSection = false;

  // Keep non-contract related environment variables
  for (const line of lines) {
    if (!line.includes('_ADDRESS') && !line.includes('# Smart Contract')) {
      newContent.push(line);
    }
  }

  // Add contract addresses section
  if (!newContent[newContent.length - 1]?.trim()) {
    newContent.push('');
  }

  newContent.push('# Smart Contract Addresses\n');
  
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
  newContent.push(`NEXT_PUBLIC_STAKING_FACTORY_ADDRESS=${newValues.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS}`);
  newContent.push(`NEXT_PUBLIC_STAKING_FACTORY_IMPLEMENTATION_ADDRESS=${newValues.NEXT_PUBLIC_STAKING_FACTORY_IMPLEMENTATION_ADDRESS}`);
  newContent.push(`NEXT_PUBLIC_STAKING_FACTORY_ADMIN_ADDRESS=${newValues.NEXT_PUBLIC_STAKING_FACTORY_ADMIN_ADDRESS}\n`);

  fs.writeFileSync(envPath, newContent.join('\n'));
  console.log(`Updated ${envPath}`);
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

async function deployContract(contractName: string, ...args: any[]) {
  const contractConfigs: { [key: string]: ContractConfig } = {
    Whitelist: {
      envKeyPrefix: "WHITELIST",
      constructorArgs: () => [args[0]],
      initialize: true,
      verify: true
    },
    PropertyToken: {
      envKeyPrefix: "PROPERTY_TOKEN",
      constructorArgs: () => [],
      initialize: false,
      verify: true
    },
    PropertyFactory: {
      envKeyPrefix: "PROPERTY_FACTORY",
      constructorArgs: (propertyTokenImplAddress: string, eurcTokenAddress: string, deployerAddress: string, treasuryAddress: string, whitelistAddress: string) => [
        propertyTokenImplAddress,
        "PT",
        eurcTokenAddress,
        deployerAddress,
        treasuryAddress,
        whitelistAddress,
      ],
      initialize: true,
      verify: true
    },
    StakingFactory: {
      envKeyPrefix: "STAKING_FACTORY",
      constructorArgs: (eurcTokenAddress: string, propertyFactoryAddress: string) => [eurcTokenAddress, propertyFactoryAddress],
      initialize: true,
      verify: true
    },
  };

  const contractConfig = contractConfigs[contractName];
  if (!contractConfig) {
    throw new Error(`Unknown contract: ${contractName}`);
  }

  let constructorArgs = contractConfig.constructorArgs(...args);

  // Special handling for StakingFactory
  if (contractName === "StakingFactory") {
    const eurcTokenAddress = args[0];
    const propertyFactoryAddress = args[1];
    if (!eurcTokenAddress || !ethers.isAddress(eurcTokenAddress)) {
      throw new Error("Invalid or missing EURC token address for StakingFactory deployment");
    }
    if (!propertyFactoryAddress || !ethers.isAddress(propertyFactoryAddress)) {
      throw new Error("Invalid or missing PropertyFactory address for StakingFactory deployment");
    }
    constructorArgs = contractConfig.constructorArgs(eurcTokenAddress, propertyFactoryAddress);
  }

  console.log(`\nDeploying ${contractName}...`);
  const Contract = await ethers.getContractFactory(contractName);
  let contract;
  if (contractConfig.initialize) {
    contract = await upgrades.deployProxy(
      Contract,
      constructorArgs,
      {
        initializer: 'initialize',
        kind: 'transparent',
        initialOwner: args[0]
      }
    );
  } else {
    contract = await Contract.deploy(...constructorArgs);
  }
  await contract.waitForDeployment();
  return contract;
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
    console.log("\nDeploying PropertyFactory...");
    const PropertyFactory = await ethers.getContractFactory("PropertyFactory");
    propertyFactory = await upgrades.deployProxy(
      PropertyFactory,
      [
        deployer.address,    // Validator
        whitelistAddress,    // Whitelist contract
        eurcAddress         // EURC token address
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

    // Update validator if needed
    const currentValidator = await propertyFactory.validator();
    if (currentValidator.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("Updating validator address in PropertyFactory...");
      await propertyFactory.setValidator(deployer.address);
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
  console.log("- Admin:", propertyFactoryAdminAddress);

  // Deploy StakingFactory
  console.log("\nDeploying StakingFactory...");
  const StakingFactory = await ethers.getContractFactory("StakingFactory");
  const stakingFactory = await upgrades.deployProxy(
    StakingFactory,
    [eurcAddress], // Only pass EURC token address
    {
      initializer: 'initialize',
      kind: 'transparent',
      initialOwner: deployer.address
    }
  );

  await stakingFactory.waitForDeployment();
  const stakingFactoryAddress = await stakingFactory.getAddress();
  const stakingFactoryImplAddress = await upgrades.erc1967.getImplementationAddress(stakingFactoryAddress);
  const stakingFactoryAdminAddress = await upgrades.erc1967.getAdminAddress(stakingFactoryAddress);

  console.log("\nStakingFactory Addresses:");
  console.log("- Proxy:", stakingFactoryAddress);
  console.log("- Implementation:", stakingFactoryImplAddress);
  console.log("- Admin:", stakingFactoryAdminAddress);

  // Update only .env.local file
  const frontendEnvPath = path.join(process.cwd(), '..', '.env.local');
  
  const addresses = {
    // Whitelist addresses
    NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS: whitelistAddress,
    NEXT_PUBLIC_WHITELIST_IMPLEMENTATION_ADDRESS: whitelistImplAddress,
    NEXT_PUBLIC_WHITELIST_ADMIN_ADDRESS: whitelistAdminAddress,
    
    // Property Token address
    NEXT_PUBLIC_PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS: propertyTokenImplAddress,
    
    // Property Factory addresses
    NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS: propertyFactoryAddress,
    NEXT_PUBLIC_PROPERTY_FACTORY_IMPLEMENTATION_ADDRESS: propertyFactoryImplAddress,
    NEXT_PUBLIC_PROPERTY_FACTORY_ADMIN_ADDRESS: propertyFactoryAdminAddress,
    
    // EURC Token address
    NEXT_PUBLIC_EURC_TOKEN_ADDRESS: eurcAddress,
    
    // StakingFactory addresses
    NEXT_PUBLIC_STAKING_FACTORY_ADDRESS: stakingFactoryAddress,
    NEXT_PUBLIC_STAKING_FACTORY_IMPLEMENTATION_ADDRESS: stakingFactoryImplAddress,
    NEXT_PUBLIC_STAKING_FACTORY_ADMIN_ADDRESS: stakingFactoryAdminAddress
  };

  // Update only .env.local
  updateEnvFile(frontendEnvPath, addresses);
  console.log("\nUpdated environment variables in .env.local");

  console.log("\nContract Addresses:");
  console.log("\nWhitelist Addresses:");
  console.log("- Proxy:", whitelistAddress);
  console.log("- Implementation:", whitelistImplAddress);
  console.log("- Admin:", whitelistAdminAddress);
  console.log("\nPropertyFactory Addresses:");
  console.log("- Proxy:", propertyFactoryAddress);
  console.log("- Implementation:", propertyFactoryImplAddress);
  console.log("- Admin:", propertyFactoryAdminAddress);
  console.log("\nStakingFactory Addresses:");
  console.log("- Proxy:", stakingFactoryAddress);
  console.log("- Implementation:", stakingFactoryImplAddress);
  console.log("- Admin:", stakingFactoryAdminAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
