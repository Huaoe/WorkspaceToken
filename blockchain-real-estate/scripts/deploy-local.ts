import { ethers } from "hardhat";
import * as fs from 'fs';
import * as path from 'path';

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
    await mockEURC.deployed();
    const eurcAddress = mockEURC.address;
    console.log("Mock EURC deployed to:", eurcAddress);

    // Deploy PropertyFactory with the mock EURC address
    console.log("\nDeploying PropertyFactory...");
    const PropertyFactory = await ethers.getContractFactory("PropertyFactory");
    const propertyFactory = await PropertyFactory.deploy(deployer.address, eurcAddress);
    await propertyFactory.deployed();
    
    console.log("PropertyFactory deployed to:", propertyFactory.address);

    // Update .env.local with the new contract addresses
    const envPath = path.join(__dirname, '../.env.local');
    let envContent = '';
    
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch (error) {
      console.log('No existing .env.local file found. Creating new one.');
    }

    // Update or add the contract addresses
    const factoryRegex = /NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS=.*/;
    const eurcRegex = /NEXT_PUBLIC_EURC_TOKEN_ADDRESS=.*/;
    
    const newFactoryLine = `NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS=${propertyFactory.address}`;
    const newEurcLine = `NEXT_PUBLIC_EURC_TOKEN_ADDRESS=${eurcAddress}`;
    
    if (envContent.match(factoryRegex)) {
      envContent = envContent.replace(factoryRegex, newFactoryLine);
    } else {
      envContent = envContent ? `${envContent}\n${newFactoryLine}` : newFactoryLine;
    }

    if (envContent.match(eurcRegex)) {
      envContent = envContent.replace(eurcRegex, newEurcLine);
    } else {
      envContent = `${envContent}\n${newEurcLine}`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('Updated .env.local with new contract addresses');

  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
