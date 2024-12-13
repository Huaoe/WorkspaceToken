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
 * @param options Configuration options
 */
export function updateEnvFiles(
  rootDir: string,
  newValues: { [key: string]: string },
  options: {
    updateLocal?: boolean;
    updateEnv?: boolean;
    localPrefix?: string;
  } = {}
): void {
  const {
    updateLocal = true,
    updateEnv = true,
    localPrefix = "NEXT_PUBLIC_"
  } = options;

  // Resolve absolute paths
  const absoluteRootDir = path.resolve(rootDir);
  console.log('Root directory:', absoluteRootDir);

  // Paths to env files
  const envLocalPath = path.join(absoluteRootDir, ".env.local");
  const envPath = path.join(absoluteRootDir, ".env");

  console.log('Env path:', envPath);
  console.log('Env local path:', envLocalPath);

  // Read existing content
  let envLocalContent = "";
  let envContent = "";

  try {
    if (updateLocal) {
      envLocalContent = fs.existsSync(envLocalPath) ? fs.readFileSync(envLocalPath, "utf8") : "";
      console.log('Found .env.local:', fs.existsSync(envLocalPath));
    }
    if (updateEnv) {
      envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
      console.log('Found .env:', fs.existsSync(envPath));
    }
  } catch (error) {
    console.error("Error reading env files:", error);
  }

  // Update .env.local with NEXT_PUBLIC_ prefix
  if (updateLocal) {
    const localValues = Object.entries(newValues).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key.startsWith(localPrefix) ? key : `${localPrefix}${key}`]: value,
      }),
      {}
    );
    const updatedEnvLocalContent = updateEnvFile(envLocalContent, localValues);
    try {
      fs.writeFileSync(envLocalPath, updatedEnvLocalContent);
      console.log('Updated .env.local successfully');
    } catch (error) {
      console.error('Error writing to .env.local:', error);
    }
  }

  // Update .env
  if (updateEnv) {
    const updatedEnvContent = updateEnvFile(envContent, newValues);
    try {
      fs.writeFileSync(envPath, updatedEnvContent);
      console.log('Updated .env successfully');
    } catch (error) {
      console.error('Error writing to .env:', error);
    }
  }
}
