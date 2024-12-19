import { ethers } from "hardhat";
import { task } from "hardhat/config";
import * as dotenv from "dotenv";
import { updateEnvFile } from "./utils";

dotenv.config({ path: "../.env.local" });

async function main() {
  const stakingFactoryAddress = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
  const eurcTokenAddress = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;

  if (!stakingFactoryAddress || !eurcTokenAddress) {
    throw new Error("Missing required environment variables");
  }

  console.log("Funding StakingFactory with EURC tokens...");
  console.log("StakingFactory address:", stakingFactoryAddress);
  console.log("EURC token address:", eurcTokenAddress);

  // Get the signer
  const [deployer] = await ethers.getSigners();
  console.log("Using account:", deployer.address);

  // Get contract instances
  const eurcToken = await ethers.getContractAt("IERC20", eurcTokenAddress);
  const stakingFactory = await ethers.getContractAt("StakingFactory", stakingFactoryAddress);

  // Amount to transfer (e.g., 1,000,000 EURC with 6 decimals)
  const amount = ethers.parseUnits("1000000", 6);

  // Check current balances
  const deployerBalance = await eurcToken.balanceOf(deployer.address);
  const factoryBalance = await eurcToken.balanceOf(stakingFactoryAddress);

  console.log("Current balances:");
  console.log("Deployer EURC balance:", ethers.formatUnits(deployerBalance, 6));
  console.log("StakingFactory EURC balance:", ethers.formatUnits(factoryBalance, 6));

  // Approve StakingFactory to spend EURC
  console.log("Approving StakingFactory to spend EURC...");
  const approveTx = await eurcToken.approve(stakingFactoryAddress, amount);
  await approveTx.wait();
  console.log("Approval successful");

  // Transfer EURC to StakingFactory
  console.log("Transferring EURC to StakingFactory...");
  const transferTx = await eurcToken.transfer(stakingFactoryAddress, amount);
  await transferTx.wait();
  console.log("Transfer successful");

  // Verify new balances
  const newDeployerBalance = await eurcToken.balanceOf(deployer.address);
  const newFactoryBalance = await eurcToken.balanceOf(stakingFactoryAddress);

  console.log("New balances:");
  console.log("Deployer EURC balance:", ethers.formatUnits(newDeployerBalance, 6));
  console.log("StakingFactory EURC balance:", ethers.formatUnits(newFactoryBalance, 6));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });