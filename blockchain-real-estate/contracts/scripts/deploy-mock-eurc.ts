import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying MockEURC with the account:", deployer.address);

  const MockEURC = await ethers.getContractFactory("MockEURC");
  const mockEURC = await MockEURC.deploy(deployer.address);
  await mockEURC.waitForDeployment();

  const address = await mockEURC.getAddress();
  console.log("MockEURC deployed to:", address);

  // Update .env and .env.local with the new contract address
  const envPaths = [
    path.join(__dirname, "../.env"),
    path.join(__dirname, "../../.env.local")
  ];

  for (const envPath of envPaths) {
    let envContent = "";
    try {
      envContent = fs.readFileSync(envPath, "utf8");
    } catch (error) {
      console.log(`No existing ${path.basename(envPath)} file found. Creating new one.`);
    }

    // Update or add the EURC token address
    const eurcRegex = /NEXT_PUBLIC_EURC_TOKEN_ADDRESS=.*/;
    const newEurcLine = `NEXT_PUBLIC_EURC_TOKEN_ADDRESS=${address}`;

    if (envContent.match(eurcRegex)) {
      envContent = envContent.replace(eurcRegex, newEurcLine);
    } else {
      envContent = envContent ? `${envContent}\n${newEurcLine}` : newEurcLine;
    }

    fs.writeFileSync(envPath, envContent);
    console.log(`\nUpdated ${path.basename(envPath)} with new MockEURC address`);
  }

  // Create/update ABI file
  const contractsPath = path.join(__dirname, "../artifacts/contracts");
  const frontendAbiPath = path.join(__dirname, "../abis");

  if (!fs.existsSync(frontendAbiPath)) {
    fs.mkdirSync(frontendAbiPath, { recursive: true });
  }

  const artifactPath = path.join(contractsPath, "MockEURC.sol/MockEURC.json");
  if (!fs.existsSync(artifactPath)) {
    console.error(`Artifact for MockEURC not found at ${artifactPath}`);
    return;
  }

  const artifact = require(artifactPath);
  fs.writeFileSync(
    path.join(frontendAbiPath, "MockEURC.json"),
    JSON.stringify(
      {
        abi: artifact.abi,
        address: address,
      },
      null,
      2
    )
  );
  console.log("\nUpdated MockEURC ABI file with new address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
