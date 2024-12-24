import { ethers } from "hardhat";
import * as path from "path";
import * as fs from "fs";
import dotenv from "dotenv";

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
    console.log("Setting validator with account:", deployer.address);

    // Get PropertyFactory Contract
    const propertyFactoryAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS;
    if (!propertyFactoryAddress) {
      throw new Error("PropertyFactory address not found in environment variables");
    }

    console.log("\nPropertyFactory Address:", propertyFactoryAddress);

    // Get contract instance
    const propertyFactory = await ethers.getContractAt("PropertyFactory", propertyFactoryAddress);
    
    // Get current validator
    const currentValidator = await propertyFactory.validator();
    console.log("Current validator:", currentValidator);

    // Set validator to deployer address
    console.log("Setting validator to:", deployer.address);
    const tx = await propertyFactory.setValidator(deployer.address, {
      gasLimit: 500000
    });
    await tx.wait();

    // Verify the change
    const newValidator = await propertyFactory.validator();
    console.log("New validator:", newValidator);

    if (newValidator.toLowerCase() === deployer.address.toLowerCase()) {
      console.log("✅ Validator successfully updated");
    } else {
      console.log("❌ Validator update failed");
    }

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
