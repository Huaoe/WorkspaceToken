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

  // Get EURC token address
  const eurcAddress = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;
  if (!eurcAddress) {
    throw new Error("EURC token address not found in environment variables");
  }
  console.log("Using EURC token at:", eurcAddress);

  // Deploy StakingFactory implementation
  console.log("Deploying StakingFactory implementation...");
  const StakingFactory = await ethers.getContractFactory("StakingFactory");
  const stakingFactoryImpl = await StakingFactory.deploy();
  await stakingFactoryImpl.waitForDeployment();
  const implAddress = await stakingFactoryImpl.getAddress();
  console.log("StakingFactory implementation deployed to:", implAddress);

  // Create initialization data
  const initData = StakingFactory.interface.encodeFunctionData("initialize", [eurcAddress]);

  // Deploy proxy
  console.log("Deploying proxy...");
  const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
  const proxy = await ERC1967Proxy.deploy(implAddress, initData);
  await proxy.waitForDeployment();
  const proxyAddress = await proxy.getAddress();
  console.log("Proxy deployed to:", proxyAddress);

  // Get StakingFactory instance at proxy address
  const factory = StakingFactory.attach(proxyAddress);
  console.log("StakingFactory initialized with EURC token:", await factory.eurcToken());

  // Update .env.local file
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const updatedContent = envContent.replace(
    /NEXT_PUBLIC_STAKING_FACTORY_ADDRESS=.*/,
    `NEXT_PUBLIC_STAKING_FACTORY_ADDRESS=${proxyAddress}`
  );
  fs.writeFileSync(envLocalPath, updatedContent);
  console.log("Updated .env.local with new factory address");

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("StakingFactory Implementation:", implAddress);
  console.log("StakingFactory Proxy (use this address):", proxyAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
