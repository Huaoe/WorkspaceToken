import { ethers, upgrades } from "hardhat";
import dotenv from "dotenv";
import path from "path";

async function main() {
  // Load environment variables
  const envLocalPath = path.join(process.cwd(), '..', '.env.local');
  dotenv.config({ path: envLocalPath });

  const [deployer] = await ethers.getSigners();
  console.log("Upgrading StakingRewardsV2 implementation with account:", deployer.address);

  // Get factory address from environment
  const factoryAddress = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
  if (!factoryAddress) {
    throw new Error("StakingFactory address not found in environment variables");
  }

  console.log("StakingFactory proxy address:", factoryAddress);

  // Get current implementation address
  const currentImpl = await upgrades.erc1967.getImplementationAddress(factoryAddress);
  console.log("Current implementation:", currentImpl);

  // Prepare new implementation
  const StakingFactory = await ethers.getContractFactory("StakingFactory");
  console.log("Upgrading implementation...");
  
  // Upgrade the implementation
  const upgradedFactory = await upgrades.upgradeProxy(factoryAddress, StakingFactory);
  await upgradedFactory.waitForDeployment();
  
  // Get new implementation address
  const newImpl = await upgrades.erc1967.getImplementationAddress(factoryAddress);
  console.log("New implementation:", newImpl);

  // Get all staking contracts that were upgraded
  const allStakingContracts = await upgradedFactory.getAllStakingContracts();
  console.log("\nStaking Contracts:");
  console.log("------------------------");
  for (const contract of allStakingContracts) {
    console.log(contract);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
