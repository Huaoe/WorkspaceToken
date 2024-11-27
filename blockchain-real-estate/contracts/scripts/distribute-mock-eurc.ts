import { ethers } from "hardhat";
import { MockEURC } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Distributing MockEURC tokens with account:", deployer.address);

  // MockEURC contract address from deployment
  const mockEURCAddress = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;

  // Get the MockEURC contract instance
  const mockEURC = await ethers.getContractAt("MockEURC", mockEURCAddress) as MockEURC;

  // Get test accounts (excluding deployer)
  const accounts = await ethers.getSigners();
  const testAccounts = accounts.slice(1, 5); // Get 4 test accounts

  // Amount to distribute to each account (1000 EURC)
  const distributionAmount = ethers.parseUnits("10000", 6);

  console.log("\nStarting token distribution...");
  console.log(`Distribution amount per address: 10000 EURC`);

  // Distribute tokens to each test account
  for (const account of testAccounts) {
    console.log(`\nDistributing to ${account.address}...`);
    
    try {
      // Check current balance
      const beforeBalance = await mockEURC.balanceOf(account.address);
      console.log(`Previous balance: ${ethers.formatUnits(beforeBalance, 6)} EURC`);

      // Transfer tokens
      const tx = await mockEURC.transfer(account.address, distributionAmount);
      await tx.wait();

      // Check new balance
      const afterBalance = await mockEURC.balanceOf(account.address);
      console.log(`New balance: ${ethers.formatUnits(afterBalance, 6)} EURC`);
      console.log(`Successfully distributed tokens to ${account.address}`);
    } catch (error) {
      console.error(`Error distributing to ${account.address}:`, error);
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
