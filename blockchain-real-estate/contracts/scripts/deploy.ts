import { ethers, upgrades } from "hardhat";
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../../.env.local');
dotenv.config({ path: envPath });

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy EURC Token
  const MockEURC = await ethers.getContractFactory("MockEURCUpgradeable");
  console.log("Deploying EURC Token...");
  const eurcToken = await upgrades.deployProxy(MockEURC, [deployer.address], {
    kind: 'uups',
    initializer: 'initialize'
  });
  await eurcToken.waitForDeployment();
  const eurcTokenAddress = await eurcToken.getAddress();
  console.log("EURC Token deployed to:", eurcTokenAddress);

  // Deploy StakingFactory
  const StakingFactory = await ethers.getContractFactory("StakingFactory");
  console.log("Deploying StakingFactory...");
  const stakingFactory = await upgrades.deployProxy(StakingFactory, [eurcTokenAddress], {
    kind: "uups",
    initializer: "initialize",
  });
  await stakingFactory.waitForDeployment();
  const stakingFactoryAddress = await stakingFactory.getAddress();
  console.log("StakingFactory deployed to:", stakingFactoryAddress);

  // Deploy a test property token if needed
  const PropertyToken = await ethers.getContractFactory("PropertyToken");
  console.log("Deploying test PropertyToken...");
  const propertyToken = await upgrades.deployProxy(PropertyToken, [{
    name: "Test Property",
    symbol: "TEST",
    title: "Test Property",
    description: "Test Description",
    location: "Test Location",
    imageUrl: "https://test.image.url",
    price: ethers.parseUnits("56", 6), // 56 EURC
    totalSupply: ethers.parseUnits("1000", 18), // 1000 tokens
    initialOwner: deployer.address,
    eurcTokenAddress: eurcTokenAddress,
    whitelistContract: deployer.address // Using deployer as mock whitelist for testing
  }], {
    kind: 'uups',
    initializer: 'initialize'
  });
  await propertyToken.waitForDeployment();
  const propertyTokenAddress = await propertyToken.getAddress();
  console.log("Property Token deployed to:", propertyTokenAddress);

  // Create staking contract for the property token
  console.log("Creating staking contract for property token...");
  const tx = await stakingFactory.createStakingContract(
    propertyTokenAddress,
    ethers.parseUnits("1", 6), // 1 EURC per second
    31536000 // 1 year in seconds
  );
  await tx.wait();
  
  // Get the created staking contract address
  const stakingInfo = await stakingFactory.stakingContracts(propertyTokenAddress);
  console.log("Staking contract created at:", stakingInfo.contractAddress);

  // Update .env.local with new addresses
  const envContent = `
NEXT_PUBLIC_EURC_TOKEN_ADDRESS="${eurcTokenAddress}"
NEXT_PUBLIC_STAKING_FACTORY_ADDRESS="${stakingFactoryAddress}"
NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS="${propertyTokenAddress}"
NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS="${stakingInfo.contractAddress}"
`;

  // Write to .env.local in the root directory
  const rootEnvPath = path.resolve(__dirname, '../../.env.local');
  try {
    // Read existing .env.local
    let existingEnv = '';
    if (fs.existsSync(rootEnvPath)) {
      existingEnv = fs.readFileSync(rootEnvPath, 'utf8');
    }

    // Update only the contract addresses while preserving other variables
    const updatedEnv = existingEnv
      .replace(/^NEXT_PUBLIC_EURC_TOKEN_ADDRESS=.*$/m, `NEXT_PUBLIC_EURC_TOKEN_ADDRESS="${eurcTokenAddress}"`)
      .replace(/^NEXT_PUBLIC_STAKING_FACTORY_ADDRESS=.*$/m, `NEXT_PUBLIC_STAKING_FACTORY_ADDRESS="${stakingFactoryAddress}"`)
      .replace(/^NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS=.*$/m, `NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS="${propertyTokenAddress}"`)
      .replace(/^NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=.*$/m, `NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS="${stakingInfo.contractAddress}"`);

    // If the variables didn't exist, append them
    if (!updatedEnv.includes('NEXT_PUBLIC_EURC_TOKEN_ADDRESS')) {
      fs.appendFileSync(rootEnvPath, envContent);
    } else {
      fs.writeFileSync(rootEnvPath, updatedEnv);
    }
    console.log("Contract addresses updated in .env.local");
  } catch (error) {
    console.error("Error updating .env.local:", error);
    // Create new .env.local if it doesn't exist
    fs.writeFileSync(rootEnvPath, envContent);
    console.log("Created new .env.local with contract addresses");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
