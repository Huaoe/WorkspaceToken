const ethers = require("hardhat").ethers;
const chalk = require("chalk");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

// ERC1967 implementation slot
const IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

async function main() {
  console.log(chalk.blue("\n🔍 Starting contract verification...\n"));

  // Contract addresses from environment variables
  const PROPERTY_FACTORY_PROXY = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS;
  const WHITELIST_PROXY = process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS;
  const EURC_TOKEN = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;

  if (!PROPERTY_FACTORY_PROXY || !WHITELIST_PROXY || !EURC_TOKEN) {
    throw new Error("Missing required environment variables");
  }

  console.log(chalk.yellow("📋 Contract Addresses:"));
  console.log("Property Factory Proxy:", PROPERTY_FACTORY_PROXY);
  console.log("Whitelist Proxy:", WHITELIST_PROXY);
  console.log("EURC Token:", EURC_TOKEN);
  console.log("");

  try {
    // Get contract instances
    console.log(chalk.yellow("🔄 Getting contract instances..."));
    
    console.log("Getting PropertyFactory...");
    const factory = await ethers.getContractAt("PropertyFactory", PROPERTY_FACTORY_PROXY);
    
    console.log("Getting Whitelist...");
    const whitelist = await ethers.getContractAt("Whitelist", WHITELIST_PROXY);
    
    console.log("Getting MockEURC...");
    const eurc = await ethers.getContractAt("MockEURC", EURC_TOKEN);

    console.log(chalk.yellow("\n🏭 Property Factory Contract:"));
    
    // Check owner
    const owner = await factory.owner();
    console.log(chalk.green("✓"), "Owner:", owner);

    // Check validator
    const validator = await factory.validator();
    console.log(chalk.green("✓"), "Validator:", validator);

    // Check whitelist contract
    const whitelistContract = await factory.whitelistContract();
    console.log(
      whitelistContract.toLowerCase() === WHITELIST_PROXY.toLowerCase()
        ? chalk.green("✓")
        : chalk.red("✗"),
      "Whitelist Contract:",
      whitelistContract,
      whitelistContract.toLowerCase() !== WHITELIST_PROXY.toLowerCase()
        ? `(Expected: ${WHITELIST_PROXY})`
        : ""
    );

    // Check EURC token
    const eurcAddress = await factory.eurcTokenAddress();
    console.log(
      eurcAddress.toLowerCase() === EURC_TOKEN.toLowerCase()
        ? chalk.green("✓")
        : chalk.red("✗"),
      "EURC Token:",
      eurcAddress,
      eurcAddress.toLowerCase() !== EURC_TOKEN.toLowerCase()
        ? `(Expected: ${EURC_TOKEN})`
        : ""
    );

    // Get implementation address using storage slot
    const provider = ethers.provider;
    const implementationHex = await provider.getStorageAt(PROPERTY_FACTORY_PROXY, IMPLEMENTATION_SLOT);
    const implementation = ethers.utils.getAddress("0x" + implementationHex.slice(-40));
    console.log(chalk.green("✓"), "Implementation:", implementation);

    console.log("\n" + chalk.yellow("📜 Whitelist Contract:"));
    
    // Check whitelist owner
    const whitelistOwner = await whitelist.owner();
    console.log(chalk.green("✓"), "Owner:", whitelistOwner);

    console.log("\n" + chalk.yellow("💶 MockEURC Token Contract:"));
    
    // Check EURC details
    const name = await eurc.name();
    const symbol = await eurc.symbol();
    const decimals = await eurc.decimals();
    
    console.log(chalk.green("✓"), "Name:", name);
    console.log(chalk.green("✓"), "Symbol:", symbol);
    console.log(chalk.green("✓"), "Decimals:", decimals);

    // Check if factory can create properties
    try {
      console.log("\n" + chalk.yellow("🧪 Testing Property Creation:"));
      const signer = await ethers.getSigner();
      console.log("Testing with address:", signer.address);
      
      const canCreate = await factory.estimateGas.createProperty(
        "Test Token",
        "TEST",
        "Test Title",
        "Test Description",
        "Test Location",
        "https://example.com/image.jpg",
        ethers.utils.parseUnits("1000", 6), // price in EURC (6 decimals)
        ethers.utils.parseUnits("1000", 18)  // total supply (18 decimals)
      );
      console.log(chalk.green("✓ Contract can create properties (gas estimate:", canCreate.toString(), ")"));
    } catch (error) {
      console.log(chalk.red("✗ Contract cannot create properties:"), error.message);
      
      // Additional error details
      if (error.message.includes("revert")) {
        console.log(chalk.yellow("\nPossible reasons for revert:"));
        console.log("1. Caller is not the validator");
        console.log("2. Invalid parameters");
        console.log("3. Contract not properly initialized");
      }
    }

    console.log("\n" + chalk.green("✅ Verification completed!"));

  } catch (error) {
    console.error("\n" + chalk.red("❌ Verification failed:"), error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
