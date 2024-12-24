import { ethers } from "hardhat";
import * as path from "path";
import * as fs from "fs";
import dotenv from "dotenv";

dotenv.config();

async function getAddresses() {
  const envPath = path.join(process.cwd(), '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local file not found');
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const eurcMatch = envContent.match(/NEXT_PUBLIC_EURC_TOKEN_ADDRESS=(.+)/);
  const stakingFactoryMatch = envContent.match(/NEXT_PUBLIC_STAKING_FACTORY_ADDRESS=(.+)/);
  
  if (!eurcMatch) {
    throw new Error('NEXT_PUBLIC_EURC_TOKEN_ADDRESS not found in .env.local');
  }
  if (!stakingFactoryMatch) {
    throw new Error('NEXT_PUBLIC_STAKING_FACTORY_ADDRESS not found in .env.local');
  }

  return {
    eurcAddress: eurcMatch[1],
    stakingFactoryAddress: stakingFactoryMatch[1]
  };
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Funding StakingFactory with account:", deployer.address);

  const { eurcAddress, stakingFactoryAddress } = await getAddresses();

  // Get contract instances
  const MockEURC = await ethers.getContractFactory("MockEURCUpgradeable");
  const eurc = MockEURC.attach(eurcAddress);
  
  const StakingFactory = await ethers.getContractFactory("StakingFactory");
  const stakingFactory = StakingFactory.attach(stakingFactoryAddress);

  // Amount to transfer (e.g., 1,000,000 EURC with 6 decimals)
  const amount = ethers.parseUnits("1000000", 6);

  // Check current balances
  const deployerBalance = await eurc.balanceOf(deployer.address);
  const factoryBalance = await eurc.balanceOf(stakingFactoryAddress);

  console.log("\nCurrent balances:");
  console.log("Deployer EURC balance:", ethers.formatUnits(deployerBalance, 6));
  console.log("StakingFactory EURC balance:", ethers.formatUnits(factoryBalance, 6));

  // Approve StakingFactory to spend EURC
  console.log("\nApproving StakingFactory to spend EURC...");
  const approveTx = await eurc.approve(stakingFactoryAddress, amount);
  await approveTx.wait();
  console.log("✅ Approval successful");

  // Transfer EURC to StakingFactory
  console.log("\nTransferring EURC to StakingFactory...");
  const transferTx = await eurc.transfer(stakingFactoryAddress, amount);
  await transferTx.wait();
  console.log("✅ Transfer successful");

  // Verify new balances
  const newDeployerBalance = await eurc.balanceOf(deployer.address);
  const newFactoryBalance = await eurc.balanceOf(stakingFactoryAddress);

  console.log("\nNew balances:");
  console.log("Deployer EURC balance:", ethers.formatUnits(newDeployerBalance, 6));
  console.log("StakingFactory EURC balance:", ethers.formatUnits(newFactoryBalance, 6));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });