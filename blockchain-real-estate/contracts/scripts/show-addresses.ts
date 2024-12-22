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

  console.log("\nContract Addresses:");
  console.log("------------------");
  console.log("Whitelist Proxy:", process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS);
  console.log("Property Token Implementation:", process.env.NEXT_PUBLIC_PROPERTY_TOKEN_IMPLEMENTATION_ADDRESS);
  console.log("Property Factory Proxy:", process.env.NEXT_PUBLIC_PROPERTY_FACTORY_PROXY_ADDRESS);
  console.log("EURC Token:", process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS);
  console.log("Staking Factory:", process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });