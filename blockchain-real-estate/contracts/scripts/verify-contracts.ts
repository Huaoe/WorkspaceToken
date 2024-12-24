import { ethers } from "hardhat";
import * as path from "path";
import * as fs from "fs";
import dotenv from "dotenv";

// Load environment variables from parent directory's .env.local
const envPath = path.join(process.cwd(), '..', '.env.local');
dotenv.config({ path: envPath });

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Verifying contracts with account:", deployer.address);

    // Function to verify contract exists and get its code
    async function verifyContract(address: string, name: string) {
        if (!address) {
            console.error(`❌ ${name} address not found in .env.local`);
            return false;
        }

        console.log(`\nVerifying ${name}...`);
        console.log(`Address: ${address}`);

        const code = await ethers.provider.getCode(address);
        if (code === "0x") {
            console.error(`❌ ${name} contract not found on chain`);
            return false;
        }

        console.log(`✅ ${name} contract verified on chain`);
        return true;
    }

    // Verify EURC Token contracts
    const eurcProxy = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;
    const eurcImpl = process.env.NEXT_PUBLIC_EURC_IMPLEMENTATION_ADDRESS;
    const eurcAdmin = process.env.NEXT_PUBLIC_EURC_ADMIN_ADDRESS;

    await verifyContract(eurcProxy!, "EURC Token Proxy");
    await verifyContract(eurcImpl!, "EURC Token Implementation");
    await verifyContract(eurcAdmin!, "EURC Token Admin");

    // Verify StakingFactory contracts
    const factoryProxy = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS;
    const factoryImpl = process.env.NEXT_PUBLIC_STAKING_FACTORY_IMPLEMENTATION_ADDRESS;
    const factoryAdmin = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADMIN_ADDRESS;

    await verifyContract(factoryProxy!, "StakingFactory Proxy");
    await verifyContract(factoryImpl!, "StakingFactory Implementation");
    await verifyContract(factoryAdmin!, "StakingFactory Admin");

    // Check StakingFactory funding
    if (factoryProxy) {
        console.log("\nChecking StakingFactory funding...");
        const eurc = await ethers.getContractAt("MockEURCUpgradeable", eurcProxy!);
        const factoryBalance = await eurc.balanceOf(factoryProxy);
        console.log(`StakingFactory EURC Balance: ${ethers.formatUnits(factoryBalance, 6)} EURC`);
        
        if (factoryBalance === 0n) {
            console.warn("⚠️ Warning: StakingFactory has no EURC tokens");
        } else {
            console.log("✅ StakingFactory has EURC tokens");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
