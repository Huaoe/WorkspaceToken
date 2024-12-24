import { ethers, upgrades } from "hardhat";
import * as path from "path";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function updateEnvFile(eurcAddress: string, implAddress: string, adminAddress: string) {
  const envPath = path.join(process.cwd(), '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log(`Creating new ${envPath}`);
  }

  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const lines = content.split('\n');
  let newContent: string[] = [];

  // Process existing lines
  for (const line of lines) {
    // Skip existing EURC lines
    if (line.trim().startsWith('NEXT_PUBLIC_EURC_')) {
      continue;
    }
    if (line.trim() !== '') {
      newContent.push(line);
    }
  }

  // Add EURC section at the end
  if (newContent[newContent.length - 1] !== '') {
    newContent.push('');
  }
  newContent.push('# EURC Token Contract');
  newContent.push(`NEXT_PUBLIC_EURC_TOKEN_ADDRESS=${eurcAddress}`);
  newContent.push(`NEXT_PUBLIC_EURC_IMPLEMENTATION_ADDRESS=${implAddress}`);
  newContent.push(`NEXT_PUBLIC_EURC_ADMIN_ADDRESS=${adminAddress}`);
  newContent.push('');

  try {
    fs.writeFileSync(envPath, newContent.join('\n'));
    console.log('Updated .env.local with EURC addresses');
  } catch (error) {
    console.error(`Error writing to .env.local: ${error}`);
    throw error;
  }
}

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying MockEURC with account:", deployer.address);

    // Deploy MockEURC
    console.log("\nDeploying MockEURC...");
    const MockEURC = await ethers.getContractFactory("MockEURCUpgradeable");
    const mockEURC = await upgrades.deployProxy(MockEURC, [deployer.address], {
      initializer: "initialize",
      kind: 'transparent',
      initialOwner: deployer.address
    });

    await mockEURC.waitForDeployment();
    const eurcAddress = await mockEURC.getAddress();
    const eurcImplAddress = await upgrades.erc1967.getImplementationAddress(eurcAddress);
    const eurcAdminAddress = await upgrades.erc1967.getAdminAddress(eurcAddress);

    console.log("\nMockEURC Addresses:");
    console.log("- Proxy:", eurcAddress);
    console.log("- Implementation:", eurcImplAddress);
    console.log("- Admin:", eurcAdminAddress);

    // Update environment file
    await updateEnvFile(eurcAddress, eurcImplAddress, eurcAdminAddress);
  } catch (error) {
    console.error(`Error deploying MockEURC: ${error}`);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
