import { ethers } from "hardhat";
import { MockEURC } from "../typechain-types";
import * as dotenv from "dotenv";

async function main() {
  // Load environment variables
  dotenv.config();

  const [deployer] = await ethers.getSigners();
  console.log("Distributing MockEURC tokens with account:", deployer.address);

  // MockEURC contract address from deployment
  const mockEURCAddress = process.env.EURC_TOKEN_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  if (!mockEURCAddress) {
    throw new Error("EURC_TOKEN_ADDRESS not found in environment variables");
  }
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

  // Amount to distribute to each account (10000 EURC)
  const distributionAmount = ethers.parseUnits("10000", 6);

  console.log("\nStarting token distribution...");
  console.log(`Distribution amount per address: 10000 EURC`);

  // Check deployer balance first
  const deployerBalance = await mockEURC.balanceOf(deployer.address);
  console.log(`\nDeployer balance: ${ethers.formatUnits(deployerBalance, 6)} EURC`);
  if (deployerBalance < distributionAmount * BigInt(testAccounts.length)) {
    throw new Error("Insufficient balance for distribution");
  }

  // Distribute tokens to each test account
  for (const account of testAccounts) {
    console.log(`\nDistributing to ${account.address}...`);
    
    try {
      // Check current balance
      const beforeBalance = await mockEURC.balanceOf(account.address);
      console.log(`Previous balance: ${ethers.formatUnits(beforeBalance, 6)} EURC`);

      // Transfer tokens
      const tx = await mockEURC.transfer(account.address, distributionAmount);
      console.log(`Transaction hash: ${tx.hash}`);
      await tx.wait();

      // Check new balance
      const afterBalance = await mockEURC.balanceOf(account.address);
      console.log(`New balance: ${ethers.formatUnits(afterBalance, 6)} EURC`);
      console.log(`Successfully distributed tokens to ${account.address}`);
    } catch (error) {
      console.error(`Error distributing to ${account.address}: ${error}`);
      throw error; // Re-throw to stop the script if distribution fails
    }
  }

  // Print final balances
  console.log("\nFinal balances:");
  console.log("---------------");
  for (const account of testAccounts) {
    const balance = await mockEURC.balanceOf(account.address);
    console.log(`${account.address}: ${ethers.formatUnits(balance, 6)} EURC`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
