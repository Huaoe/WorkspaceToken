import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseUnits } from "ethers";
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../../.env.local');
dotenv.config({ path: envPath });

task("fund-staking-direct", "Fund a staking contract directly")
  .addParam("propertytoken", "The property token address")
  .addParam("amount", "The amount of EURC to fund")
  .setAction(async (taskArgs, hre) => {
    const { propertytoken, amount } = taskArgs;
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();
    console.log("Funding staking contract with account:", deployer.address);

    // Get contract addresses from .env.local
    const factoryAddress = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
    const eurcAddress = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;

    if (!factoryAddress || !eurcAddress) {
      throw new Error("Missing contract addresses in .env.local. Make sure NEXT_PUBLIC_STAKING_FACTORY_ADDRESS and NEXT_PUBLIC_EURC_TOKEN_ADDRESS are set.");
    }

    console.log("Using contracts:");
    console.log("- StakingFactory:", factoryAddress);
    console.log("- EURC Token:", eurcAddress);

    // Get contract instances
    const stakingFactory = await ethers.getContractAt("StakingFactory", factoryAddress);
    const eurcToken = await ethers.getContractAt("MockEURCUpgradeable", eurcAddress);

    try {
      // Get staking contract info
      const stakingInfo = await stakingFactory.stakingContracts(propertytoken);
      
      let stakingAddress;
      if (!stakingInfo.isActive) {
        console.log("Creating new staking contract...");
        const tx = await stakingFactory.createStakingContract(
          propertytoken,
          parseUnits("1", 6), // 1 EURC per second
          31536000 // 1 year in seconds
        );
        await tx.wait();
        console.log("Created new staking contract");
        
        // Get the new staking contract address
        const updatedStakingInfo = await stakingFactory.stakingContracts(propertytoken);
        stakingAddress = updatedStakingInfo.contractAddress;
      } else {
        stakingAddress = stakingInfo.contractAddress;
      }
      console.log("Using staking contract at:", stakingAddress);

      // Get staking contract instance
      const stakingContract = await ethers.getContractAt("StakingRewardsV2", stakingAddress);

      // Convert amount to EURC decimals (6 decimals)
      const amountWithDecimals = parseUnits(amount.toString(), 6);
      console.log(`Funding staking contract with ${amount} EURC...`);

      // Check EURC balance
      const balance = await eurcToken.balanceOf(deployer.address);
      console.log("Current EURC balance:", ethers.formatUnits(balance, 6), "EURC");

      if (balance < amountWithDecimals) {
        console.log("Insufficient balance, minting EURC...");
        const mintTx = await eurcToken.mint(deployer.address, amountWithDecimals);
        await mintTx.wait();
        console.log("Minted", amount, "EURC tokens");
      }

      // Approve staking contract to spend EURC
      console.log("Approving EURC spend...");
      const approveTx = await eurcToken.approve(stakingAddress, amountWithDecimals);
      await approveTx.wait();
      console.log("Approved EURC spend");

      // Fund the staking contract
      console.log("Setting reward rate...");
      const fundTx = await stakingContract.notifyRewardRate(amountWithDecimals);
      await fundTx.wait();
      console.log("Successfully set reward rate");

      // Get updated staking info
      const newFinishAt = await stakingContract.finishAt();
      const rewardRate = await stakingContract.rewardRate();
      console.log("Staking period ends at:", new Date(Number(newFinishAt) * 1000).toLocaleString());
      console.log("Reward rate:", ethers.formatUnits(rewardRate, 6), "EURC per second");

    } catch (error) {
      console.error("Error:", error.message || error);
      throw error;
    }
  });