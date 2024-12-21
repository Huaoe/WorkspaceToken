import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

export async function main(addressToWhitelist: string) {
  // Load environment variables from the correct .env.local file
  const envLocalPath = path.join(process.cwd(), '..', '.env.local');
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  } else {
    throw new Error(".env.local file not found");
  }

  // Get the Whitelist contract address from environment variables
  const whitelistAddress = process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS;
  if (!whitelistAddress) {
    throw new Error("Whitelist address not found in environment variables");
  }

  const [deployer] = await ethers.getSigners();
  console.log("Whitelisting address with account:", deployer.address);

  // Get the Whitelist contract instance using IWhitelist interface
  const whitelist = await ethers.getContractAt("IWhitelist", whitelistAddress);

  // Validate the address
  if (!ethers.isAddress(addressToWhitelist)) {
    throw new Error(`Invalid address: ${addressToWhitelist}`);
  }

  try {
    // Add to whitelist
    console.log(`Adding ${addressToWhitelist} to whitelist...`);
    const tx = await whitelist.addToWhitelist(addressToWhitelist);
    await tx.wait();
    
    console.log(`Successfully whitelisted address: ${addressToWhitelist}`);
  } catch (error) {
    console.error(`Error whitelisting address ${addressToWhitelist}:`, error);
    throw error;
  }
}

// Allow running directly from command line
if (require.main === module) {
  main(process.argv[2])
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
