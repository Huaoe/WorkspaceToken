import { ethers } from "hardhat";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

async function main() {
  // Load environment variables
  const envLocalPath = path.join(process.cwd(), '..', '.env.local');
  dotenv.config({ path: envLocalPath });

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy EURC Token if needed
  let eurcAddress = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;
  if (!eurcAddress) {
    console.log("Deploying new EURC token...");
    const MockEURC = await ethers.getContractFactory("MockEURCUpgradeable");
    const mockEURC = await MockEURC.deploy();
    await mockEURC.waitForDeployment();
    eurcAddress = await mockEURC.getAddress();
    console.log("EURC token deployed to:", eurcAddress);
  } else {
    console.log("Using existing EURC token at:", eurcAddress);
  }

  // Deploy StakingRewardsV2 implementation
  console.log("Deploying StakingRewardsV2 implementation...");
  const StakingRewardsV2 = await ethers.getContractFactory("StakingRewardsV2");
  const stakingRewardsV2 = await StakingRewardsV2.deploy();
  await stakingRewardsV2.waitForDeployment();
  console.log("StakingRewardsV2 implementation deployed to:", await stakingRewardsV2.getAddress());

  // Deploy StakingFactory implementation
  console.log("Deploying StakingFactory implementation...");
  const StakingFactory = await ethers.getContractFactory("StakingFactory");
  const stakingFactoryImpl = await StakingFactory.deploy();
  await stakingFactoryImpl.waitForDeployment();
  console.log("StakingFactory implementation deployed to:", await stakingFactoryImpl.getAddress());

  // Create initialization data for StakingFactory
  const initData = StakingFactory.interface.encodeFunctionData("initialize", [eurcAddress]);

  // Deploy ERC1967Proxy for StakingFactory
  console.log("Deploying StakingFactory proxy...");
  const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
  const stakingFactoryProxy = await ERC1967Proxy.deploy(
    await stakingFactoryImpl.getAddress(),
    initData
  );
  await stakingFactoryProxy.waitForDeployment();
  const proxyAddress = await stakingFactoryProxy.getAddress();
  console.log("StakingFactory proxy deployed to:", proxyAddress);

  // Get StakingFactory instance at proxy address
  const stakingFactory = StakingFactory.attach(proxyAddress);
  console.log("StakingFactory initialized with EURC token:", eurcAddress);

  // Verify initialization
  const factoryEurcToken = await stakingFactory.eurcToken();
  console.log("Verified EURC token address in factory:", factoryEurcToken);

  // Update .env.local file
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const updatedContent = envContent
    .replace(
      /NEXT_PUBLIC_STAKING_FACTORY_ADDRESS=.*/,
      `NEXT_PUBLIC_STAKING_FACTORY_ADDRESS=${proxyAddress}`
    );
  fs.writeFileSync(envLocalPath, updatedContent);
  console.log("Updated .env.local with new contract addresses");

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("EURC Token:", eurcAddress);
  console.log("StakingFactory Proxy:", proxyAddress);
  console.log("StakingRewardsV2 Implementation:", await stakingRewardsV2.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
