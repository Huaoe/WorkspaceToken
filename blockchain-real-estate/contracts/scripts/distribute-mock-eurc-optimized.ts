import { ethers } from "hardhat";
import { MockEURC } from "../typechain-types";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

async function getEURCAddress(): Promise<string> {
  // Try to get address from parent directory's .env.local first
  const envLocalPath = path.join(process.cwd(), '..', '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    const match = envContent.match(/NEXT_PUBLIC_EURC_TOKEN_ADDRESS=(.+)/);
    if (match && match[1]) {
      return match[1];
    }
  }

  // Fallback to local .env if not found in .env.local
  dotenv.config();
  const localAddress = process.env.EURC_TOKEN_ADDRESS;
  if (localAddress) {
    return localAddress;
  }

  throw new Error("EURC token address not found in either .env.local or .env");
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Distributing MockEURC tokens with account:", deployer.address);

  // Get MockEURC contract address
  const mockEURCAddress = await getEURCAddress();
  console.log("Using MockEURC address:", mockEURCAddress);

  // Get the MockEURC contract instance
  const mockEURC = await ethers.getContractAt("MockEURC", mockEURCAddress) as MockEURC;

  // Verify contract exists and is accessible
  try {
    const name = await mockEURC.name();
    const symbol = await mockEURC.symbol();
    const decimals = await mockEURC.decimals();
    console.log(`Contract verified: ${name} (${symbol}), decimals: ${decimals}`);
  } catch (error) {
    console.error("Error accessing MockEURC contract. Make sure the address is correct.");
    throw error;
  }

  // Get test accounts (excluding deployer)
  const accounts = await ethers.getSigners();
  const testAccounts = accounts.slice(1, 5); // Get 4 test accounts

  // Amount to distribute to each account (100000 EURC)
  const distributionAmount = ethers.parseUnits("100000", 6);

  console.log("\nStarting token distribution...");
  console.log(`Distribution amount per address: 100000 EURC`);

  // Check deployer balance first
  const deployerBalance = await mockEURC.balanceOf(deployer.address);
  console.log(`\nDeployer balance: ${ethers.formatUnits(deployerBalance, 6)} EURC`);
  if (deployerBalance < distributionAmount * BigInt(testAccounts.length)) {
    throw new Error("Insufficient balance for distribution");
  }

  // Distribute tokens to each test account
  for (const account of testAccounts) {
    const currentBalance = await mockEURC.balanceOf(account.address);
    console.log(`\nProcessing ${account.address}`);
    console.log(`Current balance: ${ethers.formatUnits(currentBalance, 6)} EURC`);
    
    if (currentBalance < distributionAmount) {
      console.log(`Transferring ${ethers.formatUnits(distributionAmount, 6)} EURC...`);
      const tx = await mockEURC.transfer(account.address, distributionAmount);
      await tx.wait();
      
      const newBalance = await mockEURC.balanceOf(account.address);
      console.log(`New balance: ${ethers.formatUnits(newBalance, 6)} EURC`);
    } else {
      console.log("Account already has sufficient balance, skipping...");
    }
  }

  console.log("\nToken distribution completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
