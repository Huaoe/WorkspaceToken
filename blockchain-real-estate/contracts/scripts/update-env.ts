import dotenv from "dotenv";
import path from "path";
import fs from "fs";

async function main() {
  // Load environment variables
  const envLocalPath = path.join(process.cwd(), '..', '.env.local');
  dotenv.config({ path: envLocalPath });

  // New staking contract address (replace with your deployed proxy address)
  const stakingV2Address = "0x5bf5b11053e734690269C6B9D438F8C9d48F528A";

  // Read current .env.local
  const envContent = fs.readFileSync(envLocalPath, 'utf8');

  // Update or add NEXT_PUBLIC_STAKING_V2_ADDRESS
  const updatedContent = envContent.includes('NEXT_PUBLIC_STAKING_V2_ADDRESS=')
    ? envContent.replace(
        /NEXT_PUBLIC_STAKING_V2_ADDRESS=.*/,
        `NEXT_PUBLIC_STAKING_V2_ADDRESS=${stakingV2Address}`
      )
    : envContent + `\nNEXT_PUBLIC_STAKING_V2_ADDRESS=${stakingV2Address}`;

  // Write back to .env.local
  fs.writeFileSync(envLocalPath, updatedContent);
  console.log("Updated .env.local with new staking contract address:", stakingV2Address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
