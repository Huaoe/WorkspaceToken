import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

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
    console.log("\nIs deployer whitelisted?", isWhitelisted);

    // Get all whitelisted addresses
    const whitelistedAddresses = await whitelist.getWhitelistedAddresses();
    console.log("\nAll whitelisted addresses:", whitelistedAddresses);

  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
