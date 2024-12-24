import { ethers } from "hardhat";
import * as path from "path";
import * as fs from "fs";
import dotenv from "dotenv";

async function main() {
  try {
    // Load environment variables from the correct .env.local file
    const envLocalPath = path.join(process.cwd(), '..', '.env.local');
    if (fs.existsSync(envLocalPath)) {
      dotenv.config({ path: envLocalPath });
      console.log("Loaded environment from:", envLocalPath);
    } else {
      throw new Error(".env.local file not found at: " + envLocalPath);
    }

    const [deployer] = await ethers.getSigners();
    console.log("Checking whitelist with account:", deployer.address);

    // Get Whitelist Contract
    const whitelistAddress = process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS;
    if (!whitelistAddress) {
      throw new Error("Whitelist address not found in environment variables");
    }

    console.log("\nWhitelist Address:", whitelistAddress);

    // Get contract instance
    const whitelist = await ethers.getContractAt("Whitelist", whitelistAddress);
    
    // Check if deployer is whitelisted
    const isWhitelisted = await whitelist.isWhitelisted(deployer.address);
    console.log("\nDeployer whitelisted:", isWhitelisted);

    if (!isWhitelisted) {
      console.log("\nAdding deployer to whitelist...");
      const tx = await whitelist.addToWhitelist(deployer.address, {
        gasLimit: 500000
      });
      await tx.wait();
      console.log("Deployer added to whitelist");

      // Verify the change
      const newStatus = await whitelist.isWhitelisted(deployer.address);
      console.log("New whitelist status:", newStatus);
    }

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
