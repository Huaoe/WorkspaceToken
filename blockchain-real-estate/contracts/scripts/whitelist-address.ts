import { task } from "hardhat/config";
import { ethers } from "hardhat";
import dotenv from "dotenv";
import path from "path";

task("whitelist", "Whitelist one or more addresses")
  .addVariadicPositionalParam("addresses", "The addresses to whitelist")
  .setAction(async (taskArgs, hre) => {
    // Load environment variables from parent directory
    const envPath = path.join(process.cwd(), '..', '.env.local');
    dotenv.config({ path: envPath });

    // Get the Whitelist contract address from environment variables
    const whitelistAddress = process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS;
    if (!whitelistAddress) {
      throw new Error("Whitelist address not found in environment variables");
    }

    const [deployer] = await hre.ethers.getSigners();
    console.log("Whitelisting addresses with account:", deployer.address);

    // Get the Whitelist contract instance
    const whitelist = await hre.ethers.getContractAt("Whitelist", whitelistAddress);

    // Process each address
    for (const address of taskArgs.addresses) {
      // Validate the address
      if (!hre.ethers.isAddress(address)) {
        console.log(`Skipping invalid address: ${address}`);
        continue;
      }

      try {
        // Check if address is already whitelisted
        const isWhitelisted = await whitelist.isAddressWhitelisted(address);
        if (isWhitelisted) {
          console.log(`Address ${address} is already whitelisted`);
          continue;
        }

        // Add to whitelist
        console.log(`Adding ${address} to whitelist...`);
        const tx = await whitelist.addToWhitelist(address);
        await tx.wait();
        
        console.log(`Successfully whitelisted address: ${address}`);
        
        // Verify the address was whitelisted
        const verifyWhitelisted = await whitelist.isAddressWhitelisted(address);
        console.log(`Verification - Address whitelisted: ${verifyWhitelisted}`);
      } catch (error) {
        console.error(`Error whitelisting address ${address}:`, error.message);
      }
    }
  });
