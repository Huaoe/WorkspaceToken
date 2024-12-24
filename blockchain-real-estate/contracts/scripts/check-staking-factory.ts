import { ethers } from "ethers";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

async function main() {
  // Load environment variables from the correct .env.local file
  const envLocalPath = path.join(process.cwd(), '..', '.env.local');
  if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
  } else {
    throw new Error(".env.local file not found");
  }

  const stakingFactoryAddress = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
  
  if (!stakingFactoryAddress) {
    console.log("\n❌ STAKING_FACTORY address not found in environment variables");
    return;
  }

  // Connect to the network
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
  
  try {
    // Get the contract code at the address
    const code = await provider.getCode(stakingFactoryAddress);
    
    // If there's no code at the address, code will be "0x"
    const isDeployed = code !== "0x";
    
    console.log("\nSTAKING_FACTORY Deployment Check:");
    console.log("--------------------------------");
    console.log("Address:", stakingFactoryAddress);
    console.log("Status:", isDeployed ? "✅ Deployed" : "❌ Not Deployed");
    
    if (isDeployed) {
      console.log("Contract Code Length:", (code.length - 2) / 2, "bytes");
    }
  } catch (error) {
    console.error("\n❌ Error checking contract deployment:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
