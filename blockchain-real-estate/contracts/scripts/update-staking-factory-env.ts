import * as fs from 'fs';
import * as path from 'path';
import { ethers } from 'hardhat';

async function updateEnvFile(envPath: string, addresses: Record<string, string>) {
  if (!fs.existsSync(envPath)) {
    console.log(`Warning: ${envPath} does not exist`);
    return;
  }

  let content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  let newContent: string[] = [];
  let stakingSectionFound = false;

  for (const line of lines) {
    // Skip existing StakingFactory lines
    if (line.trim().startsWith('NEXT_PUBLIC_STAKING_FACTORY_')) {
      continue;
    }

    // Add StakingFactory section after PropertyFactory section
    if (line.trim() === '# Property Factory Contract' && !stakingSectionFound) {
      newContent.push(line);
      // Keep existing PropertyFactory variables
      newContent.push(...lines.filter(l => 
        l.trim().startsWith('NEXT_PUBLIC_PROPERTY_FACTORY_') ||
        l.trim() === ''
      ));
      
      // Add StakingFactory section
      newContent.push('\n# Staking Factory Contract');
      newContent.push(`NEXT_PUBLIC_STAKING_FACTORY_ADDRESS=${addresses.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS}`);
      newContent.push(`NEXT_PUBLIC_STAKING_FACTORY_IMPLEMENTATION_ADDRESS=${addresses.NEXT_PUBLIC_STAKING_FACTORY_IMPLEMENTATION_ADDRESS}`);
      newContent.push(`NEXT_PUBLIC_STAKING_FACTORY_ADMIN_ADDRESS=${addresses.NEXT_PUBLIC_STAKING_FACTORY_ADMIN_ADDRESS}\n`);
      stakingSectionFound = true;
      continue;
    }

    if (!line.trim().startsWith('NEXT_PUBLIC_PROPERTY_FACTORY_')) {
      newContent.push(line);
    }
  }

  // If PropertyFactory section wasn't found, add StakingFactory section at the end
  if (!stakingSectionFound) {
    newContent.push('\n# Staking Factory Contract');
    newContent.push(`NEXT_PUBLIC_STAKING_FACTORY_ADDRESS=${addresses.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS}`);
    newContent.push(`NEXT_PUBLIC_STAKING_FACTORY_IMPLEMENTATION_ADDRESS=${addresses.NEXT_PUBLIC_STAKING_FACTORY_IMPLEMENTATION_ADDRESS}`);
    newContent.push(`NEXT_PUBLIC_STAKING_FACTORY_ADMIN_ADDRESS=${addresses.NEXT_PUBLIC_STAKING_FACTORY_ADMIN_ADDRESS}\n`);
  }

  fs.writeFileSync(envPath, newContent.join('\n'));
  console.log(`Updated ${envPath}`);
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Updating environment with StakingFactory addresses...");

  const stakingFactoryAddress = "0xc5a5C42992dECbae36851359345FE25997F5C42d";
  const stakingFactoryImplAddress = "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1";
  const stakingFactoryAdminAddress = "0xf0D7de80A1C242fA3C738b083C422d65c6c7ABF1";

  const frontendEnvPath = path.join(process.cwd(), '..', '.env.local');

  const addresses = {
    NEXT_PUBLIC_STAKING_FACTORY_ADDRESS: stakingFactoryAddress,
    NEXT_PUBLIC_STAKING_FACTORY_IMPLEMENTATION_ADDRESS: stakingFactoryImplAddress,
    NEXT_PUBLIC_STAKING_FACTORY_ADMIN_ADDRESS: stakingFactoryAdminAddress
  };

  await updateEnvFile(frontendEnvPath, addresses);
  console.log("\nEnvironment Update Summary:");
  console.log("StakingFactory Addresses:");
  console.log("- Proxy:", stakingFactoryAddress);
  console.log("- Implementation:", stakingFactoryImplAddress);
  console.log("- Admin:", stakingFactoryAdminAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
