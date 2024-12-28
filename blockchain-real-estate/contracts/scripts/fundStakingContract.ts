import { ethers } from "hardhat";
import { getContractAddress } from "./utils";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Funding staking contract with account:", deployer.address);

  // Get the property token address and amount from command line arguments
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    throw new Error("Please provide property token address and amount as arguments");
  }

  const propertyTokenAddress = args[0];
  const amount = BigInt(args[1]);

  // Get contract instances
  const stakingFactoryAddress = await getContractAddress("StakingFactory");
  const eurcAddress = await getContractAddress("MockEURCUpgradeable");

  const stakingFactory = await ethers.getContractAt("StakingFactory", stakingFactoryAddress);
  const eurcToken = await ethers.getContractAt("MockEURCUpgradeable", eurcAddress);

  console.log("StakingFactory address:", stakingFactoryAddress);
  console.log("EURC token address:", eurcAddress);
  console.log("Property token address:", propertyTokenAddress);
  console.log("Amount to fund:", amount.toString(), "EURC");

  // First approve the staking factory to spend EURC
  console.log("Approving EURC spend...");
  const approveTx = await eurcToken.approve(stakingFactoryAddress, amount);
  await approveTx.wait();
  console.log("Approved EURC spend");

  // Fund the staking contract
  console.log("Funding staking contract...");
  const fundTx = await stakingFactory.fundStakingContract(propertyTokenAddress, amount);
  await fundTx.wait();
  console.log("Successfully funded staking contract");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
