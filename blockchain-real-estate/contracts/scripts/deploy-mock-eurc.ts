import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MockEURC with the account:", deployer.address);

  const MockEURC = await ethers.getContractFactory("MockEURC");
  const mockEURC = await MockEURC.deploy(deployer.address);
  await mockEURC.waitForDeployment();

  const address = await mockEURC.getAddress();
  console.log("MockEURC deployed to:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
