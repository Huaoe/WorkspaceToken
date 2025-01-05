import { task } from "hardhat/config";
import { MockEURC } from "../typechain-types";
import * as dotenv from "dotenv";
import * as path from "path";
import { JsonRpcProvider } from "ethers";

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env');
console.log('Loading environment from:', envPath);
dotenv.config({ path: envPath });

const MOCK_EURC_ADDRESS = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL;

console.log('Environment variables loaded:');
console.log('- MOCK_EURC_ADDRESS:', MOCK_EURC_ADDRESS ? ' Set' : ' Not set');
console.log('- SEPOLIA_RPC_URL:', SEPOLIA_RPC ? ' Set' : ' Not set');
console.log('- PRIVATE_KEY:', process.env.PRIVATE_KEY ? ' Set' : ' Not set');

if (!MOCK_EURC_ADDRESS) {
  throw new Error("NEXT_PUBLIC_EURC_TOKEN_ADDRESS not found in .env");
}

if (!SEPOLIA_RPC) {
  throw new Error("SEPOLIA_RPC_URL not found in .env");
}

task("distribute-mock-eurc", "Distributes MockEURC tokens to a specified address")
  .addParam("address", "The address to receive tokens")
  .addParam("amount", "The amount of tokens to send")
  .setAction(async (taskArgs, hre) => {
    try {
      const { address, amount } = taskArgs;
      console.log('\nTask parameters:');
      console.log('- Recipient address:', address);
      console.log('- Amount:', amount);

      if (!hre.ethers.isAddress(address)) {
        throw new Error("Invalid recipient address");
      }

      // Test RPC connection first
      console.log('\nTesting RPC connection...');
      const provider = new JsonRpcProvider(SEPOLIA_RPC, {
        chainId: 11155111,
        name: 'sepolia'
      });

      try {
        const network = await provider.getNetwork();
        console.log('Network connection successful:');
        console.log('- Chain ID:', network.chainId);
        console.log('- Network name:', network.name);
      } catch (error) {
        console.error('Failed to connect to RPC:');
        console.error('- URL:', SEPOLIA_RPC.substring(0, SEPOLIA_RPC.indexOf('?') !== -1 ? SEPOLIA_RPC.indexOf('?') : SEPOLIA_RPC.length));
        console.error('- Error:', error.message);
        throw new Error('RPC connection failed');
      }

      const [deployer] = await hre.ethers.getSigners();
      console.log('\nDeployer information:');
      console.log('- Address:', deployer.address);
      const balance = await provider.getBalance(deployer.address);
      console.log('- ETH Balance:', hre.ethers.formatEther(balance));

      console.log('\nMockEURC contract:');
      console.log('- Address:', MOCK_EURC_ADDRESS);

      // Get the MockEURC contract instance
      console.log('\nConnecting to MockEURC contract...');
      const mockEURC = await hre.ethers.getContractAt("MockEURC", MOCK_EURC_ADDRESS) as MockEURC;

      // Verify contract exists and is accessible
      console.log('Verifying contract...');
      try {
        const name = await mockEURC.name();
        const symbol = await mockEURC.symbol();
        const decimals = await mockEURC.decimals();
        console.log(`Contract verified: ${name} (${symbol}), decimals: ${decimals}`);
      } catch (error) {
        console.error("\nError accessing MockEURC contract:");
        console.error('- Error type:', error.constructor.name);
        console.error('- Message:', error.message);
        throw error;
      }

      // Parse amount with 6 decimals (EURC standard)
      const distributionAmount = hre.ethers.parseUnits(amount, 6);
      console.log('\nAmount details:');
      console.log('- Raw amount:', distributionAmount.toString());
      console.log('- Formatted:', amount, 'EURC');

      // Check deployer balance
      console.log('\nChecking balances...');
      const deployerBalance = await mockEURC.balanceOf(deployer.address);
      console.log('- Deployer EURC balance:', hre.ethers.formatUnits(deployerBalance, 6));
      
      if (deployerBalance < distributionAmount) {
        throw new Error(`Insufficient balance. Deployer has ${hre.ethers.formatUnits(deployerBalance, 6)} EURC`);
      }

      console.log(`\nInitiating transfer of ${amount} EURC to ${address}`);

      // Perform the transfer
      console.log('Sending transaction...');
      const tx = await mockEURC.transfer(address, distributionAmount);
      console.log('- Transaction hash:', tx.hash);

      console.log('Waiting for confirmation...');
      const receipt = await tx.wait();
      console.log('- Block number:', receipt.blockNumber);
      console.log('- Gas used:', receipt.gasUsed.toString());

      // Log final balances
      console.log('\nFinal balances:');
      const recipientBalance = await mockEURC.balanceOf(address);
      console.log(`- Recipient: ${hre.ethers.formatUnits(recipientBalance, 6)} EURC`);
      const finalDeployerBalance = await mockEURC.balanceOf(deployer.address);
      console.log(`- Deployer: ${hre.ethers.formatUnits(finalDeployerBalance, 6)} EURC`);

    } catch (error) {
      console.error('\nFATAL ERROR:');
      console.error('- Type:', error.constructor.name);
      console.error('- Message:', error.message);
      console.error('- Code:', error.code);
      if (error.stack) console.error('\nStack trace:', error.stack);
      throw error;
    }
  });
