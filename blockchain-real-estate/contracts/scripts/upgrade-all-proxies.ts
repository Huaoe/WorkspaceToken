import { ethers, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Map of environment variable names to actual contract names
const CONTRACT_NAMES: { [key: string]: string } = {
  "WHITELIST": "Whitelist",
  "PROPERTY_FACTORY": "PropertyFactory",
  "PROPERTY_TOKEN": "PropertyToken",
  "STAKING_FACTORY": "StakingFactory",
  "STAKING_REWARDS": "StakingRewards",
  "EURC": "MockEURC"
};

// List of all upgradeable contracts (using env variable names)
const UPGRADEABLE_CONTRACTS = [
  "WHITELIST",
  "PROPERTY_FACTORY",
  "PROPERTY_TOKEN",
  "STAKING_FACTORY",
  "STAKING_REWARDS"
];

// Optional contracts that might not be deployed yet
const OPTIONAL_CONTRACTS = [
  "EURC"  // MockEURC
];

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

async function updateEnvLocalFile(envPath: string, newValues: { [key: string]: string }) {
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }

  const lines = content.split('\n');
  const updatedLines = lines.map(line => {
    for (const [key, value] of Object.entries(newValues)) {
      if (line.startsWith(`NEXT_PUBLIC_${key}_ADDRESS=`)) {
        return `NEXT_PUBLIC_${key}_ADDRESS=${value}`;
      }
    }
    return line;
  });

  fs.writeFileSync(envPath, updatedLines.join('\n'));
  console.log(`Updated ${envPath}`);
}

async function updateEnvFile(envPath: string, newValues: { [key: string]: string }) {
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }

  const lines = content.split('\n');
  const updatedLines = lines.map(line => {
    for (const [key, value] of Object.entries(newValues)) {
      if (line.startsWith(`${key}_ADDRESS=`)) {
        return `${key}_ADDRESS=${value}`;
      }
    }
    return line;
  });

  fs.writeFileSync(envPath, updatedLines.join('\n'));
  console.log(`Updated ${envPath}`);
}

async function upgradeContract(envName: string, proxyAddress: string) {
  console.log(`\nUpgrading ${envName}...`);
  
  const contractName = CONTRACT_NAMES[envName];
  if (!contractName) {
    console.log(`No contract name mapping found for ${envName}`);
    return null;
  }
  
  const [deployer] = await ethers.getSigners();
  console.log("Upgrading contracts with account:", deployer.address);

  try {
    // Deploy new implementation
    const Contract = await ethers.getContractFactory(contractName);
    console.log(`Deploying new implementation for ${contractName}...`);
    
    // Upgrade with transparent proxy kind
    const upgraded = await upgrades.upgradeProxy(proxyAddress, Contract, {
      kind: 'transparent'
    });
    await upgraded.waitForDeployment();

    const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log(`${contractName} upgraded:`);
    console.log("- Proxy:", proxyAddress);
    console.log("- New Implementation:", implementationAddress);

    return {
      proxy: proxyAddress,
      implementation: implementationAddress
    };
  } catch (error) {
    console.error(`Error upgrading ${contractName}:`, error);
    return null;
  }
}

async function main() {
  try {
    // Get existing addresses
    const existingAddresses = await getExistingAddresses();
    const updates: { [key: string]: string } = {};
    
    console.log("Starting upgrade of all proxy contracts...\n");
    console.log("Found addresses in .env.local:", existingAddresses);

    // Upgrade each contract
    for (const contractName of [...UPGRADEABLE_CONTRACTS, ...OPTIONAL_CONTRACTS]) {
      // Try different key formats
      const proxyKey = `${contractName}_PROXY`;
      const factoryKey = `${contractName}_FACTORY_PROXY`;
      const tokenKey = `${contractName}_TOKEN_PROXY`;
      
      // Find the correct address
      let proxyAddress = existingAddresses[proxyKey] || 
                        existingAddresses[factoryKey] || 
                        existingAddresses[tokenKey];
      
      if (!proxyAddress) {
        console.log(`Skipping ${contractName}: No proxy address found (checked keys: ${proxyKey}, ${factoryKey}, ${tokenKey})`);
        continue;
      }

      const result = await upgradeContract(contractName, proxyAddress);
      if (result) {
        updates[`${contractName}_IMPLEMENTATION`] = result.implementation;
      }
    }

    if (Object.keys(updates).length > 0) {
      // Update environment files
      const envLocalPath = "C:/Users/thoma/Desktop/WorkspacesToken/blockchain-real-estate/.env.local";
      const envPath = path.join(__dirname, "../.env");

      await updateEnvLocalFile(envLocalPath, updates);
      await updateEnvFile(envPath, updates);

      console.log("\nAll upgrades complete!");
    } else {
      console.log("\nNo contracts were upgraded successfully.");
    }
  } catch (error) {
    console.error("Error during upgrade process:", error);
    throw error;
  }
}

// Execute the script
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
