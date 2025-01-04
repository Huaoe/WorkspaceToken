import { ethers, upgrades, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import { Contract } from "ethers";

// Load environment variables based on network
const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');

// Load environment variables
dotenv.config();

interface ContractConfig {
  envKeyPrefix: string;
  constructorArgs: (...args: any[]) => any[];
  initialize: boolean;
  verify: boolean;
}

async function getExistingAddresses() {
  // Choose env file based on network
  const isLocal = network.name === 'localhost' || network.name === 'hardhat';
  const targetEnvPath = isLocal ? envLocalPath : envPath;
  let addresses: { [key: string]: string } = {};

  if (fs.existsSync(targetEnvPath)) {
    const content = fs.readFileSync(targetEnvPath, 'utf8');
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

  const prefix = isLocal ? 'NEXT_PUBLIC_' : '';
  return {
    WHITELIST_PROXY_ADDRESS: addresses[`${prefix}WHITELIST_PROXY_ADDRESS`] || '',
    PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS: addresses[`${prefix}PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS`] || '',
    PROPERTY_FACTORY_PROXY_ADDRESS: addresses[`${prefix}PROPERTY_FACTORY_PROXY_ADDRESS`] || '',
    EURC_TOKEN_ADDRESS: addresses[`${prefix}EURC_TOKEN_ADDRESS`] || '',
    STAKING_FACTORY_ADDRESS: addresses[`${prefix}STAKING_FACTORY_ADDRESS`] || ''
  };
}

function updateEnvFile(envPath: string, newValues: { [key: string]: string }) {
  // Read existing content
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }

  // Parse existing content
  const envVars: { [key: string]: string } = {};
  content.split('\n').forEach(line => {
    if (line.includes('=')) {
      const [key, value] = line.split('=').map(part => part.trim());
      if (key && !key.startsWith('#')) {
        envVars[key] = value;
      }
    }
  });

  // Merge new values
  Object.assign(envVars, newValues);

  // Create sections
  const sections = {
    network: ['NETWORK'],
    rpc: ['SEPOLIA_RPC_URL', 'PRIVATE_KEY', 'ETHERSCAN_API_KEY'],
    whitelist: ['WHITELIST_PROXY_ADDRESS', 'WHITELIST_IMPLEMENTATION_ADDRESS', 'WHITELIST_ADMIN_ADDRESS'],
    propertyToken: ['PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS'],
    propertyFactory: ['PROPERTY_FACTORY_PROXY_ADDRESS', 'PROPERTY_FACTORY_IMPLEMENTATION_ADDRESS', 'PROPERTY_FACTORY_ADMIN_ADDRESS'],
    eurc: ['EURC_TOKEN_ADDRESS'],
    stakingFactory: ['STAKING_FACTORY_ADDRESS', 'STAKING_FACTORY_IMPLEMENTATION_ADDRESS', 'STAKING_FACTORY_ADMIN_ADDRESS']
  };

  // Build new content
  let newContent = '# Environment Variables\n\n';

  // Add network-specific sections
  const isLocal = network.name === 'localhost' || network.name === 'hardhat';
  const prefix = isLocal ? 'NEXT_PUBLIC_' : '';

  if (!isLocal) {
    // Only include RPC section for non-local networks
    newContent += '# Network Configuration\n';
    sections.rpc.forEach(key => {
      if (envVars[key]) {
        newContent += `${key}=${envVars[key]}\n`;
      }
    });
    newContent += '\n';
  }

  // Add network info
  newContent += '# Deployment Network\n';
  sections.network.forEach(key => {
    if (envVars[key]) {
      newContent += `${key}=${envVars[key]}\n`;
    }
  });
  newContent += '\n';

  // Add contract sections
  const sectionTitles = {
    whitelist: 'Whitelist Contract',
    propertyToken: 'Property Token Contract',
    propertyFactory: 'Property Factory Contract',
    eurc: 'EURC Token Contract',
    stakingFactory: 'Staking Factory Contract'
  };

  Object.entries(sectionTitles).forEach(([section, title]) => {
    newContent += `# ${title}\n`;
    sections[section].forEach(key => {
      if (envVars[key]) {
        newContent += `${prefix}${key}=${envVars[key]}\n`;
      }
    });
    newContent += '\n';
  });

  // Write to file
  fs.writeFileSync(envPath, newContent.trim() + '\n');
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

  // Get current gas price and optimize it
  const gasPrice = await ethers.provider.getFeeData();
  console.log("Current gas price:", ethers.formatUnits(gasPrice.gasPrice || 0, "gwei"), "gwei");

  // Calculate optimal gas price (slightly above base fee)
  const maxFeePerGas = gasPrice.maxFeePerGas || gasPrice.gasPrice;
  const maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas;
  
  // Deploy with optimized gas settings
  const whitelist = await upgrades.deployProxy(
    Whitelist,
    [deployer.address],
    {
      initializer: 'initialize',
      kind: 'transparent',
      initialOwner: deployer.address,
      timeout: 0,
      pollingInterval: 5000,
      txOverrides: {
        gasLimit: 2000000,
        gasPrice: 8000000000  // 8 gwei, matching network config
      }
    }
  );

  console.log("Waiting for deployment...");
  await whitelist.waitForDeployment();
  const deployedAddress = await whitelist.getAddress();
  console.log("Whitelist deployed to:", deployedAddress);
  
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
  // Get network information
  const networkName = network.name;
  const isLocal = networkName === 'localhost' || networkName === 'hardhat';
  const targetEnvPath = isLocal ? envLocalPath : envPath;
  
  console.log(`Deploying to network: ${networkName}`);
  console.log(`Using environment file: ${targetEnvPath}`);
  console.log(`Environment variables loaded:`)
  console.log(`- SEPOLIA_RPC_URL: ${process.env.SEPOLIA_RPC_URL ? '✓' : '✗'}`);
  console.log(`- PRIVATE_KEY: ${process.env.PRIVATE_KEY ? '✓' : '✗'}`);
  console.log(`- ETHERSCAN_API_KEY: ${process.env.ETHERSCAN_API_KEY ? '✓' : '✗'}`);

  // Initialize provider and deployer first
  const provider = ethers.provider;
  const [defaultSigner] = await ethers.getSigners();
  
  // For Sepolia, ensure private key has 0x prefix
  const privateKey = process.env.PRIVATE_KEY || '';
  console.log(`Private key length: ${privateKey.length}`);
  
  const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
  const deployer = networkName === 'sepolia'
    ? new ethers.Wallet(formattedPrivateKey, provider)
    : defaultSigner;

  // Validate environment variables for Sepolia
  if (networkName === 'sepolia') {
    if (!process.env.SEPOLIA_RPC_URL) {
      throw new Error("Missing SEPOLIA_RPC_URL in environment variables");
    }
    if (!process.env.PRIVATE_KEY) {
      throw new Error("Missing PRIVATE_KEY in environment variables");
    }
    if (!process.env.ETHERSCAN_API_KEY) {
      throw new Error("Missing ETHERSCAN_API_KEY in environment variables");
    }

    // Check balance before deployment
    const balance = await provider.getBalance(deployer.address);
    const balanceInEth = Number(ethers.formatEther(balance));
    console.log(`\nDeployer address: ${deployer.address}`);
    console.log(`Deployer balance: ${balanceInEth} ETH`);
    console.log(`Deployer balance (wei): ${balance.toString()}`);

    // Get gas price
    const gasPrice = await provider.getFeeData();
    console.log(`Current gas price: ${ethers.formatUnits(gasPrice.gasPrice || 0, "gwei")} gwei`);
    console.log(`Max fee per gas: ${ethers.formatUnits(gasPrice.maxFeePerGas || 0, "gwei")} gwei`);
    console.log(`Max priority fee: ${ethers.formatUnits(gasPrice.maxPriorityFeePerGas || 0, "gwei")} gwei`);

    // Estimate deployment cost
    const gasLimit = 2000000;
    const estimatedCost = gasLimit * Number(gasPrice.gasPrice);
    console.log(`Estimated deployment cost: ${ethers.formatEther(estimatedCost.toString())} ETH`);
    console.log(`Available balance: ${balanceInEth} ETH`);

    // Estimate minimum required balance (0.1 ETH should be safe for all deployments)
    const MIN_BALANCE = 0.1;
    if (balanceInEth < MIN_BALANCE) {
      throw new Error(`Insufficient balance for deployment. You have ${balanceInEth} ETH but need at least ${MIN_BALANCE} ETH.\n` +
        "Please get some Sepolia ETH from a faucet:\n" +
        "1. Alchemy Sepolia Faucet: https://sepoliafaucet.com/\n" +
        "2. Infura Sepolia Faucet: https://www.infura.io/faucet/sepolia\n" +
        "3. QuickNode Sepolia Faucet: https://faucet.quicknode.com/ethereum/sepolia");
    }
  }

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

  // Update environment file based on network
  const addresses = {
    // Network info
    NETWORK: networkName,
    
    // Contract addresses (prefix will be added in updateEnvFile)
    WHITELIST_PROXY_ADDRESS: whitelistAddress,
    WHITELIST_IMPLEMENTATION_ADDRESS: whitelistImplAddress,
    WHITELIST_ADMIN_ADDRESS: whitelistAdminAddress,
    
    PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS: propertyTokenImplAddress,
    
    PROPERTY_FACTORY_PROXY_ADDRESS: propertyFactoryAddress,
    PROPERTY_FACTORY_IMPLEMENTATION_ADDRESS: propertyFactoryImplAddress,
    PROPERTY_FACTORY_ADMIN_ADDRESS: propertyFactoryAdminAddress,
    
    EURC_TOKEN_ADDRESS: eurcAddress,
    
    STAKING_FACTORY_ADDRESS: stakingFactoryAddress,
    STAKING_FACTORY_IMPLEMENTATION_ADDRESS: stakingFactoryImplAddress,
    STAKING_FACTORY_ADMIN_ADDRESS: stakingFactoryAdminAddress
  };

  // Update the appropriate env file
  updateEnvFile(targetEnvPath, addresses);
  console.log(`\nUpdated environment variables in ${targetEnvPath}`);

  console.log(`\nDeployment completed on network: ${networkName}`);
  console.log("\nContract Addresses:");
  console.log(`Network: ${networkName}`);
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

  // If on Sepolia, wait for deployment confirmation
  if (networkName === 'sepolia') {
    console.log("\nWaiting for deployments to be confirmed on Sepolia...");
    // Wait for additional block confirmations on Sepolia
    await Promise.all([
      whitelist.deployTransaction?.wait(3),
      propertyFactory.deployTransaction?.wait(3),
      stakingFactory.deployTransaction?.wait(3)
    ]);
    console.log("All deployments confirmed!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in deployment:");
    console.error(error);
    process.exit(1);
  });
