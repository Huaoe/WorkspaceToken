import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-chai-matchers";
import "hardhat-deploy";
import "dotenv/config";
import "./scripts/whitelist-address.ts";  // Import the whitelist task

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
    artifacts: "./artifacts"
  }
};

export default config;
