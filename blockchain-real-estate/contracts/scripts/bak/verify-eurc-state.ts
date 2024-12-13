import { ethers } from "hardhat";
import { MockEURC } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Verifying MockEURC state with account:", deployer.address);

  // MockEURC contract address from deployment
  const mockEURCAddress = process.env.EURC_TOKEN_ADDRESS;
  console.log("MockEURC address:", mockEURCAddress);

  // Get the MockEURC contract instance
  const mockEURC = await ethers.getContractAt("MockEURC", mockEURCAddress) as MockEURC;

  try {
    // Check basic token info
    const name = await mockEURC.name();
    const symbol = await mockEURC.symbol();
    const decimals = await mockEURC.decimals();
    const totalSupply = await mockEURC.totalSupply();
    
    console.log("\nToken Info:");
    console.log("Name:", name);
    console.log("Symbol:", symbol);
    console.log("Decimals:", decimals);
    console.log("Total Supply:", ethers.formatUnits(totalSupply, decimals));

    // Check owner
    const owner = await mockEURC.owner();
    console.log("\nOwner:", owner);
    console.log("Is deployer owner?", owner === deployer.address);

    // Check deployer balance
    const deployerBalance = await mockEURC.balanceOf(deployer.address);
    console.log("\nDeployer balance:", ethers.formatUnits(deployerBalance, decimals));

  } catch (error) {
    console.error("Error verifying MockEURC state:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
