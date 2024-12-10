import { ethers, upgrades } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Upgrading contract with the account:", deployer.address);

  try {
    const proxyAddress = process.env.PROPERTY_TOKEN_PROXY_ADDRESS;
    if (!proxyAddress) {
      throw new Error("PROPERTY_TOKEN_PROXY_ADDRESS not found in .env");
    }

    console.log("Current PropertyToken proxy address:", proxyAddress);

    // Deploy new implementation
    console.log("\nDeploying new PropertyToken implementation...");
    const PropertyToken = await ethers.getContractFactory("PropertyToken");
    const upgraded = await upgrades.upgradeProxy(proxyAddress, PropertyToken);

    await upgraded.waitForDeployment();
    console.log("Upgrade complete!");

    // Get new implementation address
    const newImplementationAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);
    console.log("New implementation address:", newImplementationAddress);

    // Update both .env files
    const envLocalPath = path.join(__dirname, "../../.env.local");
    const envPath = path.join(__dirname, "../.env");

    let envLocalContent = '';
    let envContent = '';
    
    try {
      envLocalContent = fs.existsSync(envLocalPath) ? fs.readFileSync(envLocalPath, "utf8") : "";
      envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
    } catch (error) {
      console.log("One or both .env files not found. Will create new ones as needed.");
    }

    // Update implementation address in both files
    const updatedEnvLocalContent = updateEnvFile(envLocalContent, {
      NEXT_PUBLIC_PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS: newImplementationAddress,
    });

    const updatedEnvContent = updateEnvFile(envContent, {
      PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS: newImplementationAddress,
    });

    fs.writeFileSync(envLocalPath, updatedEnvLocalContent);
    fs.writeFileSync(envPath, updatedEnvContent);

    console.log("\nUpdated .env and .env.local with new implementation address");

  } catch (error) {
    console.error("Error during upgrade:", error);
    throw error;
  }
}

function updateEnvFile(envContent: string, newValues: { [key: string]: string }) {
  const envLines = envContent.split("\n");
  const updatedLines = envLines.filter((line) => {
    const key = line.split("=")[0];
    return !newValues.hasOwnProperty(key);
  });

  for (const [key, value] of Object.entries(newValues)) {
    updatedLines.push(`${key}=${value}`);
  }

  return updatedLines.join("\n") + "\n";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
