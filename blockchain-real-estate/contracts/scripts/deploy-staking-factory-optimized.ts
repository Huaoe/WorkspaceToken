import { ethers, upgrades } from "hardhat";
import * as path from "path";
import * as fs from "fs";
import dotenv from "dotenv";

// Load environment variables from parent directory's .env.local
const envPath = path.join(process.cwd(), '..', '.env.local');
dotenv.config({ path: envPath });

async function updateEnvFile(
  factoryAddress: string,
  implAddress: string,
  adminAddress: string
) {
  if (!fs.existsSync(envPath)) {
    console.log(`Creating new ${envPath}`);
  }

  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const lines = content.split('\n');
  let newContent: string[] = [];

  // Process existing lines
  for (const line of lines) {
    // Skip existing StakingFactory lines
    if (line.trim().startsWith('NEXT_PUBLIC_STAKING_FACTORY_')) {
      continue;
    }
    if (line.trim() !== '') {
      newContent.push(line);
    }
  }

  // Add StakingFactory section at the end
  if (newContent[newContent.length - 1] !== '') {
    newContent.push('');
  }
  newContent.push('# StakingFactory Contract');
  newContent.push(`NEXT_PUBLIC_STAKING_FACTORY_ADDRESS=${factoryAddress}`);
  newContent.push(`NEXT_PUBLIC_STAKING_FACTORY_IMPLEMENTATION_ADDRESS=${implAddress}`);
  newContent.push(`NEXT_PUBLIC_STAKING_FACTORY_ADMIN_ADDRESS=${adminAddress}`);
  newContent.push('');

  fs.writeFileSync(envPath, newContent.join('\n'));
  console.log('Updated .env.local with StakingFactory addresses');
}

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying StakingFactory with account:", deployer.address);

    // Get EURC token address from .env.local
    const eurcTokenAddress = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;
    if (!eurcTokenAddress) {
      throw new Error("EURC token address not found in .env.local");
    }

    // Deploy StakingFactory
    console.log("\nDeploying StakingFactory...");
    const StakingFactory = await ethers.getContractFactory("StakingFactory");
    const stakingFactory = await upgrades.deployProxy(
      StakingFactory,
      [eurcTokenAddress],
      {
        initializer: 'initialize',
        kind: 'uups'
      }
    );

    await stakingFactory.waitForDeployment();
    const factoryAddress = await stakingFactory.getAddress();
    const implAddress = await upgrades.erc1967.getImplementationAddress(factoryAddress);
    const adminAddress = await upgrades.erc1967.getAdminAddress(factoryAddress);

    console.log("\nStakingFactory Deployment Details:");
    console.log("- Proxy:", factoryAddress);
    console.log("- Implementation:", implAddress);
    console.log("- Admin:", adminAddress);
    console.log("- EURC Token:", eurcTokenAddress);

    // Update environment file
    await updateEnvFile(factoryAddress, implAddress, adminAddress);

  } catch (error) {
    console.error("Error deploying StakingFactory:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
