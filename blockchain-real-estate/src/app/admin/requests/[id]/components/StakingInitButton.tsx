'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAccount, usePublicClient, useWalletClient, useReadContract } from "wagmi";
import stakingFactoryJSON from '@contracts/abis/StakingFactory.json';
import stakingRewardsJSON from '@contracts/abis/StakingRewards.json';
import propertyTokenJSON from '@contracts/abis/PropertyToken.json';
import mockEURCJSON from '@contracts/abis/MockEURC.json';
import { type Abi, parseUnits, formatUnits } from 'viem';

interface StakingInitButtonProps {
  propertyTokenAddress: string;
  status: string;
}

export function StakingInitButton({ propertyTokenAddress, status }: StakingInitButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const stakingFactoryABI = stakingFactoryJSON.abi as Abi;
  const stakingRewardsABI = stakingRewardsJSON.abi as Abi;
  const propertyTokenABI = propertyTokenJSON.abi as Abi;
  const stakingFactoryAddress = process.env.NEXT_PUBLIC_STAKING_FACTORY_ADDRESS as `0x${string}`;

  // Check if the current user is the owner of the factory
  const { data: owner } = useReadContract({
    address: stakingFactoryAddress,
    abi: stakingFactoryABI,
    functionName: 'owner',
  });

  // Get the rewards token from the factory
  const { data: rewardsToken } = useReadContract({
    address: stakingFactoryAddress,
    abi: stakingFactoryABI,
    functionName: 'rewardsToken',
    onSuccess(data) {
      console.log('Factory rewards token:', data);
    },
    onError(error) {
      console.error('Error fetching rewards token:', error);
    }
  });

  // Get the EURC token address from environment
  const propertyEURCToken = process.env.NEXT_PUBLIC_EURC_TOKEN_ADDRESS as `0x${string}`;
  console.log('Property EURC token:', propertyEURCToken);

  // Check if staking already exists for this property
  const { data: hasStaking } = useReadContract({
    address: stakingFactoryAddress,
    abi: stakingFactoryABI,
    functionName: 'hasStakingRewards',
    args: [propertyTokenAddress as `0x${string}`],
    onSuccess(data) {
      console.log('Has staking contract:', data);
    },
    onError(error) {
      console.error('Error checking staking existence:', error);
    }
  });

  useEffect(() => {
    if (propertyTokenAddress) {
      console.log('Property Token Contract State:', {
        address: propertyTokenAddress,
        eurcToken: propertyEURCToken,
        factoryRewardsToken: rewardsToken,
        eurcTokensMatch: propertyEURCToken === rewardsToken
      });
    }
  }, [propertyTokenAddress, propertyEURCToken, rewardsToken]);

  const handleInitializeStaking = async () => {
    console.log('=== Starting Staking Initialization ===');
    console.log('Property Token Address:', propertyTokenAddress);
    console.log('Factory Address:', stakingFactoryAddress);
    console.log('Connected Account:', address);
    console.log('Factory Owner:', owner);
    console.log('EURC Token Comparison:', {
      propertyEURCToken,
      factoryRewardsToken: rewardsToken,
      match: propertyEURCToken === rewardsToken
    });

    try {
      setLoading(true);

      // Basic validations first
      if (!walletClient || !isConnected) {
        throw new Error('Wallet not connected');
      }

      if (!propertyTokenAddress) {
        throw new Error('No property token address provided');
      }

      if (owner !== address) {
        throw new Error('Only the contract owner can initialize staking');
      }

      // Validation 1: Check property token address is not zero
      if (propertyTokenAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid property token address (zero address)');
      }

      // Validation 2: Check if property token exists
      console.log('Checking if property token contract exists...');
      const code = await publicClient.getBytecode({ address: propertyTokenAddress as `0x${string}` });
      if (!code || code === '0x') {
        throw new Error('Property token contract does not exist at the given address');
      }
      console.log('Property token contract exists');

      // Validation 3: Check if EURC token is loaded
      if (!propertyEURCToken) {
        throw new Error('EURC token not loaded. Please ensure the property token has a valid EURC token configured.');
      }
      console.log('EURC token loaded:', propertyEURCToken);

      // Validation 4: Check if staking already exists
      if (hasStaking) {
        throw new Error('Staking contract already exists for this property');
      }

      // Calculate staking parameters
      const rewardsDuration = BigInt(365 * 24 * 60 * 60); // 1 year in seconds
      const rewardsAmount = 1000n * 10n**6n; // 1000 EURC (6 decimals)

      console.log('Staking parameters:', {
        propertyToken: propertyTokenAddress,
        rewardsDuration: rewardsDuration.toString(),
        rewardsAmount: formatUnits(rewardsAmount, 6),
      });

      // First simulate the transaction
      console.log('Simulating createStakingRewards transaction...');

      // First approve EURC token transfer
      console.log('Approving EURC token transfer...');
      const eurcContract = {
        address: rewardsToken as `0x${string}`,
        abi: mockEURCJSON.abi as Abi,
      };

      // Check EURC balance first
      const eurcBalance = await publicClient.readContract({
        ...eurcContract,
        functionName: 'balanceOf',
        args: [address],
      });
      console.log('EURC balance:', eurcBalance.toString());

      if (eurcBalance < rewardsAmount) {
        throw new Error(`Insufficient EURC balance. Need ${formatUnits(rewardsAmount, 6)} EURC but have ${formatUnits(eurcBalance, 6)} EURC`);
      }

      // Check current allowance for the factory
      const currentFactoryAllowance = await publicClient.readContract({
        ...eurcContract,
        functionName: 'allowance',
        args: [address, stakingFactoryAddress],
      });
      console.log('Current factory allowance:', currentFactoryAllowance.toString());

      if (currentFactoryAllowance < rewardsAmount) {
        console.log('Approving EURC transfer for factory...');

        // Get current gas price with retry mechanism
        let gasPrice;
        for (let i = 0; i < 3; i++) {
          try {
            gasPrice = await publicClient.getGasPrice();
            console.log('Current gas price:', gasPrice.toString());
            break;
          } catch (error) {
            console.error('Error getting gas price, attempt', i + 1, ':', error);
            if (i === 2) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // Estimate gas for approval with retry mechanism
        let approveGasEstimate;
        for (let i = 0; i < 3; i++) {
          try {
            approveGasEstimate = await publicClient.estimateContractGas({
              ...eurcContract,
              functionName: 'approve',
              args: [stakingFactoryAddress, rewardsAmount],
              account: address,
            });
            console.log('Estimated gas for factory approval:', approveGasEstimate.toString());
            break;
          } catch (error) {
            console.error('Error estimating gas, attempt', i + 1, ':', error);
            if (i === 2) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (!approveGasEstimate) {
          throw new Error('Failed to estimate gas for factory approval after multiple attempts');
        }

        // Add a larger buffer for gas limit
        const gasLimit = approveGasEstimate + BigInt(100000); // Increased buffer

        try {
          const { request: approveRequest } = await publicClient.simulateContract({
            ...eurcContract,
            functionName: 'approve',
            args: [stakingFactoryAddress, rewardsAmount],
            account: address,
            gas: gasLimit,
            gasPrice: gasPrice ? gasPrice * BigInt(12) / BigInt(10) : undefined, // 20% higher
          });

          console.log('Factory approval simulation successful, executing transaction...');
          console.log('Gas settings:', {
            limit: gasLimit.toString(),
            price: gasPrice ? (gasPrice * BigInt(12) / BigInt(10)).toString() : 'default',
          });

          const approveHash = await walletClient.writeContract({
            ...approveRequest,
            gas: gasLimit,
            gasPrice: gasPrice ? gasPrice * BigInt(12) / BigInt(10) : undefined,
          });
          console.log('Factory approval transaction hash:', approveHash);

          console.log('Waiting for factory approval confirmation...');
          const approveReceipt = await publicClient.waitForTransactionReceipt({ 
            hash: approveHash,
            timeout: 60_000, // 60 second timeout
          });
          console.log('Factory approval transaction receipt:', approveReceipt);

          if (approveReceipt.status !== 'success') {
            console.error('Factory approval transaction failed:', approveReceipt);
            throw new Error('EURC approval for factory failed. Please check the transaction on the blockchain explorer.');
          }

          // Verify the allowance was actually increased
          const newAllowance = await publicClient.readContract({
            ...eurcContract,
            functionName: 'allowance',
            args: [address, stakingFactoryAddress],
          });
          console.log('New factory allowance after approval:', newAllowance.toString());

          if (newAllowance < rewardsAmount) {
            throw new Error('Approval transaction succeeded but factory allowance was not increased enough');
          }

          console.log('EURC approval for factory successful');
        } catch (error: any) {
          console.error('Error during factory approval process:', error);
          // Add approval-specific error details
          if (error.reason) {
            console.error('Error reason:', error.reason);
          }
          throw new Error(`EURC approval for factory failed: ${error.message || 'Unknown error'}`);
        }
      } else {
        console.log('Sufficient factory allowance already exists');
      }

      // Now proceed with creating the staking contract
      console.log('Creating staking contract...');

      // Get updated nonce after approval (if it happened)
      const stakingNonce = await publicClient.getTransactionCount({
        address: address,
      });
      console.log('Nonce for staking creation:', stakingNonce);

      // Get current gas price with retry
      let stakingGasPrice;
      for (let i = 0; i < 3; i++) {
        try {
          stakingGasPrice = await publicClient.getGasPrice();
          console.log('Current gas price for staking:', stakingGasPrice.toString());
          break;
        } catch (error) {
          console.error('Error getting gas price for staking, attempt', i + 1, ':', error);
          if (i === 2) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Estimate gas for staking creation with retry
      let stakingGasEstimate;
      for (let i = 0; i < 3; i++) {
        try {
          stakingGasEstimate = await publicClient.estimateContractGas({
            address: stakingFactoryAddress,
            abi: stakingFactoryABI,
            functionName: 'createStakingRewards',
            args: [
              propertyTokenAddress as `0x${string}`,
              rewardsDuration,
              rewardsAmount
            ],
            account: address,
          });
          console.log('Estimated gas for staking creation:', stakingGasEstimate.toString());
          break;
        } catch (error) {
          console.error('Error estimating gas for staking, attempt', i + 1, ':', error);
          if (i === 2) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!stakingGasEstimate) {
        throw new Error('Failed to estimate gas for staking creation after multiple attempts');
      }

      // Add a larger buffer for gas limit
      const stakingGasLimit = stakingGasEstimate + BigInt(200000); // Larger buffer for contract creation

      try {
        const { request } = await publicClient.simulateContract({
          address: stakingFactoryAddress,
          abi: stakingFactoryABI,
          functionName: 'createStakingRewards',
          args: [
            propertyTokenAddress as `0x${string}`,
            rewardsDuration,
            rewardsAmount
          ],
          account: address,
          gas: stakingGasLimit,
          gasPrice: stakingGasPrice ? stakingGasPrice * BigInt(12) / BigInt(10) : undefined, // 20% higher
        });

        console.log('Staking contract creation simulation successful, executing transaction...');
        console.log('Gas settings for staking:', {
          limit: stakingGasLimit.toString(),
          price: stakingGasPrice ? (stakingGasPrice * BigInt(12) / BigInt(10)).toString() : 'default',
        });

        const hash = await walletClient.writeContract({
          ...request,
          gas: stakingGasLimit,
          gasPrice: stakingGasPrice ? stakingGasPrice * BigInt(12) / BigInt(10) : undefined,
          nonce: stakingNonce, // Add explicit nonce
        });

        console.log('Staking creation transaction hash:', hash);

        toast({
          title: "Success",
          description: "Staking initialization transaction submitted",
        });

        console.log('Waiting for staking creation confirmation...');
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash,
          timeout: 120_000, // 120 second timeout for contract creation
        });
        console.log('Staking creation transaction receipt:', receipt);

        if (receipt.status !== 'success') {
          console.error('Staking creation transaction failed:', receipt);
          throw new Error('Staking contract creation failed. Please check the transaction on the blockchain explorer.');
        }

        // Verify the staking contract was created
        const hasStakingAfter = await publicClient.readContract({
          address: stakingFactoryAddress,
          abi: stakingFactoryABI,
          functionName: 'hasStakingRewards',
          args: [propertyTokenAddress as `0x${string}`],
        });

        if (!hasStakingAfter) {
          throw new Error('Transaction succeeded but staking contract was not created');
        }

        toast({
          title: "Success",
          description: "Staking contract created successfully",
        });
      } catch (error: any) {
        console.error('Error during staking contract creation:', error);
        // Add staking-specific error details
        if (error.reason) {
          console.error('Error reason:', error.reason);
        }
        throw new Error(`Staking contract creation failed: ${error.message || 'Unknown error'}`);
      }

    } catch (error: any) {
      console.error('Error initializing staking:', error);
      // More detailed error logging
      if (error.cause) {
        console.error('Error cause:', error.cause);
      }
      if (error.data) {
        console.error('Error data:', error.data);
      }
      if (error.shortMessage) {
        console.error('Short message:', error.shortMessage);
      }
      if (error.transaction) {
        console.error('Transaction details:', {
          from: error.transaction.from,
          to: error.transaction.to,
          data: error.transaction.data,
          value: error.transaction.value,
          gas: error.transaction.gas,
        });
      }
      if (error.receipt) {
        console.error('Transaction receipt:', {
          status: error.receipt.status,
          gasUsed: error.receipt.gasUsed,
          logs: error.receipt.logs,
        });
      }
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to initialize staking',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (status !== 'funding') {
    return null;
  }

  return (
    <Button 
      onClick={handleInitializeStaking} 
      disabled={loading || owner !== address || hasStaking}
      className="bg-primary"
    >
      {loading ? 'Initializing Staking...' : hasStaking ? 'Staking Already Initialized' : 'Initialize Staking'}
    </Button>
  );
}
