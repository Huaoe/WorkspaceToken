import { ethers } from "hardhat";
import dotenv from "dotenv";
import path from "path";

async function main() {
  // Load environment variables
  const envLocalPath = path.join(process.cwd(), '..', '.env.local');
  dotenv.config({ path: envLocalPath });

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Get the EURC token address
  const eurcTokenAddress = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;
  if (!eurcTokenAddress) {
    throw new Error("EURC token address not found in environment variables");
  }
  console.log("Using EURC token at:", eurcTokenAddress);

  // Get the property token address
  const propertyTokenAddress = "0xFd32f9281c8b5508A900C41DD0606425420FEe81";
  console.log("Using property token at:", propertyTokenAddress);

  // Deploy StakingRewardsV2 implementation
  console.log("Deploying StakingRewardsV2 implementation...");
  const StakingRewardsV2 = await ethers.getContractFactory("StakingRewardsV2");
  const stakingRewardsV2 = await StakingRewardsV2.deploy();
  await stakingRewardsV2.waitForDeployment();
  const stakingRewardsV2Address = await stakingRewardsV2.getAddress();
  console.log("StakingRewardsV2 implementation deployed to:", stakingRewardsV2Address);

  // Create initialization data
  const initData = StakingRewardsV2.interface.encodeFunctionData("initialize", [
    propertyTokenAddress,
    eurcTokenAddress,
    31536000 // 1 year in seconds
  ]);

  // Deploy proxy
  console.log("Deploying proxy...");
  const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
  const proxy = await ERC1967Proxy.deploy(stakingRewardsV2Address, initData);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  console.log("Proxy deployed to:", proxyAddress);

  // Get StakingRewardsV2 instance at proxy address
  const stakingRewards = StakingRewardsV2.attach(proxyAddress);
  console.log("StakingRewardsV2 initialized with:");
  console.log("- Property Token:", await stakingRewards.stakingToken());
  console.log("- EURC Token:", await stakingRewards.rewardToken());
  console.log("- Duration:", await stakingRewards.duration());

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("StakingRewardsV2 Implementation:", stakingRewardsV2Address);
  console.log("Proxy (use this address):", proxyAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
