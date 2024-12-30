import { ethers, upgrades } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying property token with account:", deployer.address);

  // Deploy PropertyToken with deployer as owner
  const PropertyToken = await ethers.getContractFactory("PropertyToken");
  const propertyToken = await upgrades.deployProxy(PropertyToken, [{
    name: "Test Property",
    symbol: "TEST",
    title: "Test Property",
    description: "Test Description",
    location: "Test Location",
    imageUrl: "https://test.image.url",
    price: ethers.parseUnits("56", 6), // 56 EURC
    totalSupply: ethers.parseUnits("1000", 18), // 1000 tokens
    initialOwner: deployer.address,
    eurcTokenAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Replace with actual EURC address
    whitelistContract: "0x5FbDB2315678afecb367f032d93F642f64180aa3"  // Replace with actual whitelist address
  }], {
    kind: 'uups',
    initializer: 'initialize'
  });

  await propertyToken.waitForDeployment();
  const propertyTokenAddress = await propertyToken.getAddress();
  console.log("Property Token deployed to:", propertyTokenAddress);

  // Verify ownership
  const owner = await propertyToken.owner();
  console.log("Property Token owner:", owner);
  console.log("Deployer address:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
