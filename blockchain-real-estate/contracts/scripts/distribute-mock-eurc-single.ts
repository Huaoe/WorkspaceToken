import { ethers } from "hardhat";
import { MockEURC } from "../typechain-types";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

async function getEURCAddress(): Promise<string> {
  const envPath = path.join(process.cwd(), '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found');
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const eurcMatch = envContent.match(/NEXT_PUBLIC_EURC_TOKEN_ADDRESS=(.+)/);
  
  if (!eurcMatch) {
    throw new Error('NEXT_PUBLIC_EURC_TOKEN_ADDRESS not found in .env');
  }

  return eurcMatch[1];
}

async function main() {
  // Get command line arguments
  const recipientAddress = process.argv[2];
  const amount = process.argv[3];

  if (!recipientAddress || !amount) {
    throw new Error("Please provide recipient address and amount as arguments");
  }

  if (!ethers.isAddress(recipientAddress)) {
    throw new Error("Invalid recipient address");
  }

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

  // Parse amount with 6 decimals (EURC standard)
  const distributionAmount = ethers.parseUnits(amount, 6);

  // Check deployer balance
  const deployerBalance = await mockEURC.balanceOf(deployer.address);
  if (deployerBalance < distributionAmount) {
    throw new Error(`Insufficient balance. Deployer has ${ethers.formatUnits(deployerBalance, 6)} EURC`);
  }

  console.log(`Distributing ${amount} EURC to ${recipientAddress}`);

  // Perform the transfer
  const tx = await mockEURC.transfer(recipientAddress, distributionAmount);
  console.log("Transaction hash:", tx.hash);

  // Wait for confirmation
  await tx.wait();
  console.log("Transfer completed successfully");

  // Log final balances
  const recipientBalance = await mockEURC.balanceOf(recipientAddress);
  console.log(`Recipient balance: ${ethers.formatUnits(recipientBalance, 6)} EURC`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
