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
    console.log(
      "PropertyFactory deployed to:",
      await propertyFactory.getAddress()
    );

    // Update .env.local with the new contract addresses
    const envPath = path.join(__dirname, "../../.env.local");
    let envContent = "";

    try {
      envContent = fs.readFileSync(envPath, "utf8");
    } catch (error) {
      console.log("No existing .env.local file found. Creating new one.");
    }

    // Update or add the contract addresses
    const factoryRegex = /NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS=.*/;
    const eurcRegex = /NEXT_PUBLIC_EURC_TOKEN_ADDRESS=.*/;

    const newFactoryLine = `NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS=${await propertyFactory.getAddress()}`;
    const newEurcLine = `NEXT_PUBLIC_EURC_TOKEN_ADDRESS=${eurcAddress}`;

    if (envContent.match(factoryRegex)) {
      envContent = envContent.replace(factoryRegex, newFactoryLine);
    } else {
      envContent = envContent
        ? `${envContent}\n${newFactoryLine}`
        : newFactoryLine;
    }

    if (envContent.match(eurcRegex)) {
      envContent = envContent.replace(eurcRegex, newEurcLine);
    } else {
      envContent = envContent ? `${envContent}\n${newEurcLine}` : newEurcLine;
    }

    fs.writeFileSync(envPath, envContent);
    console.log("\nUpdated .env.local with new contract addresses");

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
      console.log(`Copied ${contractName} ABI to frontend`);
    };

    // Copy ABIs
    await copyAbi("PropertyFactory", await propertyFactory.getAddress());
    await copyAbi("MockEURC", eurcAddress);

    console.log("\nSuccessfully copied all ABIs to frontend");
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
