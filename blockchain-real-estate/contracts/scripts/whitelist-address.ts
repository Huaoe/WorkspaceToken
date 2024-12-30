import { ethers } from "hardhat";
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
dotenv.config({ path: envPath });

export async function main(address: string) {
  const [deployer] = await ethers.getSigners();
  console.log("Whitelisting address with account:", deployer.address);

  // Get Whitelist contract address from .env.local
  const whitelistAddress = process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS;
  if (!whitelistAddress) {
    throw new Error("NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS not found in .env.local");
  }
  console.log("Using Whitelist contract at:", whitelistAddress);

  // Get Whitelist contract
  const whitelist = await ethers.getContractAt("IWhitelist", whitelistAddress);

  // Whitelist the address
  console.log("Whitelisting address:", address);
  const tx = await whitelist.addToWhitelist(address);
  await tx.wait();
  console.log("Successfully whitelisted address");

  // Verify whitelist status
  const isWhitelisted = await whitelist.isWhitelisted(address);
  console.log("Whitelist status:", isWhitelisted);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  main(process.argv[2])
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}