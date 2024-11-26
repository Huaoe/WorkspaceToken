import { ethers } from "hardhat";
import { PropertyFactory } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Debugging with account:", deployer.address);

  // Get the PropertyFactory contract
  const factoryAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const factory = await ethers.getContractAt("PropertyFactory", factoryAddress) as PropertyFactory;

  // Get contract info
  const admin = await factory.admin();
  console.log("Contract admin:", admin);
  console.log("Caller address:", deployer.address);

  // Property address to approve
  const propertyAddress = "0xecae6cc78251a4f3b8d70c9bd4de1b3742338489";

  // Get property information
  const isApproved = await factory.approvedProperties(propertyAddress);
  console.log("Property approved status:", isApproved);

  // Get all creators
  const creators = await factory.getPropertyCreators();
  console.log("Property creators:", creators);

  // Check each creator's properties
  console.log("\nChecking properties for each creator:");
  for (const creator of creators) {
    const properties = await factory.getUserProperties(creator);
    console.log(`\nProperties for creator ${creator}:`);
    for (const prop of properties) {
      console.log("- Token address:", prop.tokenAddress);
      console.log("  Is approved:", prop.isApproved);
    }
  }

  // Try to approve the property
  console.log("\nAttempting to approve property...");
  try {
    const tx = await factory.approveProperty(propertyAddress, {
      gasLimit: 1000000 // Set high gas limit
    });
    console.log("Transaction hash:", tx.hash);
    await tx.wait();
    console.log("Property approved successfully!");
  } catch (error) {
    console.error("Failed to approve property:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
