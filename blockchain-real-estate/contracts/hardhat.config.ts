import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-deploy";
import "@typechain/hardhat";
import "dotenv/config";

// Task to whitelist an address
task("whitelist-address", "Whitelist an address")
  .addParam("address", "The address to whitelist")
  .setAction(async (taskArgs, hre) => {
    const { address } = taskArgs;
    const script = require("./scripts/whitelist-address");
    await script.main(address);
  });

// Task to approve a property
task("approve-property", "Approve a property token")
  .addParam("address", "The property token address to approve")
  .setAction(async (taskArgs, hre) => {
    const { address } = taskArgs;
    const script = require("./scripts/approve-property");
    await script.main(address);
  });

// Task to activate a property
task("activate-property", "Activates a property token")
  .addParam("address", "The property token address")
  .setAction(async (taskArgs, hre) => {
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();
    console.log("Activating property with account:", deployer.address);
    console.log("Property address:", taskArgs.address);

    const propertyToken = await ethers.getContractAt("PropertyToken", taskArgs.address);

    const tx = await propertyToken.updatePropertyStatus(true);
    await tx.wait();
    console.log("Successfully activated property at:", taskArgs.address);

    const propertyDetails = await propertyToken.propertyDetails();
    const name = await propertyToken.name();
    const symbol = await propertyToken.symbol();
    const totalSupply = await propertyToken.totalSupply();

    console.log("\nProperty Details:");
    console.log("Token Address:", taskArgs.address);
    console.log("Is Active:", propertyDetails.isActive);
    console.log("\nDetailed Property Information:");
    console.log("Title:", propertyDetails.title);
    console.log("Description:", propertyDetails.description);
    console.log("Location:", propertyDetails.location);
    console.log("Image URL:", propertyDetails.imageUrl);
    console.log("Price:", ethers.formatUnits(propertyDetails.price, 6), "EURC");

    console.log("\nToken Information:");
    console.log("Name:", name);
    console.log("Symbol:", symbol);
    console.log("Total Supply:", ethers.formatEther(totalSupply), "tokens");
  });

// Task to fund staking contract
task("fund-staking-contract", "Fund a staking contract for a property token")
  .addParam("token", "The property token address")
  .addParam("amount", "The amount of EURC to fund")
  .setAction(async (taskArgs, hre) => {
    const { token, amount } = taskArgs;
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();
    console.log("Funding staking contract with account:", deployer.address);

    // Load environment variables from the correct .env.local file
    const envLocalPath = require("path").join(process.cwd(), '..', '.env.local');
    if (!require("fs").existsSync(envLocalPath)) {
      throw new Error(".env.local file not found");
    }
    require("dotenv").config({ path: envLocalPath });

    // Get contract addresses from environment variables
    const stakingFactoryAddress = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
    const eurcAddress = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;

    if (!stakingFactoryAddress || !eurcAddress) {
      throw new Error("Missing contract addresses in environment variables");
    }

    const stakingFactory = await ethers.getContractAt("StakingFactory", stakingFactoryAddress);
    const eurcToken = await ethers.getContractAt("MockEURCUpgradeable", eurcAddress);

    console.log("StakingFactory address:", stakingFactoryAddress);
    console.log("EURC token address:", eurcAddress);
    console.log("Property token address:", token);
    console.log("Amount to fund:", amount, "EURC");

    // First approve the staking factory to spend EURC
    console.log("Approving EURC spend...");
    const approveTx = await eurcToken.approve(stakingFactoryAddress, amount);
    await approveTx.wait();
    console.log("Approved EURC spend");

    // Fund the staking contract
    console.log("Funding staking contract...");
    const fundTx = await stakingFactory.fundStakingContract(token, amount);
    await fundTx.wait();
    console.log("Successfully funded staking contract");
  });

// Task to fund staking contract directly
task("fund-staking-direct", "Fund a staking contract directly")
  .addParam("propertytoken", "The property token address")
  .addParam("amount", "The amount of EURC to fund")
  .setAction(async (taskArgs, hre) => {
    const { propertytoken, amount } = taskArgs;
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();
    console.log("Funding staking contract with account:", deployer.address);

    // Load environment variables
    const envLocalPath = require("path").join(process.cwd(), '..', '.env.local');
    if (!require("fs").existsSync(envLocalPath)) {
      throw new Error(".env.local file not found");
    }
    require("dotenv").config({ path: envLocalPath });

    // Get contract addresses
    const eurcAddress = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;
    const stakingV2Address = process.env.NEXT_PUBLIC_STAKING_V2_ADDRESS;

    if (!eurcAddress || !stakingV2Address) {
      throw new Error("Contract addresses not found in environment variables");
    }

    // Get contract instances
    const eurcToken = await ethers.getContractAt("MockEURCUpgradeable", eurcAddress);
    const stakingContract = await ethers.getContractAt("StakingRewardsV2", stakingV2Address);

    // Get duration from staking contract
    const duration = await stakingContract.duration();

    // Convert amount to EURC decimals (6 decimals)
    const amountWithDecimals = ethers.parseUnits(amount.toString(), 6);

    // Calculate reward rate (amount / duration)
    const rewardRate = amountWithDecimals / BigInt(duration);
    if (rewardRate === 0n) {
      throw new Error("Reward rate too small. Try increasing the amount or decreasing the duration.");
    }

    console.log("EURC token address:", eurcAddress);
    console.log("StakingRewardsV2 address:", stakingV2Address);
    console.log("Property token address:", propertytoken);
    console.log("Duration:", duration.toString(), "seconds");
    console.log("Amount to fund:", amount, "EURC");
    console.log("Amount with decimals:", amountWithDecimals.toString());
    console.log("Calculated reward rate:", rewardRate.toString(), "EURC/second");

    // Check EURC balance
    const balance = await eurcToken.balanceOf(deployer.address);
    console.log("Your EURC balance:", ethers.formatUnits(balance, 6), "EURC");

    if (balance < amountWithDecimals) {
      throw new Error(`Insufficient EURC balance. You have ${ethers.formatUnits(balance, 6)} EURC but trying to fund ${amount} EURC`);
    }

    // First approve the staking contract to spend EURC
    console.log("Approving EURC spend...");
    const approveTx = await eurcToken.approve(stakingV2Address, amountWithDecimals);
    await approveTx.wait();
    console.log("Approved EURC spend");

    // Transfer EURC to staking contract
    console.log("Transferring EURC to staking contract...");
    const transferTx = await eurcToken.transfer(stakingV2Address, amountWithDecimals);
    await transferTx.wait();
    console.log("Transferred EURC to staking contract");

    // Notify the staking contract about the new reward rate
    console.log("Setting new reward rate...");
    const notifyTx = await stakingContract.notifyRewardRate(rewardRate);
    await notifyTx.wait();

    console.log("Successfully set new reward rate");
  });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
      mining: {
        auto: true,
        interval: 1000,
        mempool: {
          order: "fifo"
        }
      },
      allowUnlimitedContractSize: true,   
      loggingEnabled: true
    },
    localhost: {
      chainId: 31337,
      url: "http://127.0.0.1:8545",
    },
  },
  paths: {
    // deploy: 'scripts',
    deployments: 'deployments',
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    typechain: './typechain-types'
  },
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6'
  }
};

export default config;
