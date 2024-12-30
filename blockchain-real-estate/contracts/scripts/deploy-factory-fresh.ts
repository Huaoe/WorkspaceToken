import { ethers, upgrades } from "hardhat";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Get existing EURC token address from .env.local
  const envPath = path.join(process.cwd(), '..', '.env.local');
  let eurcTokenAddress: string;

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/NEXT_PUBLIC_EURC_TOKEN_ADDRESS="([^"]+)"/);
    if (match) {
      eurcTokenAddress = match[1];
      console.log("\nUsing existing EURC Token at:", eurcTokenAddress);
    } else {
      throw new Error("EURC token address not found in .env.local");
    }
  } else {
    throw new Error(".env.local file not found");
  }

  // Deploy StakingFactory with proxy
  console.log("\nDeploying StakingFactory...");
  const StakingFactory = await ethers.getContractFactory("StakingFactory");
  
  // Deploy proxy
  const stakingFactory = await upgrades.deployProxy(StakingFactory, [eurcTokenAddress], {
    kind: 'uups',
    initializer: 'initialize',
  });
  await stakingFactory.waitForDeployment();
  const factoryAddress = await stakingFactory.getAddress();
  console.log("StakingFactory proxy deployed to:", factoryAddress);

  // Get implementation address
  const implAddress = await upgrades.erc1967.getImplementationAddress(factoryAddress);
  console.log("StakingFactory implementation deployed to:", implAddress);

  // Update .env.local file - only add StakingFactory address
  let envContent = '';
  
  // Read existing content
  envContent = fs.readFileSync(envPath, 'utf8');
  // Remove any existing entries for StakingFactory
  envContent = envContent
    .split('\n')
    .filter(line => !line.startsWith('NEXT_PUBLIC_STAKING_FACTORY_ADDRESS='))
    .join('\n');

  // Add new StakingFactory address
  const finalContent = envContent.trim() + '\n' + `NEXT_PUBLIC_STAKING_FACTORY_ADDRESS="${factoryAddress}"`;

  fs.writeFileSync(envPath, finalContent);
  console.log("\nUpdated .env.local with new StakingFactory address");

  // Verify the deployment
  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("Using EURC Token:", eurcTokenAddress);
  console.log("StakingFactory Proxy:", factoryAddress);
  console.log("StakingFactory Implementation:", implAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
