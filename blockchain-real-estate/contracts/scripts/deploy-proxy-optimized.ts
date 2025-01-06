import { ethers, upgrades, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

// Load environment variables based on network
const rootDir = path.resolve(__dirname, '../../');
const envPath = path.join(rootDir, '.env');
const envLocalPath = path.join(rootDir, '.env.local');

console.log('Root directory:', rootDir);
console.log('Env path:', envPath);
console.log('Env local path:', envLocalPath);

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
  console.log(`\nUpdating environment file: ${envPath}`);
  
  // Read existing content
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
    console.log('Existing file found');
  } else {
    console.log('Creating new file');
  }

  // Parse existing content
  const envVars: { [key: string]: string } = {};
  content.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('='); // Handle values that might contain '='
      if (key) {
        envVars[key.trim()] = value.trim();
      }
    }
  });

  // Merge new values
  Object.assign(envVars, newValues);

  // Create new content
  let newContent = '# Environment Variables\n\n';

  // Add all variables
  Object.entries(envVars).forEach(([key, value]) => {
    newContent += `${key}=${value}\n`;
  });

  // Ensure directory exists
  const dir = path.dirname(envPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write to file
  try {
    fs.writeFileSync(envPath, newContent);
    console.log(`Successfully updated ${envPath}`);
  } catch (error) {
    console.error(`Error writing to ${envPath}:`, error);
    throw error;
  }
}

async function hasCodeChanged(contractName: string, existingAddress: string) {
  if (!existingAddress) return true;
  
  try {
    const provider = ethers.provider;
    const code = await provider.getCode(existingAddress);
    return code === '0x' || code === '0x0';
  } catch (error) {
    console.error(`Error checking code for ${contractName}:`, error);
    return true;
  }
}

async function deployOrGetWhitelist(deployer: any, existingAddress: string) {
  if (!existingAddress || await hasCodeChanged("Whitelist", existingAddress)) {
    console.log("\nDeploying new Whitelist...");
    
    // Get current gas prices
    const feeData = await ethers.provider.getFeeData();
    console.log("Gas settings:");
    console.log(`- Max fee per gas: ${ethers.formatUnits(feeData.maxFeePerGas || 0, "gwei")} gwei`);
    console.log(`- Max priority fee: ${ethers.formatUnits(feeData.maxPriorityFeePerGas || 0, "gwei")} gwei`);

    // Deploy with proper gas settings
    const Whitelist = await ethers.getContractFactory("Whitelist");
    const whitelist = await upgrades.deployProxy(
      Whitelist,
      [deployer.address], // Pass deployer address as the initial owner
      {
        initializer: 'initialize',
        kind: 'transparent',
        initialOwner: deployer.address,
        timeout: 0,
        pollingInterval: 5000,
        useDeployedImplementation: false,
        txOverrides: {
          maxFeePerGas: feeData.maxFeePerGas,
          maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
        }
      }
    );

    await whitelist.waitForDeployment();
    console.log("Whitelist deployed to:", await whitelist.getAddress());
    return whitelist;
  } else {
    console.log("\nUsing existing Whitelist at:", existingAddress);
    return await ethers.getContractAt("Whitelist", existingAddress);
  }
}

async function deployContract(contractName: string, ...args: any[]) {
  const Contract = await ethers.getContractFactory(contractName);
  const contract = await Contract.deploy(...args);
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

  // Get current gas prices
  const feeData = await provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas || ethers.parseUnits("30", "gwei");
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits("1.5", "gwei");

  // Ensure maxPriorityFeePerGas is not greater than maxFeePerGas
  const adjustedMaxPriorityFeePerGas = BigInt(maxPriorityFeePerGas) > BigInt(maxFeePerGas)
    ? BigInt(maxFeePerGas) - BigInt(ethers.parseUnits("0.1", "gwei"))
    : BigInt(maxPriorityFeePerGas);

  console.log("\nGas settings:");
  console.log(`- Max fee per gas: ${ethers.formatUnits(maxFeePerGas, "gwei")} gwei`);
  console.log(`- Max priority fee: ${ethers.formatUnits(adjustedMaxPriorityFeePerGas, "gwei")} gwei`);

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

    // Estimate deployment cost
    const gasLimit = 2000000;
    const estimatedCost = gasLimit * Number(maxFeePerGas);
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

  // Deploy or get Whitelist with proper gas settings
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
    const tx = await whitelist.addToWhitelist(deployer.address, {
      maxFeePerGas,
      maxPriorityFeePerGas: adjustedMaxPriorityFeePerGas
    });
    await tx.wait();
    console.log("Deployer added to whitelist");
  } else {
    console.log("\nDeployer is already whitelisted");
  }

  // Get or deploy EURC
  let eurcAddress = existingAddresses.EURC_TOKEN_ADDRESS;
  if (!eurcAddress || await hasCodeChanged("MockEURC", eurcAddress)) {
    console.log("\nDeploying new MockEURC...");
    const MockEURC = await ethers.getContractFactory("MockEURC");
    const mockEURC = await MockEURC.deploy(
      deployer.address,
      {
        maxFeePerGas,
        maxPriorityFeePerGas: adjustedMaxPriorityFeePerGas
      }
    );
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
    const propertyTokenImpl = await PropertyToken.deploy({
      maxFeePerGas,
      maxPriorityFeePerGas: adjustedMaxPriorityFeePerGas
    });
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
        initialOwner: deployer.address,
        txOverrides: {
          maxFeePerGas,
          maxPriorityFeePerGas: adjustedMaxPriorityFeePerGas
        }
      }
    );
  } else {
    console.log("\nUpdating existing PropertyFactory...");
    propertyFactory = await ethers.getContractAt("PropertyFactory", existingFactoryAddress);
    
    // Update dependencies if needed
    const currentWhitelist = await propertyFactory.whitelistContract();
    if (currentWhitelist.toLowerCase() !== whitelistAddress.toLowerCase()) {
      console.log("Updating whitelist address in PropertyFactory...");
      const tx = await propertyFactory.setWhitelistContract(whitelistAddress, {
        maxFeePerGas,
        maxPriorityFeePerGas: adjustedMaxPriorityFeePerGas
      });
      await tx.wait();
    }

    // Update validator if needed
    const currentValidator = await propertyFactory.validator();
    if (currentValidator.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("Updating validator address in PropertyFactory...");
      const tx = await propertyFactory.setValidator(deployer.address, {
        maxFeePerGas,
        maxPriorityFeePerGas: adjustedMaxPriorityFeePerGas
      });
      await tx.wait();
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

  // Deploy StakingFactory with proper gas settings
  console.log("\nDeploying StakingFactory...");
  const StakingFactory = await ethers.getContractFactory("StakingFactory");
  const stakingFactory = await upgrades.deployProxy(
    StakingFactory,
    [eurcAddress], // Only pass EURC token address
    {
      initializer: 'initialize',
      kind: 'transparent',
      initialOwner: deployer.address,
      txOverrides: {
        maxFeePerGas,
        maxPriorityFeePerGas: adjustedMaxPriorityFeePerGas
      }
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

  // Update environment file
  const prefix = isLocal ? 'NEXT_PUBLIC_' : '';
  const addresses = {
    [`${prefix}WHITELIST_PROXY_ADDRESS`]: whitelistAddress,
    [`${prefix}WHITELIST_IMPLEMENTATION_ADDRESS`]: whitelistImplAddress,
    [`${prefix}WHITELIST_ADMIN_ADDRESS`]: whitelistAdminAddress,
    [`${prefix}PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS`]: propertyTokenImplAddress,
    [`${prefix}PROPERTY_FACTORY_PROXY_ADDRESS`]: propertyFactoryAddress,
    [`${prefix}PROPERTY_FACTORY_IMPLEMENTATION_ADDRESS`]: propertyFactoryImplAddress,
    [`${prefix}PROPERTY_FACTORY_ADMIN_ADDRESS`]: propertyFactoryAdminAddress,
    [`${prefix}EURC_TOKEN_ADDRESS`]: eurcAddress,
    [`${prefix}STAKING_FACTORY_ADDRESS`]: stakingFactoryAddress,
    [`${prefix}STAKING_FACTORY_IMPLEMENTATION_ADDRESS`]: stakingFactoryImplAddress,
    [`${prefix}STAKING_FACTORY_ADMIN_ADDRESS`]: stakingFactoryAdminAddress
  };

  updateEnvFile(targetEnvPath, addresses);
  console.log("\nEnvironment file updated successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in deployment:");
    console.error(error);
    process.exit(1);
  });
