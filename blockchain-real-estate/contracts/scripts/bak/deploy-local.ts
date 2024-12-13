import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";
import { updateEnvFiles } from "../utils/env-management";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", balance.toString());

  try {
    // First deploy a mock EURC token for local testing
    console.log("\nDeploying Mock EURC Token...");
    const MockEURC = await ethers.getContractFactory("MockEURC");
    const mockEURC = await MockEURC.deploy(deployer.address);
    await mockEURC.waitForDeployment();
    const eurcAddress = mockEURC.target;
    console.log("Mock EURC deployed to:", eurcAddress);

    // Deploy PropertyFactory with the mock EURC address
    console.log("\nDeploying PropertyFactory...");
    const PropertyFactory = await ethers.getContractFactory("PropertyFactory");
    const propertyFactory = await upgrades.deployProxy(PropertyFactory, [
      "PropertyToken", // _name
      "PROP", // _symbol
      eurcAddress, // _paymentToken
      deployer.address, // _admin
      deployer.address, // _validator
    ]);
    await propertyFactory.waitForDeployment();
    const propertyFactoryAddress = propertyFactory.target;
    console.log("PropertyFactory deployed to:", propertyFactoryAddress);

    // Create a test property
    console.log("\nCreating test property...");
    const createPropertyTx = await propertyFactory.createProperty(
      "Test Villa", // title (max 20 chars)
      "Luxury villa with pool", // description (max 50 chars)
      "123 Test St, City", // location (max 256 chars)
      "https://example.com/img.jpg", // imageUrl (max 100 chars)
      ethers.parseUnits("100", 6), // price (100 EURC)
      1000, // totalSupply (raw value, contract will add decimals)
      "Test Property", // name
      "TEST" // symbol
    );
    const receipt = await createPropertyTx.wait();
    
    // Get the property token address from the event logs
    const propertySubmittedEvent = receipt?.logs.find(
      (log: any) => log.fragment?.name === "PropertySubmitted"
    );
    if (!propertySubmittedEvent) {
      throw new Error("PropertySubmitted event not found");
    }
    const testPropertyAddress = propertySubmittedEvent.args[1]; // tokenAddress is the second argument
    console.log("Test PropertyToken deployed to:", testPropertyAddress);

    // Approve the test property
    console.log("\nApproving test property...");
    await propertyFactory.approveProperty(testPropertyAddress);
    console.log("Test property approved");

    // Deploy StakingFactory
    console.log("\nDeploying StakingFactory...");
    const StakingFactory = await ethers.getContractFactory("StakingFactory");
    const stakingFactory = await StakingFactory.deploy(
      mockEURC.target,
      deployer.address // initialOwner
    );
    await stakingFactory.waitForDeployment();
    const stakingFactoryAddress = stakingFactory.target;
    console.log("StakingFactory deployed to:", stakingFactoryAddress);

    // Setup staking rewards parameters
    const rewardsDuration = 365 * 24 * 60 * 60; // 1 year in seconds
    const rewardsAmount = ethers.parseUnits("1000", 6); // 1000 EURC with 6 decimals

    // Mint EURC tokens to StakingFactory for rewards
    await mockEURC.mint(stakingFactoryAddress, rewardsAmount);
    console.log("Minted", ethers.formatUnits(rewardsAmount, 6), "EURC to StakingFactory");

    // Create staking rewards for test property
    console.log("\nCreating staking rewards for test property...");
    await stakingFactory.createStakingRewards(
      testPropertyAddress,
      rewardsDuration,
      rewardsAmount
    );
    const stakingRewardsAddress = await stakingFactory.getStakingRewards(testPropertyAddress);
    console.log("StakingRewards created at:", stakingRewardsAddress);

    // Update .env.local with the new contract addresses
    updateEnvFiles(
      path.join(__dirname, "../.."),
      {
        PROPERTY_FACTORY_ADDRESS: propertyFactoryAddress,
        EURC_TOKEN_ADDRESS: eurcAddress,
        STAKING_FACTORY_ADDRESS: stakingFactoryAddress,
        TEST_PROPERTY_ADDRESS: testPropertyAddress,
        TEST_STAKING_REWARDS_ADDRESS: stakingRewardsAddress,
      }
    );

    console.log("\nUpdated .env and .env.local with new contract addresses");

    // Create abis directory if it doesn't exist
    const contractsPath = path.join(__dirname, "../artifacts/contracts");
    const frontendAbiPath = path.join(__dirname, "../abis");

    if (!fs.existsSync(frontendAbiPath)) {
      fs.mkdirSync(frontendAbiPath, { recursive: true });
    }

    // Helper function to copy ABI
    const copyAbi = async (contractName: string, address: string) => {
      const artifactPath = path.join(
        contractsPath,
        `${contractName}.sol/${contractName}.json`
      );

      if (!fs.existsSync(artifactPath)) {
        console.error(
          `Artifact for ${contractName} not found at ${artifactPath}`
        );
        return;
      }

      const artifact = require(artifactPath);
      const abiPath = path.join(frontendAbiPath, `${contractName}.json`);
      fs.writeFileSync(
        abiPath,
        JSON.stringify(
          {
            address,
            abi: artifact.abi,
          },
          null,
          2
        )
      );
      console.log(`Copied ABI for ${contractName} to ${abiPath}`);
    };

    // Copy ABIs for all contracts
    await copyAbi("PropertyFactory", propertyFactoryAddress);
    await copyAbi("MockEURC", eurcAddress);
    await copyAbi("StakingFactory", stakingFactoryAddress);
    await copyAbi("PropertyToken", testPropertyAddress);
    await copyAbi("StakingRewards", stakingRewardsAddress);

  } catch (error) {
    console.error("Error during deployment:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
