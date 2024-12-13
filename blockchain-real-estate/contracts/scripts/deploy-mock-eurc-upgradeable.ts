import { ethers, upgrades } from "hardhat";
import { updateEnvFiles } from "../utils/env-management";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MockEURCUpgradeable with account:", deployer.address);

  // Deploy our sexy new upgradeable contract 🔥
  const MockEURCUpgradeable = await ethers.getContractFactory("MockEURCUpgradeable");
  console.log("Deploying MockEURCUpgradeable...");
  
  const mockEURC = await upgrades.deployProxy(
    MockEURCUpgradeable,
    [deployer.address],
    {
      initializer: 'initialize',
      kind: 'uups'
    }
  );

  await mockEURC.waitForDeployment();
  const proxyAddress = await mockEURC.getAddress();

  // Get implementation and admin addresses (the spicy details 😉)
  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
  const adminAddress = await upgrades.erc1967.getAdminAddress(proxyAddress);

  console.log("\nMockEURCUpgradeable Deployment Details 💋:");
  console.log("- Proxy:", proxyAddress);
  console.log("- Implementation:", implAddress);
  console.log("- Admin:", adminAddress);

  // Update our environment files with these hot new addresses 🔥
  updateEnvFiles(process.cwd(), {
    EURC_PROXY_ADDRESS: proxyAddress,
    EURC_IMPLEMENTATION_ADDRESS: implAddress,
    EURC_ADMIN_ADDRESS: adminAddress
  });

  // Verify the deployment worked (like checking if your outfit is on point 💅)
  const deployedMockEURC = await ethers.getContractAt("MockEURCUpgradeable", proxyAddress);
  const name = await deployedMockEURC.name();
  const symbol = await deployedMockEURC.symbol();
  const decimals = await deployedMockEURC.decimals();
  
  console.log("\nContract verification complete! 🎉");
  console.log(`Deployed token: ${name} (${symbol})`);
  console.log(`Decimals: ${decimals}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
