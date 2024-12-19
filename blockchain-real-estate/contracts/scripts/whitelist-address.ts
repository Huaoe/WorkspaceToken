import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

export async function main(addressToWhitelist: string) {
  try {
    // Load environment variables from the correct .env.local file
    const envLocalPath = path.join(process.cwd(), '..', '.env.local');
    console.log("Looking for .env.local at:", envLocalPath);
    
    if (fs.existsSync(envLocalPath)) {
      dotenv.config({ path: envLocalPath });
      console.log("Successfully loaded .env.local");
    } else {
      throw new Error(`.env.local file not found at ${envLocalPath}`);
    }

    // Get the Whitelist contract address from environment variables
    const whitelistAddress = process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS;
    if (!whitelistAddress) {
      throw new Error("NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS not found in environment variables");
    }

    console.log("Using whitelist proxy contract:", whitelistAddress);

    const [deployer] = await ethers.getSigners();
    console.log("Using account:", deployer.address);

    // Get the Whitelist contract instance
    const Whitelist = await ethers.getContractFactory("Whitelist");
    const whitelist = await Whitelist.attach(whitelistAddress);

    // Validate the address
    if (!ethers.isAddress(addressToWhitelist)) {
      throw new Error(`Invalid address: ${addressToWhitelist}`);
    }

    // Get all current whitelisted addresses
    console.log("Getting current whitelisted addresses...");
    const whitelistedAddresses = await whitelist.getWhitelistedAddresses();
    console.log("Current whitelisted addresses:", whitelistedAddresses);

    // Check if address is already whitelisted using direct mapping
    const isWhitelisted = await whitelist.isWhitelisted(addressToWhitelist);
    console.log("Current whitelist status:", isWhitelisted);

    if (isWhitelisted) {
      console.log(`Address ${addressToWhitelist} is already whitelisted`);
      return;
    }

    // Add to whitelist
    console.log(`Adding ${addressToWhitelist} to whitelist...`);
    const tx = await whitelist.addToWhitelist(addressToWhitelist);
    console.log("Transaction hash:", tx.hash);
    
    console.log("Waiting for transaction confirmation...");
    await tx.wait();
    
    console.log(`Successfully whitelisted address: ${addressToWhitelist}`);
    
    // Verify the address was whitelisted using both methods
    const verifyWhitelisted = await whitelist.isWhitelisted(addressToWhitelist);
    console.log(`Verification - Address whitelisted (direct mapping): ${verifyWhitelisted}`);

    const verifyWhitelistedFunc = await whitelist.isAddressWhitelisted(addressToWhitelist);
    console.log(`Verification - Address whitelisted (function): ${verifyWhitelistedFunc}`);

    // Get updated whitelist
    const updatedWhitelistedAddresses = await whitelist.getWhitelistedAddresses();
    console.log("Updated whitelisted addresses:", updatedWhitelistedAddresses);

  } catch (error) {
    console.error("Error in whitelist script:", error);
    throw error;
  }
}

// Allow running directly from command line
if (require.main === module) {
  const address = process.argv[2];
  if (!address) {
    console.error("Please provide an address to whitelist");
    process.exit(1);
  }

  main(address)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
