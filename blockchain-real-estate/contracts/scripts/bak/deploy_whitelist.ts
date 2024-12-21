import { ethers, upgrades } from "hardhat";
import * as fs from 'fs';
import * as path from 'path';
import { updateEnvFile } from '../utils/env-management';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying Whitelist contract with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", balance.toString());

  try {
    // Deploy Whitelist with Proxy
    console.log("\nDeploying Whitelist...");
    const Whitelist = await ethers.getContractFactory("Whitelist");
    
    const whitelistProxy = await upgrades.deployProxy(Whitelist, [
      deployer.address // initialOwner
    ]);

    await whitelistProxy.waitForDeployment();
    const whitelistProxyAddress = await whitelistProxy.getAddress();
    console.log("Whitelist Proxy deployed to:", whitelistProxyAddress);
    
    // Get whitelist implementation address
    const whitelistImplementationAddress = await upgrades.erc1967.getImplementationAddress(whitelistProxyAddress);
    console.log("Whitelist Implementation deployed to:", whitelistImplementationAddress);
    
    // Get whitelist admin address
    const whitelistAdminAddress = await upgrades.erc1967.getAdminAddress(whitelistProxyAddress);
    console.log("Whitelist ProxyAdmin deployed to:", whitelistAdminAddress);

    // Update both .env files
    const envLocalPath = path.join(__dirname, "../.env.local");
    const envPath = path.join(__dirname, "../.env");

    let envLocalContent = '';
    let envContent = '';
    
    try {
      envLocalContent = fs.existsSync(envLocalPath) ? fs.readFileSync(envLocalPath, "utf8") : "";
      envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
    } catch (error) {
      console.log("One or both .env files not found. Will create new ones as needed.");
    }

    // Values for .env.local (frontend)
    const updatedEnvLocalContent = updateEnvFile(envLocalContent, {
      NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS: whitelistProxyAddress,
      NEXT_PUBLIC_WHITELIST_IMPLEMENTATION_ADDRESS: whitelistImplementationAddress,
      NEXT_PUBLIC_WHITELIST_ADMIN_ADDRESS: whitelistAdminAddress,
    });

    // Values for .env (contracts)
    const updatedEnvContent = updateEnvFile(envContent, {
      WHITELIST_PROXY_ADDRESS: whitelistProxyAddress,
      WHITELIST_IMPLEMENTATION_ADDRESS: whitelistImplementationAddress,
      WHITELIST_ADMIN_ADDRESS: whitelistAdminAddress,
    });

    fs.writeFileSync(envLocalPath, updatedEnvLocalContent);
    fs.writeFileSync(envPath, updatedEnvContent);

    console.log("\nUpdated .env and .env.local with new contract addresses");

  } catch (error) {
    console.error("Error during deployment:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
