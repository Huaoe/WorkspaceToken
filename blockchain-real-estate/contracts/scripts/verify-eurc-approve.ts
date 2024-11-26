import { ethers } from "hardhat";
import { MockEURC } from "../typechain-types";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Verifying EURC approve with account:", deployer.address);

  // The target token address to approve
  const tokenToApprove = "0xf41B47c54dEFF12f8fE830A411a09D865eBb120E";
  const mockEURCAddress = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;

  if (!mockEURCAddress) {
    throw new Error("MockEURC address not found in environment variables");
  }

  // Get the MockEURC contract instance
  const mockEURC = await ethers.getContractAt("MockEURC", mockEURCAddress) as MockEURC;

  // Amount to approve (1000 EURC)
  const approvalAmount = ethers.parseUnits("12", 6);

  console.log("\nCurrent state:");
  console.log("-------------");
  const currentAllowance = await mockEURC.allowance(deployer.address, tokenToApprove);
  console.log(`Current allowance: ${ethers.formatUnits(currentAllowance, 6)} EURC`);
  const balance = await mockEURC.balanceOf(deployer.address);
  console.log(`Current balance: ${ethers.formatUnits(balance, 6)} EURC`);

  console.log("\nApproving tokens...");
  try {
    const approveTx = await mockEURC.approve(tokenToApprove, approvalAmount);
    console.log("Approval transaction hash:", approveTx.hash);
    
    console.log("Waiting for transaction confirmation...");
    await approveTx.wait();
    console.log("Transaction confirmed!");

    // Verify the new allowance
    const newAllowance = await mockEURC.allowance(deployer.address, tokenToApprove);
    console.log(`\nNew allowance: ${ethers.formatUnits(newAllowance, 6)} EURC`);

    if (newAllowance >= approvalAmount) {
      console.log("\n✅ Approval successful!");
      console.log(`The contract ${tokenToApprove} can now spend up to ${ethers.formatUnits(newAllowance, 6)} EURC on behalf of ${deployer.address}`);
    } else {
      console.log("\n❌ Approval verification failed!");
      console.log("Expected allowance:", ethers.formatUnits(approvalAmount, 6));
      console.log("Actual allowance:", ethers.formatUnits(newAllowance, 6));
    }
  } catch (error: any) {
    console.error("\n❌ Error during approval:");
    if (error.reason) {
      console.error("Reason:", error.reason);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
