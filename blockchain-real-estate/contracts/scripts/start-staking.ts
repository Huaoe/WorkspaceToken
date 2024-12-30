import { ethers } from "hardhat";
import dotenv from "dotenv";
import path from "path";

async function main() {
  // Load environment variables
  const envLocalPath = path.join(process.cwd(), '..', '.env.local');
  dotenv.config({ path: envLocalPath });

  const [deployer] = await ethers.getSigners();
  console.log("Starting staking period with account:", deployer.address);

  // Get required addresses from environment
  const factoryAddress = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
  const eurcAddress = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;

  if (!factoryAddress || !eurcAddress) {
    throw new Error("Required contract addresses not found in environment variables");
  }

  // Get contract instances
  const stakingFactory = await ethers.getContractAt("StakingFactory", factoryAddress);
  const eurcToken = await ethers.getContractAt("MockEURCUpgradeable", eurcAddress);

  // Get command line arguments from task parameters
  const propertyTokenAddress = process.env.PROPERTY_TOKEN_ADDRESS;
  const rewardAmount = process.env.REWARD_AMOUNT;

  if (!propertyTokenAddress || !rewardAmount) {
    throw new Error("Required arguments: PROPERTY_TOKEN_ADDRESS and REWARD_AMOUNT must be set");
  }

  console.log("Property Token Address:", propertyTokenAddress);
  console.log("Reward Amount (EURC):", rewardAmount);

  // Convert reward amount to EURC decimals (6)
  const rewardAmountWithDecimals = ethers.parseUnits(rewardAmount, 6);

  // Duration is 1 year (31536000 seconds)
  const duration = 31536000;
  
  // Calculate reward rate (tokens per second)
  const rewardRate = rewardAmountWithDecimals / BigInt(duration);
  if (rewardRate === 0n) {
    throw new Error("Reward rate too small. Try increasing the reward amount.");
  }

  console.log("Duration:", duration, "seconds");
  console.log("Reward Rate:", rewardRate.toString(), "EURC/second");

  // Check if a staking contract already exists for this property token
  const stakingContracts = await stakingFactory.getStakingContracts(propertyTokenAddress);
  if (stakingContracts.length > 0) {
    console.log("Staking contract already exists for this property token at:", stakingContracts[0]);
    const info = await stakingFactory.stakingContracts(propertyTokenAddress);
    if (info.isActive) {
      throw new Error("Active staking contract already exists for this property token");
    }
  }

  // Check EURC balance
  const balance = await eurcToken.balanceOf(deployer.address);
  console.log("Your EURC balance:", ethers.formatUnits(balance, 6));

  if (balance < rewardAmountWithDecimals) {
    throw new Error(`Insufficient EURC balance. You have ${ethers.formatUnits(balance, 6)} EURC but trying to fund ${rewardAmount} EURC`);
  }

  // Approve EURC spending
  console.log("Approving EURC spend...");
  const approveTx = await eurcToken.approve(factoryAddress, rewardAmountWithDecimals);
  await approveTx.wait();
  console.log("Approved EURC spend");

  // Create staking contract with reward rate
  console.log("Creating staking contract...");
  const createTx = await stakingFactory.createStakingContract(
    propertyTokenAddress,
    rewardRate,
    duration
  );
  const receipt = await createTx.wait();

  // Get the created contract address from the event
  const event = receipt?.logs.find(
    (log: any) => log.fragment?.name === "StakingContractCreated"
  );
  if (!event) {
    throw new Error("Failed to get staking contract address from event");
  }
  const stakingContractAddress = event.args[1];
  console.log("Staking contract created at:", stakingContractAddress);

  // Fund the staking contract
  console.log("Funding staking contract...");
  const fundTx = await stakingFactory.fundStakingContract(propertyTokenAddress, rewardAmountWithDecimals);
  await fundTx.wait();
  console.log("Successfully funded staking contract!");

  console.log("\nStaking Period Started!");
  console.log("------------------------");
  console.log("Property Token:", propertyTokenAddress);
  console.log("Staking Contract:", stakingContractAddress);
  console.log("Total Rewards:", rewardAmount, "EURC");
  console.log("Duration:", duration / (24 * 3600), "days");
  console.log("Reward Rate:", ethers.formatUnits(rewardRate, 6), "EURC/second");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
