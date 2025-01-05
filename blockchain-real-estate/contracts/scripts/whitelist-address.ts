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

// Validate environment variables
console.log('Environment variables loaded:');
console.log('- WHITELIST_ADDRESS:', WHITELIST_ADDRESS ? ' Set' : ' Not set');

if (!WHITELIST_ADDRESS) {
  throw new Error(`NEXT_PUBLIC_WHITELIST_PROXY_ADDRESS not found in ${isLocalNetwork ? '.env.local' : '.env'}`);
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
    const [deployer] = await ethers.getSigners();
    console.log('\nDeployer information:');
    console.log('- Address:', deployer.address);
    
    const provider = await ethers.provider;
    const network = await provider.getNetwork();
    console.log('Network connection successful:');
    console.log('- Chain ID:', network.chainId);
    console.log('- Network name:', network.name);
    
    const balance = await provider.getBalance(deployer.address);
    console.log('- ETH Balance:', ethers.formatEther(balance));

    console.log('\nWhitelist contract:');
    console.log('- Address:', WHITELIST_ADDRESS);

    // Get Whitelist contract
    console.log('\nConnecting to Whitelist contract...');
    const whitelist = await ethers.getContractAt("IWhitelist", WHITELIST_ADDRESS);

    // Verify contract code exists at address
    const code = await provider.getCode(WHITELIST_ADDRESS);
    if (code === '0x') {
      throw new Error(`No contract found at address ${WHITELIST_ADDRESS}. Please deploy the contract first using:\nyarn hardhat deploy --tags Whitelist --network ${network}`);
    }

    // Check if address is already whitelisted
    console.log('\nChecking current whitelist status...');
    try {
      const currentStatus = await whitelist.isWhitelisted(address);
      if (currentStatus) {
        console.log('Address is already whitelisted');
        return;
      }
    } catch (error) {
      console.error('\nError checking whitelist status:');
      console.error('This could mean the contract is not properly initialized or the ABI does not match.');
      console.error('Make sure you have deployed the Whitelist contract and the proxy is properly initialized.');
      throw error;
    }

    // Whitelist the address
    console.log('\nWhitelisting address:', address);
    try {
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
      console.error('\nError during whitelist operation:');
      if (error.message.includes('execution reverted')) {
        console.error('Transaction reverted. Possible reasons:');
        console.error('1. Caller does not have the required role');
        console.error('2. Contract is paused');
        console.error('3. Address is already whitelisted');
      }
      throw error;
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