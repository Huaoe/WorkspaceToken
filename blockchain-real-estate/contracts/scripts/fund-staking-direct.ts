import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { parseUnits } from "ethers";
import ERC20ABI from "../abis/IERC20.json";
import StakingRewardsV2 from "../artifacts/contracts/StakingRewardsV2.sol/StakingRewardsV2.json";

task("fund-staking-direct", "Fund a staking contract directly")
  .addParam("propertytoken", "The property token address")
  .addParam("amount", "The amount of EURC to fund")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    try {
      const [signer] = await hre.ethers.getSigners();
      console.log("Funding staking contract with account:", signer.address);

      // Get contract addresses from environment
      const eurcAddress = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS;
      const stakingContractAddress = process.env.NEXT_PUBLIC_STAKING_V2_ADDRESS;

      if (!eurcAddress || !stakingContractAddress) {
        throw new Error("Missing required environment variables");
      }

      console.log("EURC token address:", eurcAddress);
      console.log("StakingRewardsV2 address:", stakingContractAddress);
      console.log("Property token address:", taskArgs.propertytoken);

      // Connect to contracts
      const stakingContract = new hre.ethers.Contract(
        stakingContractAddress,
        StakingRewardsV2.abi,
        signer
      );

      // Get duration from staking contract
      const duration = await stakingContract.duration();
      console.log("Duration:", duration.toString(), "seconds");

      // Convert amount to proper decimals (EURC has 6 decimals)
      const amount = parseUnits(taskArgs.amount, 6);
      console.log("Amount to fund:", taskArgs.amount, "EURC");
      console.log("Amount with decimals:", amount.toString());

      // Check EURC balance
      const eurcContract = new hre.ethers.Contract(eurcAddress, ERC20ABI.abi, signer);
      const balance = await eurcContract.balanceOf(signer.address);
      console.log("Your EURC balance:", parseFloat(balance.toString()) / 1e6, "EURC");

      // Approve EURC spend
      console.log("Approving EURC spend...");
      const approveTx = await eurcContract.approve(stakingContractAddress, amount);
      await approveTx.wait();
      console.log("Approved EURC spend");

      // Fund staking contract
      console.log("Funding staking contract directly...");
      const fundTx = await stakingContract.notifyRewardRate(amount);
      await fundTx.wait();
      console.log("Successfully funded staking contract!");

    } catch (error) {
      console.error("An unexpected error occurred:\n", error);
      process.exitCode = 1;
    }
  });
