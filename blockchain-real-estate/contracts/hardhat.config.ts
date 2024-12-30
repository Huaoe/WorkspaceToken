import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-deploy";
import "@typechain/hardhat";
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

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

// Task to transfer property ownership
task("transfer-ownership", "Transfer property token ownership")
  .addParam("address", "The property token address")
  .setAction(async (taskArgs, hre) => {
    const { address } = taskArgs;
    const script = require("./scripts/transfer-ownership");
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

    let factoryAddress = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
    if (!factoryAddress) {
      console.log("NEXT_PUBLIC_STAKING_FACTORY_ADDRESS not found in .env.local");
      factoryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    }
    console.log("Using StakingFactory at:", factoryAddress);

    // Get StakingFactory contract
    const stakingFactory = await ethers.getContractAt("StakingFactory", factoryAddress);

    try {
      // Verify factory contract exists by calling a view function
      const eurcAddress = await stakingFactory.eurcToken();
      console.log("EURC token address:", eurcAddress);

      // Get staking contract info from factory
      const stakingInfo = await stakingFactory.stakingContracts(propertytoken);
      if (!stakingInfo.isActive) {
        throw new Error("Staking contract not found or not active for this property token");
      }
      const stakingAddress = stakingInfo.contractAddress;
      console.log("Staking contract address:", stakingAddress);

      // Get contract instances
      const eurcToken = await ethers.getContractAt("MockEURCUpgradeable", eurcAddress);
      const stakingContract = await ethers.getContractAt("StakingRewardsV2", stakingAddress);

      // Convert amount to EURC decimals (6 decimals)
      const amountWithDecimals = ethers.parseUnits(amount.toString(), 6);
      console.log(`Funding staking contract with ${amount} EURC...`);

      // Check EURC balance
      const balance = await eurcToken.balanceOf(deployer.address);
      console.log("Your EURC balance:", ethers.formatUnits(balance, 6), "EURC");

      if (balance < amountWithDecimals) {
        // Try to mint some EURC for testing
        console.log("Insufficient balance, attempting to mint EURC...");
        const mintTx = await eurcToken.mint(deployer.address, amountWithDecimals);
        await mintTx.wait();
        console.log("Minted EURC tokens");
      }

      // First approve the staking factory to spend EURC
      console.log("Approving EURC spend...");
      const approveTx = await eurcToken.approve(factoryAddress, amountWithDecimals);
      await approveTx.wait();
      console.log("Approved EURC spend");

      // Fund the staking contract
      console.log("Funding staking contract...");
      const fundTx = await stakingFactory.fundStakingContract(propertytoken, amountWithDecimals);
      await fundTx.wait();
      console.log("Successfully funded staking contract");
    } catch (error) {
      console.error("Error details:", error);
      throw error;
    }
  });

// Task to start a staking period
task("start-staking", "Start a staking period for a property token")
  .addParam("propertytoken", "The property token address")
  .addParam("amount", "The amount of EURC to distribute as rewards")
  .setAction(async (taskArgs, hre) => {
    // Set environment variables for the script
    process.env.PROPERTY_TOKEN_ADDRESS = taskArgs.propertytoken;
    process.env.REWARD_AMOUNT = taskArgs.amount;
    
    await hre.run("run", { 
      script: "scripts/start-staking.ts"
    });
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
