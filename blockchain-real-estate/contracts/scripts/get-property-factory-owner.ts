import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

async function main() {
  try {
    // Load environment variables from the correct .env.local file
    const envLocalPath = path.join(process.cwd(), '..', '.env.local');
    if (fs.existsSync(envLocalPath)) {
      dotenv.config({ path: envLocalPath });
      console.log("Loaded environment from:", envLocalPath);
    } else {
      throw new Error(".env.local file not found at: " + envLocalPath);
    }

    const [deployer] = await ethers.getSigners();
    console.log("Checking with account:", deployer.address);

    // Get PropertyFactory Contract
    const propertyFactoryAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS;
    if (!propertyFactoryAddress) {
      throw new Error("PropertyFactory address not found in environment variables");
    }

    console.log("\nPropertyFactory Address:", propertyFactoryAddress);

    // Get contract instance
    const propertyFactory = await ethers.getContractAt("PropertyFactory", propertyFactoryAddress);
    
    // Get owner
    const owner = await propertyFactory.owner();
    console.log("PropertyFactory Owner:", owner);

    // Additional checks
    const isDeployerOwner = owner.toLowerCase() === deployer.address.toLowerCase();
    console.log("\nIs deployer the owner?", isDeployerOwner);

  } catch (error: any) {
    console.error("Error:", {
      message: error.message,
      code: error.code,
      data: error.data,
    });
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });