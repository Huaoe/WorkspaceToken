import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment...");

  // Deploy MockEURC first
  console.log("\nDeploying MockEURC...");
  const MockEURC = await ethers.getContractFactory("MockEURC");
  const mockEURC = await MockEURC.deploy(await ethers.provider.getSigner(0).getAddress());
  await mockEURC.waitForDeployment();
  console.log("MockEURC deployed to:", await mockEURC.getAddress());

  // Deploy PropertyFactory
  console.log("\nDeploying PropertyFactory...");
  const PropertyFactory = await ethers.getContractFactory("PropertyFactory");
  const propertyFactory = await PropertyFactory.deploy();
  await propertyFactory.waitForDeployment();
  console.log("PropertyFactory deployed to:", await propertyFactory.getAddress());

  // Initialize PropertyFactory
  console.log("\nInitializing PropertyFactory...");
  const [deployer] = await ethers.getSigners();
  await propertyFactory.initialize(
    "Property Token",
    "PROP",
    await mockEURC.getAddress(),
    deployer.address,
    deployer.address
  );
  console.log("PropertyFactory initialized");

  console.log("\nDeployment completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
