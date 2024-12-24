'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { useToast } from "@/components/ui/use-toast";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useWalletEvents } from "@/app/wallet-events-provider";
import { getStakingFactoryContract, getProvider, getSigner, getPropertyTokenContract, getEURCContract } from "@/lib/ethereum";
import { UseFormReturn } from "react-hook-form";
import { ethers } from "ethers";
import { formatUnits, parseUnits } from "viem";
import { EURC_TOKEN_ADDRESS } from "@/lib/contracts";

interface StakingInitButtonProps {
  propertyId: string;
  form: UseFormReturn<any>;
}

export function StakingInitButton({ propertyId, form }: StakingInitButtonProps) {
  const { isConnected, address } = useAccount();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleInitStaking = async () => {
    try {
      setLoading(true);

      if (!isConnected) {
        throw new Error('Please connect your wallet first');
      }

      if (!address) {
        throw new Error('No wallet address available');
      }

      const tokenAddress = form.getValues('token_address');
      if (!tokenAddress) {
        throw new Error('No token address available');
      }

      if (!EURC_TOKEN_ADDRESS) {
        throw new Error('EURC token address not configured');
      }

      console.log('Initializing staking for token:', tokenAddress);

      // Get signer and verify connection
      const signer = await getSigner();
      if (!signer) {
        throw new Error('No signer available');
      }

      // Get factory contract
      console.log('Getting factory contract...');
      const factory = await getStakingFactoryContract(true);
      if (!factory) {
        throw new Error('Failed to get staking factory contract');
      }

      // Get factory owner
      const factoryOwner = await factory.owner();
      console.log('Factory owner:', factoryOwner);

      // Verify ownership
      if (factoryOwner.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Only the factory owner can initialize staking');
      }

      // Check if staking already exists
      const existingStaking = await factory.stakingContracts(tokenAddress);
      if (existingStaking.isActive) {
        throw new Error('Staking contract already exists for this property token');
      }

      // Get factory's reward token
      console.log('\nGetting factory configuration...');
      const factoryRewardToken = await factory.rewardToken();
      console.log('Factory reward token:', factoryRewardToken);

      // Verify property token using the exact same logic as the contract
      console.log('\nVerifying property token...');
      try {
        // Get the property token contract
        const propertyToken = await getPropertyTokenContract(tokenAddress, true);
        
        // Try to call eurcToken() - this will throw if it's not a valid PropertyToken
        const propertyEURCToken = await propertyToken.eurcToken();
        console.log('Property EURC token:', propertyEURCToken);

        // Check if the EURC token matches the factory's reward token
        if (propertyEURCToken.toLowerCase() !== factoryRewardToken.toLowerCase()) {
          throw new Error('Property token has incorrect EURC token');
        }

        // Additional validation - verify it's a PropertyToken by checking other functions
        try {
          const name = await propertyToken.name();
          const symbol = await propertyToken.symbol();
          const totalSupply = await propertyToken.totalSupply();
          console.log('Property token details:', {
            name,
            symbol,
            totalSupply: totalSupply.toString()
          });
        } catch (error) {
          console.error('Failed to read property token details:', error);
          throw new Error('Invalid property token - missing required functions');
        }

      } catch (error: any) {
        console.error('Property token validation failed:', error);
        throw new Error('Invalid property token - failed validation checks');
      }

      // Set staking parameters
      const duration = 30 * 24 * 60 * 60; // 30 days in seconds
      const roi = form.getValues('roi');
      if (!roi) {
        throw new Error('No ROI percentage specified');
      }

      // Calculate reward rate (EURC per second with 6 decimals)
      // For a 7% ROI over 30 days, we want to distribute 181,440 EURC total
      // So we need: 181,440 EURC / (30 * 24 * 60 * 60) seconds = 0.07 EURC per second
      // In the smallest unit (6 decimals): 0.07 * 10^6 = 70,000
      const rewardRate = BigInt(70000); // 0.07 EURC per second with 6 decimals

      // Calculate total rewards needed for the duration
      const totalRewards = rewardRate * BigInt(duration);

      // Get factory address and verify EURC balance
      const factoryAddress = await factory.getAddress();
      const eurcContract = await getEURCContract(factoryRewardToken, true); // Use factory's reward token
      const factoryBalance = await eurcContract.balanceOf(factoryAddress);

      console.log('\nDebug info:');
      console.log('ROI:', roi, '%');
      console.log('Duration:', duration, 'seconds');
      console.log('Reward rate:', formatUnits(rewardRate, 6), 'EURC per second');
      console.log('Total rewards needed:', formatUnits(totalRewards, 6), 'EURC');
      console.log('\nContract values:');
      console.log('Reward rate (raw):', rewardRate.toString());
      console.log('Total rewards (raw):', totalRewards.toString());
      console.log('\nFactory balance:');
      console.log('Factory EURC balance:', formatUnits(factoryBalance, 6), 'EURC');
      console.log('Factory EURC balance (raw):', factoryBalance.toString());

      if (factoryBalance < totalRewards) {
        // Check if owner has enough EURC
        const ownerBalance = await eurcContract.balanceOf(address);
        console.log('\nOwner EURC balance:', formatUnits(ownerBalance, 6), 'EURC');
        
        if (ownerBalance < totalRewards) {
          throw new Error(`Insufficient EURC balance. Need ${formatUnits(totalRewards, 6)} EURC but have ${formatUnits(ownerBalance, 6)} EURC`);
        }

        // Approve EURC transfer
        console.log('\nApproving EURC transfer...');
        const approveTx = await eurcContract.approve(factoryAddress, totalRewards);
        console.log('Approval transaction sent:', approveTx.hash);
        await approveTx.wait();

        // Fund the factory
        console.log('\nFunding factory...');
        const fundTx = await factory.fundContract(totalRewards);
        console.log('Funding transaction sent:', fundTx.hash);
        await fundTx.wait();
      }

      console.log('\nCreating staking with parameters:', {
        tokenAddress,
        duration,
        rewardRate: rewardRate.toString(),
        totalRewardsEURC: formatUnits(totalRewards, 6),
        roiPercentage: roi
      });

      // Get current nonce
      const provider = await getProvider();
      const nonce = await provider.getTransactionCount(address);
      console.log('Current nonce:', nonce);

      // Estimate gas for the transaction
      console.log('\nEstimating gas...');
      const gasEstimate = await factory.createStakingContract.estimateGas(
        tokenAddress,
        rewardRate,
        duration
      );
      console.log('Gas estimate:', gasEstimate.toString());

      // Add 20% buffer to gas estimate
      const gasLimit = (gasEstimate * BigInt(120)) / BigInt(100);
      console.log('Gas limit with buffer:', gasLimit.toString());

      // Create staking contract with estimated gas and nonce
      console.log('\nSending transaction...');
      const tx = await factory.createStakingContract(
        tokenAddress,
        rewardRate,
        duration,
        {
          gasLimit,
          nonce: nonce
        }
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      
      // Get staking contract address from event
      const stakingCreatedEvent = receipt.logs.find(
        (log: any) => log.fragment?.name === 'StakingContractCreated'
      );

      if (!stakingCreatedEvent) {
        throw new Error('Staking contract address not found in event logs');
      }

      const [, stakingAddress] = stakingCreatedEvent.args;
      console.log('Staking contract created at:', stakingAddress);

      // Update form status
      form.setValue('status', 'staking');

      // Show success message
      toast({
        title: 'Success',
        description: 'Staking contract created successfully',
      });

    } catch (error: any) {
      console.error('Error initializing staking:', error);

      // Try to extract revert reason if available
      let errorMessage = error.message || 'Failed to initialize staking';
      if (error.data) {
        try {
          // Try to decode the error data
          const iface = new ethers.Interface([
            'error InsufficientRewardsBalance()',
            'error InvalidPropertyToken()',
            'error StakingAlreadyExists()',
            'error DurationMustBeGreaterThanZero()',
            'error RewardRateIsZero()'
          ]);
          const decodedError = iface.parseError(error.data);
          errorMessage = `Contract error: ${decodedError.name}`;
        } catch (decodeError) {
          // If we can't decode the error, just use the original message
          console.error('Failed to decode error:', decodeError);
        }
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleInitStaking}
      disabled={loading}
      variant="outline"
    >
      {loading && (
        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
      )}
      Initialize Staking
    </Button>
  );
}
