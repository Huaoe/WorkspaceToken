import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";

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
    await mockEURC.deploymentTransaction()?.wait();
    const eurcAddress = await mockEURC.getAddress();
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
    const propertyFactoryAddress = await propertyFactory.getAddress();
    console.log("PropertyFactory deployed to:", propertyFactoryAddress);

    // Deploy StakingRewards contract
    console.log("\nDeploying StakingRewards...");
    const StakingRewards = await ethers.getContractFactory("StakingRewards");
    const stakingRewards = await StakingRewards.deploy(
      eurcAddress, // stakingToken (EURC)
      eurcAddress  // rewardsToken (also EURC for simplicity)
    );
    await stakingRewards.deploymentTransaction()?.wait();
    const stakingRewardsAddress = await stakingRewards.getAddress();
    console.log("StakingRewards deployed to:", stakingRewardsAddress);

    // Update .env.local with the new contract addresses
    const envPath = path.join(__dirname, "../../.env.local");
    const envLocalContent = fs.existsSync(envPath)
      ? fs.readFileSync(envPath, "utf8")
      : "";

    const envPath2 = path.join(__dirname, "../.env");
    const envContent = fs.existsSync(envPath2)
      ? fs.readFileSync(envPath2, "utf8")
      : "";

    const updatedEnvLocalContent = updateEnvFile(
      envLocalContent,
      {
        NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS: propertyFactoryAddress,
        NEXT_PUBLIC_EURC_TOKEN_ADDRESS: eurcAddress,
        NEXT_PUBLIC_STAKING_REWARDS_ADDRESS: stakingRewardsAddress,
      }
    );

    const updatedEnvContent = updateEnvFile(
      envContent,
      {
        FACTORY_ADDRESS: propertyFactoryAddress,
        NEXT_PUBLIC_EURC_TOKEN_ADDRESS: eurcAddress,
      }
    );

    fs.writeFileSync(envPath, updatedEnvLocalContent);
    fs.writeFileSync(envPath2, updatedEnvContent);

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
      fs.writeFileSync(
        path.join(frontendAbiPath, `${contractName}.json`),
        JSON.stringify(
          {
            abi: artifact.abi,
            address: address,
          },
          null,
          2
        )
      );
    };

    // Copy ABIs for all contracts
    await copyAbi("PropertyFactory", propertyFactoryAddress);
    await copyAbi("MockEURC", eurcAddress);
    await copyAbi("StakingRewards", stakingRewardsAddress);

    console.log("\nContract ABIs copied to abis directory");
  } catch (error) {
    console.error("Error during deployment:", error);
    throw error;
  }
}

function updateEnvFile(envContent: string, newValues: { [key: string]: string }) {
  Object.keys(newValues).forEach((key) => {
    const regex = new RegExp(`${key}=.*`);
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${newValues[key]}`);
    } else {
      envContent = envContent ? `${envContent}\n${key}=${newValues[key]}` : `${key}=${newValues[key]}`;
    }
  });
  return envContent;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
