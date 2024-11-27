import { ethers } from "hardhat";
import { MockEURC } from "../typechain-types";

async function main() {
  const accounts = await ethers.getSigners();
  
  // Find the account with the specific address
  const senderAccount = accounts.find(acc => acc.address.toLowerCase() === "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC".toLowerCase());
  
  if (!senderAccount) {
    throw new Error("Sender account not found in available accounts");
  }
  
  console.log(`Verifying EURC approve with account: ${senderAccount.address}`);

  // The specific addresses and amount from the error
  const spenderAddress = "0x44BF2a9217A2970A1bCC7529Bf1d40828C594320";
  const mockEURCAddress = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;
  const approvalAmount = BigInt("1124000000"); // Exact amount from error

  if (!mockEURCAddress) {
    throw new Error("MockEURC address not found in environment variables");
  }

  // Get the MockEURC contract instance
  const mockEURC = await ethers.getContractAt("MockEURC", mockEURCAddress) as MockEURC;
  const mockEURCWithSigner = mockEURC.connect(senderAccount);

  console.log("\nPre-approval state:");
  console.log("------------------");
  const currentAllowance = await mockEURC.allowance(senderAccount.address, spenderAddress);
  console.log(`Current allowance: ${currentAllowance} (raw value)`);
  console.log(`Current allowance: ${ethers.formatUnits(currentAllowance, 6)} EURC`);
  
  const balance = await mockEURC.balanceOf(senderAccount.address);
  console.log(`Current balance: ${balance} (raw value)`);
  console.log(`Current balance: ${ethers.formatUnits(balance, 6)} EURC`);
  
  const totalSupply = await mockEURC.totalSupply();
  console.log(`Total supply: ${ethers.formatUnits(totalSupply, 6)} EURC`);
  
  const owner = await mockEURC.owner();
  console.log(`Contract owner: ${owner}`);

  console.log("\nApproval attempt details:");
  console.log("------------------------");
  console.log(`Sender: ${senderAccount.address}`);
  console.log(`Spender: ${spenderAddress}`);
  console.log(`Amount (raw): ${approvalAmount}`);
  console.log(`Amount (EURC): ${ethers.formatUnits(approvalAmount, 6)} EURC`);

  console.log("\nAttempting approval...");
  try {
    const approveTx = await mockEURCWithSigner.approve(spenderAddress, approvalAmount);
    console.log(`Approval transaction hash: ${approveTx.hash}`);
    
    console.log("Waiting for transaction confirmation...");
    const receipt = await approveTx.wait();
    console.log(`Transaction confirmed in block: ${receipt?.blockNumber}`);

    // Verify the new allowance
    const newAllowance = await mockEURC.allowance(senderAccount.address, spenderAddress);
    console.log(`\nNew allowance (raw): ${newAllowance}`);
    console.log(`New allowance: ${ethers.formatUnits(newAllowance, 6)} EURC`);
  } catch (error: any) {
    console.error(`\nError during approval: ${error}`);
    
    if (error.data) {
      console.log(`\nError data: ${error.data}`);
    }
    
    if (error.transaction) {
      console.log("\nTransaction details:");
      console.log(`From: ${error.transaction.from}`);
      console.log(`To: ${error.transaction.to}`);
      console.log(`Data: ${error.transaction.data}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
