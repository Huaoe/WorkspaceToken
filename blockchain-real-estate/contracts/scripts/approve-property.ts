import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

export async function main(propertyTokenAddress: string) {
  // Load environment variables from the correct .env.local file
  const envLocalPath = path.join(process.cwd(), '..', '.env.local');
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  } else {
    throw new Error(".env.local file not found");
  }

  // Get the PropertyFactory contract address from environment variables
  const factoryAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS;
  if (!factoryAddress) {
    throw new Error("PropertyFactory address not found in environment variables");
  }

  const [deployer] = await ethers.getSigners();
  console.log("Approving property with account:", deployer.address);

  // Get the PropertyFactory contract instance
  const factory = await ethers.getContractAt("PropertyFactory", factoryAddress);

  // Validate the address
  if (!ethers.isAddress(propertyTokenAddress)) {
    throw new Error(`Invalid property token address: ${propertyTokenAddress}`);
  }

  try {
    // Approve the property
    console.log(`Approving property at address: ${propertyTokenAddress}`);
    const tx = await factory.approveProperty(propertyTokenAddress);
    await tx.wait();
    
    console.log(`Successfully approved property at: ${propertyTokenAddress}`);

    // Get property details to confirm
    const properties = await factory.getAllProperties();
    const approvedProperty = properties.find(p => p.tokenAddress.toLowerCase() === propertyTokenAddress.toLowerCase());
    
    if (approvedProperty) {
      console.log("\nProperty Details:");
      console.log("Token Address:", approvedProperty.tokenAddress);
      console.log("Is Approved:", approvedProperty.isApproved);
    }

    // Get the PropertyToken instance to show more details
    const propertyToken = await ethers.getContractAt("PropertyToken", propertyTokenAddress);
    const details = await propertyToken.propertyDetails();
    
    console.log("\nDetailed Property Information:");
    console.log("Title:", details.title);
    console.log("Description:", details.description);
    console.log("Location:", details.location);
    console.log("Image URL:", details.imageUrl);
    console.log("Price:", ethers.formatUnits(details.price, 6), "EURC"); 
    console.log("Is Active:", details.isActive);

    // Get token information
    const name = await propertyToken.name();
    const symbol = await propertyToken.symbol();
    const totalSupply = await propertyToken.totalSupply();
    
    console.log("\nToken Information:");
    console.log("Name:", name);
    console.log("Symbol:", symbol);
    console.log("Total Supply:", ethers.formatEther(totalSupply), "tokens");
  } catch (error) {
    console.error(`Error approving property ${propertyTokenAddress}:`, error);
    throw error;
  }
}

// Allow running directly from command line
if (require.main === module) {
  if (!process.argv[2]) {
    console.error("Please provide a property token address");
    process.exit(1);
  }

  main(process.argv[2])
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
