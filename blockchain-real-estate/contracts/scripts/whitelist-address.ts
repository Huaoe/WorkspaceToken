import { ethers } from "hardhat";
import dotenv from "dotenv";
import path from "path";

async function main() {
  // Load environment variables from parent directory
  const envPath = path.join(process.cwd(), '..', '.env.local');
  dotenv.config({ path: envPath });

  // Get the Whitelist contract address from environment variables
  const whitelistAddress = process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS;
  if (!whitelistAddress) {
    throw new Error("Whitelist address not found in environment variables");
  }

  // Get the address to whitelist from environment variable
  const addressToWhitelist = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
  console.log("Address to whitelist:", addressToWhitelist);

  // Validate the address
  if (!ethers.isAddress(addressToWhitelist)) {
    throw new Error("Invalid Ethereum address provided");
  }

  const [deployer] = await ethers.getSigners();
  console.log("Whitelisting address with account:", deployer.address);

  // Get the Whitelist contract instance
  const whitelist = await ethers.getContractAt("Whitelist", whitelistAddress);

  // Check if address is already whitelisted
  const isWhitelisted = await whitelist.isAddressWhitelisted(addressToWhitelist);
  if (isWhitelisted) {
    console.log(`Address ${addressToWhitelist} is already whitelisted`);
    return;
  }

  // Add to whitelist
  console.log(`Adding ${addressToWhitelist} to whitelist...`);
  const tx = await whitelist.addToWhitelist(addressToWhitelist);
  await tx.wait();
  
  console.log(`Successfully whitelisted address: ${addressToWhitelist}`);
  
  // Verify the address was whitelisted
  const verifyWhitelisted = await whitelist.isAddressWhitelisted(addressToWhitelist);
  console.log(`Verification - Address whitelisted: ${verifyWhitelisted}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
