import * as fs from 'fs';
import * as path from 'path';

/**
 * Updates environment file content with new values
 * @param envContent Current content of the env file
 * @param newValues Object containing new key-value pairs to add/update
 * @returns Updated environment file content
 */
export function updateEnvFile(envContent: string, newValues: { [key: string]: string }): string {
  const envLines = envContent.split("\n");
  const updatedLines = envLines.filter((line) => {
    const key = line.split("=")[0].trim();
    return !key || !newValues.hasOwnProperty(key);
  });

  for (const [key, value] of Object.entries(newValues)) {
    updatedLines.push(`${key}=${value}`);
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
  newValues: { [key: string]: string }
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

  // Update .env.local in project root
  const envLocalPath = path.join(projectRoot, '.env.local');
  let envLocalContent = '';
  try {
    envLocalContent = fs.existsSync(envLocalPath) ? fs.readFileSync(envLocalPath, 'utf8') : '';
  } catch (error) {
    console.warn('Warning: Could not read .env.local file');
  }
  const updatedEnvLocalContent = updateEnvFile(envLocalContent, newValues);
  fs.writeFileSync(envLocalPath, updatedEnvLocalContent);

  console.log('Updated environment files:');
  console.log('- .env:', envPath);
  console.log('- .env.local:', envLocalPath);
}
