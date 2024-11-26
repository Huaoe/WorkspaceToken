import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Checking contracts with account:", deployer.address);

  const addresses = [
    "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",  // From .env.local
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"   // From debug script
  ];

  for (const address of addresses) {
    console.log(`\nChecking contract at ${address}:`);
    try {
      const factory = await ethers.getContractAt("PropertyFactory", address);
      
      // Try to call some view functions
      const admin = await factory.admin();
      console.log("Contract admin:", admin);
      
      const creators = await factory.getPropertyCreators();
      console.log("Property creators:", creators);
      
      console.log("✅ Contract exists and is accessible");
    } catch (error) {
      console.error("❌ Error accessing contract:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
