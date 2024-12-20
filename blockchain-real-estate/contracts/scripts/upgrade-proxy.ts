import { ethers, upgrades } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

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

async function upgradeContract(contractName: string, proxyAddress: string) {
  console.log(`\nUpgrading ${contractName}...`);
  
  const [deployer] = await ethers.getSigners();
  console.log("Upgrading contracts with account:", deployer.address);

  // Deploy new implementation
  const Contract = await ethers.getContractFactory(contractName);
  console.log("Deploying new implementation...");
  const upgraded = await upgrades.upgradeProxy(proxyAddress, Contract);
  await upgraded.waitForDeployment();

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  console.log(`${contractName} upgraded:`);
  console.log("- Proxy:", proxyAddress);
  console.log("- New Implementation:", implementationAddress);

  return {
    proxy: proxyAddress,
    implementation: implementationAddress
  };
}

async function main() {
  try {
    // Get existing addresses
    const existingAddresses = await getExistingAddresses();
    
    // Default to upgrading the Whitelist contract
    const contractName = "Whitelist";
    console.log(`Upgrading ${contractName} contract...`);

    // Get proxy address
    const proxyKey = `${contractName.toUpperCase()}_PROXY`;
    const proxyAddress = existingAddresses[proxyKey];
    if (!proxyAddress) {
      throw new Error(`No proxy address found for ${contractName}`);
    }

    console.log(`Found proxy address: ${proxyAddress}`);

    // Upgrade the contract
    const addresses = await upgradeContract(contractName, proxyAddress);

    // Update environment files
    const envLocalPath = "C:/Users/thoma/Desktop/WorkspacesToken/blockchain-real-estate/.env.local";
    const envPath = path.join(__dirname, "../.env");

    const updates = {
      [`${contractName.toUpperCase()}_IMPLEMENTATION`]: addresses.implementation
    };

    await updateEnvLocalFile(envLocalPath, updates);
    await updateEnvFile(envPath, updates);

    console.log("\nUpgrade complete!");
  } catch (error) {
    console.error("Error during upgrade:", error);
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
