import { ethers } from "hardhat";
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  try {
    // Deploy PropertyFactory
    console.log("\nDeploying PropertyFactory...");
    const PropertyFactory = await ethers.getContractFactory("PropertyFactory");
    const propertyFactory = await PropertyFactory.deploy(deployer.address);
    await propertyFactory.waitForDeployment();

    const propertyFactoryAddress = await propertyFactory.getAddress();
    console.log("PropertyFactory deployed to:", propertyFactoryAddress);

    // Update .env.local with the new contract address
    const envPath = path.join(__dirname, '../.env.local');
    let envContent = '';
    
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch (error) {
      console.log('No existing .env.local file found. Creating new one.');
    }

    // Update or add the contract address
    const addressRegex = /NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS=.*/;
    const newAddressLine = `NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS=${propertyFactoryAddress}`;
    
    if (envContent.match(addressRegex)) {
      envContent = envContent.replace(addressRegex, newAddressLine);
    } else {
      envContent = envContent ? `${envContent}\n${newAddressLine}` : newAddressLine;
    }

    fs.writeFileSync(envPath, envContent);
    console.log('Updated .env.local with new contract address');

    // Copy the ABI to the frontend
    const artifactPath = path.join(__dirname, '../artifacts/contracts/PropertyFactory.sol/PropertyFactory.json');
    const abiPath = path.join(__dirname, '../src/contracts/abis/propertyFactoryABI.ts');
    
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const abiContent = `export const propertyFactoryABI = ${JSON.stringify(artifact.abi, null, 2)} as const;`;
    
    // Ensure the directory exists
    const abiDir = path.dirname(abiPath);
    if (!fs.existsSync(abiDir)) {
      fs.mkdirSync(abiDir, { recursive: true });
    }
    
    fs.writeFileSync(abiPath, abiContent);
    console.log('Updated ABI file');

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
