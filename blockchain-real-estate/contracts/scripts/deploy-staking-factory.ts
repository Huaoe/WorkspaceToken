import { ethers, upgrades } from "hardhat";
import * as path from "path";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function getEURCAddress() {
  const envPath = path.join(process.cwd(), '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local file not found');
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const eurcMatch = envContent.match(/NEXT_PUBLIC_EURC_TOKEN_ADDRESS=(.+)/);
  
  if (!eurcMatch) {
    throw new Error('NEXT_PUBLIC_EURC_TOKEN_ADDRESS not found in .env.local');
  }

  return eurcMatch[1];
}

async function updateEnvFile(stakingFactoryAddress: string, implAddress: string, adminAddress: string) {
  const envPath = path.join(process.cwd(), '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local file not found');
  }

  let content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  let newContent: string[] = [];
  let stakingSectionAdded = false;

  // Process existing lines
  for (const line of lines) {
    // Skip existing StakingFactory lines
    if (line.trim().startsWith('NEXT_PUBLIC_STAKING_FACTORY_')) {
      continue;
    }
    newContent.push(line);

    // Add StakingFactory section after PropertyFactory
    if (line.trim() === '# Property Factory Contract') {
      stakingSectionAdded = true;
      // Wait for empty line to add StakingFactory section
      continue;
    }
    if (stakingSectionAdded && line.trim() === '') {
      newContent.push('# Staking Factory Contract');
      newContent.push(`NEXT_PUBLIC_STAKING_FACTORY_ADDRESS=${stakingFactoryAddress}`);
      newContent.push(`NEXT_PUBLIC_STAKING_FACTORY_IMPLEMENTATION_ADDRESS=${implAddress}`);
      newContent.push(`NEXT_PUBLIC_STAKING_FACTORY_ADMIN_ADDRESS=${adminAddress}`);
      newContent.push('');
      stakingSectionAdded = false;
    }
  }

  // If we haven't added the section yet, add it at the end
  if (stakingSectionAdded) {
    newContent.push('\n# Staking Factory Contract');
    newContent.push(`NEXT_PUBLIC_STAKING_FACTORY_ADDRESS=${stakingFactoryAddress}`);
    newContent.push(`NEXT_PUBLIC_STAKING_FACTORY_IMPLEMENTATION_ADDRESS=${implAddress}`);
    newContent.push(`NEXT_PUBLIC_STAKING_FACTORY_ADMIN_ADDRESS=${adminAddress}`);
    newContent.push('');
  }

  fs.writeFileSync(envPath, newContent.join('\n'));
  console.log('Updated .env.local with StakingFactory addresses');
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying StakingFactory with account:", deployer.address);

  // Get EURC address from .env.local
  const eurcAddress = await getEURCAddress();
  if (!eurcAddress) {
    throw new Error("EURC token address not found in .env.local. Please deploy EURC token first.");
  }
  console.log("EURC Token Address:", eurcAddress);

  // Deploy StakingFactory
  console.log("\nDeploying StakingFactory...");
  const StakingFactory = await ethers.getContractFactory("StakingFactory");
  const stakingFactory = await upgrades.deployProxy(
    StakingFactory,
    [eurcAddress],
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

  // Update environment file
  await updateEnvFile(stakingFactoryAddress, stakingFactoryImplAddress, stakingFactoryAdminAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
