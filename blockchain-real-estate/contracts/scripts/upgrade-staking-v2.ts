import { ethers } from "hardhat";
import dotenv from "dotenv";
import path from "path";

async function main() {
  // Load environment variables
  const envLocalPath = path.join(process.cwd(), '..', '.env.local');
  dotenv.config({ path: envLocalPath });

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy StakingRewardsV2 implementation
  const StakingRewardsV2 = await ethers.getContractFactory("StakingRewardsV2");
  const stakingRewardsV2 = await StakingRewardsV2.deploy();
  await stakingRewardsV2.waitForDeployment();
  console.log("StakingRewardsV2 implementation deployed to:", await stakingRewardsV2.getAddress());

  // Deploy StakingFactory implementation
  const StakingFactory = await ethers.getContractFactory("StakingFactory");
  const stakingFactoryImpl = await StakingFactory.deploy();
  await stakingFactoryImpl.waitForDeployment();
  console.log("StakingFactory implementation deployed to:", await stakingFactoryImpl.getAddress());

  // Get EURC token address
  const eurcAddress = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;
  if (!eurcAddress) {
    throw new Error("EURC token address not found in environment variables");
  }

  // Create initialization data for StakingFactory
  const initData = StakingFactory.interface.encodeFunctionData("initialize", [eurcAddress]);

  // Deploy ERC1967Proxy for StakingFactory
  const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
  const stakingFactoryProxy = await ERC1967Proxy.deploy(
    await stakingFactoryImpl.getAddress(),
    initData
  );
  await stakingFactoryProxy.waitForDeployment();
  console.log("StakingFactory proxy deployed to:", await stakingFactoryProxy.getAddress());

  // Get StakingFactory instance at proxy address
  const stakingFactory = StakingFactory.attach(await stakingFactoryProxy.getAddress());
  console.log("StakingFactory initialized with EURC token:", eurcAddress);

  // Verify initialization
  const factoryEurcToken = await stakingFactory.eurcToken();
  console.log("Verified EURC token address in factory:", factoryEurcToken);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
