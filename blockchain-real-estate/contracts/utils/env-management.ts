import * as fs from 'fs';
import * as path from 'path';

interface ContractAddresses {
  [key: string]: string;
}

/**
 * Updates environment file content with new values
 * @param envContent Current content of the env file
 * @param newValues Object containing new key-value pairs to add/update
 * @param addNextPublic Whether to add NEXT_PUBLIC_ prefix to keys
 * @returns Updated environment file content
 */
export function updateEnvFile(
  envContent: string,
  newValues: ContractAddresses,
  addNextPublic: boolean = false
): string {
  const envLines = envContent.split("\n");
  const existingValues: { [key: string]: string } = {};
  const updatedLines: string[] = [];

  // First pass: collect existing values and keep non-contract lines
  for (const line of envLines) {
    const [key, ...valueParts] = line.split("=");
    const trimmedKey = key.trim();
    
    // Keep comments and empty lines
    if (!trimmedKey || trimmedKey.startsWith("#")) {
      updatedLines.push(line);
      continue;
    }

    // Store existing values
    const value = valueParts.join("=").trim();
    const baseKey = trimmedKey.replace(/^(NEXT_PUBLIC_)?/, "");
    existingValues[baseKey] = value;
  }

  // Second pass: add new values with proper formatting
  for (const [key, value] of Object.entries(newValues)) {
    const baseKey = key.replace(/^(NEXT_PUBLIC_)?/, "");
    
    // Add comment for new contract section if it doesn't exist
    if (!updatedLines.some(line => line.includes(`# ${baseKey}`))) {
      updatedLines.push(`\n# ${baseKey} Contract`);
    }

    // Add the value with NEXT_PUBLIC_ prefix if needed
    if (addNextPublic) {
      updatedLines.push(`NEXT_PUBLIC_${baseKey}=${value}`);
    }
    updatedLines.push(`${baseKey}=${value}`);
  }

  return updatedLines.join("\n") + "\n";
}

/**
 * Updates both .env and .env.local files with new values
 * @param rootDir Root directory of the project
 * @param newValues Object containing new key-value pairs to add/update
 */
export function updateEnvFiles(
  rootDir: string,
  newValues: ContractAddresses
) {
  // Get the project root (one level up from contracts)
  const projectRoot = path.resolve(rootDir, '..');
  
  // Update .env in contracts directory
  const envPath = path.join(rootDir, '.env');
  let envContent = '';
  try {
    envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  } catch (error) {
    console.warn('Warning: Could not read .env file');
  }
  const updatedEnvContent = updateEnvFile(envContent, newValues);
  fs.writeFileSync(envPath, updatedEnvContent);

  // Update .env.local in project root with NEXT_PUBLIC_ prefix
  const envLocalPath = path.join(projectRoot, '.env.local');
  let envLocalContent = '';
  try {
    envLocalContent = fs.existsSync(envLocalPath) ? fs.readFileSync(envLocalPath, 'utf8') : '';
  } catch (error) {
    console.warn('Warning: Could not read .env.local file');
  }
  const updatedEnvLocalContent = updateEnvFile(envLocalContent, newValues, true);
  fs.writeFileSync(envLocalPath, updatedEnvLocalContent);

  console.log('Updated environment files:');
  console.log(`- .env: ${envPath}`);
  console.log(`- .env.local: ${envLocalPath}`);
}
