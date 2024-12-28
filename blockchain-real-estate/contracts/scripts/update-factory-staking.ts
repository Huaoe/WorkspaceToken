import { ethers } from "hardhat";
import dotenv from "dotenv";
import path from "path";

async function main() {
  // Load environment variables
  const envLocalPath = path.join(process.cwd(), '..', '.env.local');
  dotenv.config({ path: envLocalPath });

  const [deployer] = await ethers.getSigners();
  console.log("Updating factory with account:", deployer.address);

  // Get the StakingFactory address
  const factoryAddress = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
  if (!factoryAddress) {
    throw new Error("StakingFactory address not found in environment variables");
  }
  console.log("Using StakingFactory at:", factoryAddress);

  // Get the property token address
  const propertyTokenAddress = "0xFd32f9281c8b5508A900C41DD0606425420FEe81";
  console.log("Using property token at:", propertyTokenAddress);

  // Get the new staking contract address (replace with your deployed proxy address)
  const stakingContractAddress = "REPLACE_WITH_NEW_PROXY_ADDRESS";
  console.log("Using new staking contract at:", stakingContractAddress);

  // Get StakingFactory instance
  const StakingFactory = await ethers.getContractFactory("StakingFactory");
  const factory = StakingFactory.attach(factoryAddress);

  // Update the staking contract info
  console.log("Updating staking contract info...");
  const tx = await factory.updateStakingContract(
    propertyTokenAddress,
    stakingContractAddress,
    1000, // reward rate (adjust as needed)
    31536000 // 1 year in seconds
  );
  await tx.wait();
  console.log("Successfully updated staking contract in factory!");

  // Verify the update
  const info = await factory.stakingContracts(propertyTokenAddress);
  console.log("\nVerification:");
  console.log("Contract address:", info.contractAddress);
  console.log("Reward rate:", info.rewardRate.toString());
  console.log("Duration:", info.duration.toString());
  console.log("Is active:", info.isActive);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
