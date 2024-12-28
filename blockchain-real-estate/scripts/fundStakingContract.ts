import { ethers } from "hardhat";
import { parseUnits } from "ethers";
import { StakingFactory, IERC20 } from "../typechain-types";

async function main() {
  // Configuration
  const PROPERTY_TOKEN_ADDRESS = process.env.PROPERTY_TOKEN_ADDRESS;
  const STAKING_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
  const EURC_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;
  const FUNDING_AMOUNT = parseUnits("1000", 6); // 1000 EURC (6 decimals)

  if (!PROPERTY_TOKEN_ADDRESS || !STAKING_FACTORY_ADDRESS || !EURC_TOKEN_ADDRESS) {
    throw new Error("Missing required environment variables");
  }

  console.log("Starting staking contract funding process...");
  console.log(`Property Token: ${PROPERTY_TOKEN_ADDRESS}`);
  console.log(`Staking Factory: ${STAKING_FACTORY_ADDRESS}`);
  console.log(`EURC Token: ${EURC_TOKEN_ADDRESS}`);
  console.log(`Funding Amount: ${FUNDING_AMOUNT} (${ethers.formatUnits(FUNDING_AMOUNT, 6)} EURC)`);

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Using account: ${deployer.address}`);

  // Get contract instances
  const stakingFactory = await ethers.getContractAt(
    "StakingFactory",
    STAKING_FACTORY_ADDRESS,
    deployer
  ) as StakingFactory;

  const eurcToken = await ethers.getContractAt(
    "IERC20",
    EURC_TOKEN_ADDRESS,
    deployer
  ) as IERC20;

  // Verify deployer is owner
  const owner = await stakingFactory.owner();
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error("Deployer is not the owner of the StakingFactory");
  }

  // Check EURC balance
  const balance = await eurcToken.balanceOf(deployer.address);
  if (balance < FUNDING_AMOUNT) {
    throw new Error(`Insufficient EURC balance. Have: ${ethers.formatUnits(balance, 6)}, Need: ${ethers.formatUnits(FUNDING_AMOUNT, 6)}`);
  }

  // Approve EURC transfer
  console.log("Approving EURC transfer...");
  const approveTx = await eurcToken.approve(STAKING_FACTORY_ADDRESS, FUNDING_AMOUNT);
  await approveTx.wait();
  console.log("EURC transfer approved");

  // Fund the staking contract
  console.log("Funding staking contract...");
  const fundTx = await stakingFactory.fundStakingContract(PROPERTY_TOKEN_ADDRESS, FUNDING_AMOUNT);
  const receipt = await fundTx.wait();
  
  // Get staking contract address
  const stakingContractInfo = await stakingFactory.stakingContracts(PROPERTY_TOKEN_ADDRESS);
  
  console.log("\nFunding successful!");
  console.log(`Transaction hash: ${receipt.hash}`);
  console.log(`Staking contract address: ${stakingContractInfo.contractAddress}`);
  console.log(`Funded amount: ${ethers.formatUnits(FUNDING_AMOUNT, 6)} EURC`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
