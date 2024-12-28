import { ethers } from "hardhat";
import dotenv from "dotenv";
import path from "path";

async function main() {
  // Load environment variables
  const envLocalPath = path.join(process.cwd(), '..', '.env.local');
  dotenv.config({ path: envLocalPath });

  const [deployer] = await ethers.getSigners();
  console.log("Upgrading contracts with account:", deployer.address);

  // Deploy new StakingRewardsV2 implementation
  console.log("Deploying StakingRewardsV2 implementation...");
  const StakingRewardsV2 = await ethers.getContractFactory("StakingRewardsV2");
  const stakingRewardsV2 = await StakingRewardsV2.deploy();
  await stakingRewardsV2.waitForDeployment();
  const stakingRewardsV2Address = await stakingRewardsV2.getAddress();
  console.log("StakingRewardsV2 implementation deployed to:", stakingRewardsV2Address);

  // Get existing staking contract address
  const stakingContractAddress = "0xBDB0f9d6b18eF94F7bA82C58985D03236710A496"; // Your staking contract address
  console.log("Upgrading staking contract at:", stakingContractAddress);

  // Get the proxy contract with UUPSUpgradeable interface
  const UUPSUpgradeable = await ethers.getContractFactory("@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol:UUPSUpgradeable");
  const stakingContract = UUPSUpgradeable.attach(stakingContractAddress);

  // Upgrade the implementation
  console.log("Upgrading implementation...");
  const upgradeTx = await stakingContract._upgradeToAndCall(
    stakingRewardsV2Address,
    "0x",
    false
  );
  await upgradeTx.wait();
  console.log("Successfully upgraded staking contract to V2!");

  // Verify the upgrade
  const implementation = await ethers.provider.getStorageAt(
    stakingContractAddress,
    "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
  );
  
  console.log("\nVerification:");
  console.log("New implementation address:", implementation);
  console.log("Expected implementation:", stakingRewardsV2Address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
