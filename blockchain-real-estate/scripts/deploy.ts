import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy Mock EURC first
  console.log("Deploying Mock EURC...");
  const MockEURC = await ethers.getContractFactory("MockEURC");
  const mockEURC = await MockEURC.deploy(deployer.address);
  await mockEURC.waitForDeployment();

  const mockEURCAddress = await mockEURC.getAddress();
  console.log("MockEURC deployed to:", mockEURCAddress);

  // Deploy PropertyFactory with EURC address
  console.log("Deploying PropertyFactory...");
  const PropertyFactory = await ethers.getContractFactory("PropertyFactory");
  const propertyFactory = await PropertyFactory.deploy(deployer.address, mockEURCAddress);
  await propertyFactory.waitForDeployment();

  const propertyFactoryAddress = await propertyFactory.getAddress();
  console.log("PropertyFactory deployed to:", propertyFactoryAddress);

  // Create a sample property for testing
  console.log("Creating sample property...");
  const createPropertyTx = await propertyFactory.createProperty(
    "Sample Luxury Villa",
    "A beautiful villa with ocean view",
    "Miami, FL",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914",
    ethers.parseEther("2.5") // 2.5 ETH
  );

  await createPropertyTx.wait();
  console.log("Sample property created");

  // Get the user's properties
  const userProperties = await propertyFactory.getUserProperties(deployer.address);
  console.log("User properties:", userProperties);

  // Approve the property
  if (userProperties.length > 0) {
    const propertyAddress = userProperties[0].tokenAddress;
    await propertyFactory.approveProperty(propertyAddress);
    console.log("Property approved:", propertyAddress);
  }

  // Log all the deployed addresses for easy reference
  console.log("\nDeployed Addresses:");
  console.log("-------------------");
  console.log("MockEURC:", mockEURCAddress);
  console.log("PropertyFactory:", propertyFactoryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
