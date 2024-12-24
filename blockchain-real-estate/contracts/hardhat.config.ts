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
