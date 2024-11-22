import { ethers } from "hardhat";
import * as fs from 'fs';
import * as path from 'path';

// EURC token address on Sepolia testnet
const EURC_ADDRESS = "0x86dB2d5b6e6A6E8C3cF1e7FE03F1F2b0Cf7B510";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  try {
    // Deploy PropertyFactory with the EURC address
    console.log("\nDeploying PropertyFactory...");
    const PropertyFactory = await ethers.getContractFactory("PropertyFactory");
    const propertyFactory = await PropertyFactory.deploy(deployer.address, EURC_ADDRESS);
    await propertyFactory.waitForDeployment();

    const propertyFactoryAddress = await propertyFactory.getAddress();
    console.log("PropertyFactory deployed to:", propertyFactoryAddress);

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
    
    const newFactoryLine = `NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS=${propertyFactoryAddress}`;
    const newEurcLine = `NEXT_PUBLIC_EURC_TOKEN_ADDRESS=${EURC_ADDRESS}`;
    
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

    // Copy the ABIs to the frontend
    const contractNames = ['PropertyFactory', 'PropertyToken'];
    
    for (const contractName of contractNames) {
      const artifactPath = path.join(__dirname, `../artifacts/contracts/${contractName}.sol/${contractName}.json`);
      const abiPath = path.join(__dirname, `../src/contracts/abis/${contractName.toLowerCase()}ABI.ts`);
      
      const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
      const abiContent = `export const ${contractName.toLowerCase()}ABI = ${JSON.stringify(artifact.abi, null, 2)} as const;`;
      
      // Ensure the directory exists
      const abiDir = path.dirname(abiPath);
      if (!fs.existsSync(abiDir)) {
        fs.mkdirSync(abiDir, { recursive: true });
      }
      
      fs.writeFileSync(abiPath, abiContent);
      console.log(`Copied ${contractName} ABI to frontend`);
    }

    // Create sample properties with shorter text to match validation
    const properties = [
      {
        title: "Beach Villa",
        description: "Luxury beachfront villa with pool",
        location: "Miami Beach",
        imageUrl: "https://theluxuryvillacollection.com/wp-content/uploads/2018/01/Villa-Zensei-Marbella-luxury-designer-villa-1.jpg",
        price: ethers.parseEther("2.0"),
      },
      {
        title: "City Apartment",
        description: "Modern downtown apartment",
        location: "New York",
        imageUrl: "https://villascroatia.com/wp-content/uploads/2020/08/modern-luxury-villa-pool-medulin-croatia-15-1.jpg",
        price: ethers.parseEther("1.5"),
      },
    ];

    console.log("\nCreating sample properties...");
    
    for (const property of properties) {
      console.log(`\nAttempting to create property: ${property.title}`);
      console.log("Property details:", {
        title: property.title,
        description: property.description,
        location: property.location,
        imageUrl: property.imageUrl,
        price: property.price.toString()
      });

      try {
        const tx = await propertyFactory.createProperty(
          property.title,
          property.description,
          property.location,
          property.imageUrl,
          property.price
        );
        console.log("Transaction hash:", tx.hash);
        const receipt = await tx.wait();
        console.log(`Created property: ${property.title}`);
        console.log("Transaction receipt:", {
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status
        });
      } catch (error) {
        console.error(`Failed to create property ${property.title}:`, error);
      }
    }

    // Get all properties
    const userProperties = await propertyFactory.getUserProperties(deployer.address);
    console.log("\nDeployed properties:", userProperties);

    console.log("\nDeployment complete! Please:");
    console.log("1. Restart your Next.js development server");
    console.log("2. Reset your MetaMask account");
    console.log("3. Switch to the Hardhat network (Chain ID: 31337)");
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
