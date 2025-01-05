import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";
import { JsonRpcProvider } from "ethers";

// Determine which environment file to use based on the network
const network = process.argv.find((arg) => arg.startsWith('--network='))?.split('=')[1] || 
                process.argv[process.argv.indexOf('--network') + 1] || 
                'hardhat';

const isLocalNetwork = network === 'localhost' || network === 'hardhat';
const envPath = path.resolve(__dirname, '../../', isLocalNetwork ? '.env.local' : '.env');

console.log(`Loading environment from: ${envPath} (Network: ${network})`);
dotenv.config({ path: envPath });

// Get environment variables
const WHITELIST_ADDRESS = process.env.NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS;
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL;

// Validate environment variables
console.log('Environment variables loaded:');
console.log('- WHITELIST_ADDRESS:', WHITELIST_ADDRESS ? ' Set' : ' Not set');
if (!isLocalNetwork) {
  console.log('- SEPOLIA_RPC_URL:', SEPOLIA_RPC ? ' Set' : ' Not set');
  console.log('- PRIVATE_KEY:', process.env.PRIVATE_KEY ? ' Set' : ' Not set');
}

if (!WHITELIST_ADDRESS) {
  throw new Error(`NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS not found in ${isLocalNetwork ? '.env.local' : '.env'}`);
}

if (!isLocalNetwork && !SEPOLIA_RPC) {
  throw new Error("SEPOLIA_RPC_URL not found in .env (required for Sepolia network)");
}

export async function main(address: string) {
  try {
    if (!address) {
      throw new Error("Address parameter is required");
    }

    if (!ethers.isAddress(address)) {
      throw new Error("Invalid Ethereum address provided");
    }

    // Test network connection
    console.log('\nTesting network connection...');
    let provider;
    
    if (isLocalNetwork) {
      provider = new JsonRpcProvider("http://127.0.0.1:8545");
    } else {
      provider = new JsonRpcProvider(SEPOLIA_RPC, {
        chainId: 11155111,
        name: 'sepolia'
      });
    }

    try {
      const network = await provider.getNetwork();
      console.log('Network connection successful:');
      console.log('- Chain ID:', network.chainId);
      console.log('- Network name:', network.name);
    } catch (error) {
      console.error('Failed to connect to network:');
      if (!isLocalNetwork) {
        console.error('- URL:', SEPOLIA_RPC.substring(0, SEPOLIA_RPC.indexOf('?') !== -1 ? SEPOLIA_RPC.indexOf('?') : SEPOLIA_RPC.length));
      }
      console.error('- Error:', error.message);
      throw new Error('Network connection failed');
    }

    const [deployer] = await ethers.getSigners();
    console.log('\nDeployer information:');
    console.log('- Address:', deployer.address);
    const balance = await provider.getBalance(deployer.address);
    console.log('- ETH Balance:', ethers.formatEther(balance));

    console.log('\nWhitelist contract:');
    console.log('- Address:', WHITELIST_ADDRESS);

    // Get Whitelist contract
    console.log('\nConnecting to Whitelist contract...');
    const whitelist = await ethers.getContractAt("IWhitelist", WHITELIST_ADDRESS);

    // Check if address is already whitelisted
    console.log('\nChecking current whitelist status...');
    const currentStatus = await whitelist.isWhitelisted(address);
    if (currentStatus) {
      console.log('Address is already whitelisted');
      return;
    }

    // Whitelist the address
    console.log('\nWhitelisting address:', address);
    const tx = await whitelist.addToWhitelist(address);
    console.log('- Transaction hash:', tx.hash);

    console.log('Waiting for confirmation...');
    const receipt = await tx.wait();
    console.log('Transaction confirmed!');
    console.log('- Block number:', receipt.blockNumber);
    console.log('- Gas used:', receipt.gasUsed.toString());

    // Verify whitelist status
    console.log('\nVerifying final whitelist status...');
    const isWhitelisted = await whitelist.isWhitelisted(address);
    console.log('- Whitelist status:', isWhitelisted ? ' Whitelisted' : ' Not whitelisted');

    if (!isWhitelisted) {
      throw new Error('Whitelist operation failed: Address is not whitelisted after transaction');
    }

  } catch (error) {
    console.error('\nFATAL ERROR:');
    console.error('- Type:', error.constructor.name);
    console.error('- Message:', error.message);
    if (error.stack) console.error('\nStack trace:', error.stack);
    throw error;
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  if (!process.argv[2]) {
    console.error('Please provide an address as an argument');
    process.exit(1);
  }
  
  main(process.argv[2])
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}