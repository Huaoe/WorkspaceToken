import { ethers } from "hardhat";

async function main(propertyTokenAddress: string) {
  const [deployer] = await ethers.getSigners();
  console.log("Transferring ownership with account:", deployer.address);
  console.log("Property address:", propertyTokenAddress);

  const propertyToken = await ethers.getContractAt("PropertyToken", propertyTokenAddress);

  // Get current owner
  const currentOwner = await propertyToken.owner();
  console.log("Current owner:", currentOwner);

  // Transfer ownership to deployer if not already owner
  if (currentOwner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log("Transferring ownership to:", deployer.address);
    const tx = await propertyToken.transferOwnership(deployer.address);
    await tx.wait();
    console.log("Ownership transferred successfully");
  } else {
    console.log("Deployer is already the owner");
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  main(process.argv[2])
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { main };
