import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  if (args.length !== 3) {
    throw new Error("Please provide: property token address, reward rate, and duration");
  }

  const propertyTokenAddress = args[0];
  const rewardRate = args[1];
  const duration = args[2];

  const [deployer] = await ethers.getSigners();
  console.log("Creating staking contract with account:", deployer.address);

  // Load environment variables
  const envLocalPath = path.join(process.cwd(), '..', '.env.local');
  if (!fs.existsSync(envLocalPath)) {
    throw new Error(".env.local file not found");
  }
  dotenv.config({ path: envLocalPath });

  // Get contract addresses
  const stakingFactoryAddress = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
  if (!stakingFactoryAddress) {
    throw new Error("Staking factory address not found in environment variables");
  }

  // Get contract instance
  const stakingFactory = await ethers.getContractAt("StakingFactory", stakingFactoryAddress);

  // Check if staking contract already exists
  const stakingInfo = await stakingFactory.stakingContracts(propertyTokenAddress);
  if (stakingInfo.isActive) {
    console.log("Staking contract already exists at:", stakingInfo.contractAddress);
    return;
  }

  // Create new staking contract
  console.log("Creating new staking contract...");
  console.log("Property Token:", propertyTokenAddress);
  console.log("Reward Rate:", rewardRate);
  console.log("Duration:", duration);

  const tx = await stakingFactory.createStakingContract(
    propertyTokenAddress,
    rewardRate,
    duration
  );
  await tx.wait();

  // Get the newly created contract address
  const updatedStakingInfo = await stakingFactory.stakingContracts(propertyTokenAddress);
  console.log("Successfully created staking contract at:", updatedStakingInfo.contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
