'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useWalletEvents } from "@/app/wallet-events-provider";
import { getPropertyFactoryContract, getSigner, getPropertyTokenContract, getEURCContract, getWhitelistContract } from "@/lib/ethereum";
import { UseFormReturn } from "react-hook-form";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/supabase/types";
import { EURC_TOKEN_ADDRESS } from "@/lib/contracts";
import { ethers } from "ethers";

interface ApproveTokenButtonProps {
  propertyId: string;
  form: UseFormReturn<any>;
}

export function ApproveTokenButton({ propertyId, form }: ApproveTokenButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { address, isConnected } = useWalletEvents();
  const supabase = createClientComponentClient<Database>();

  const handleApproveToken = async () => {
    try {
      setLoading(true);

      if (!isConnected) {
        throw new Error('Please connect your wallet first');
      }

      if (!address) {
        throw new Error('No wallet address available');
      }

      // Get the token address and validate it
      const tokenAddress = form.getValues('token_address');
      console.log('Token address from form:', tokenAddress);

      if (!tokenAddress || tokenAddress.trim() === '' || tokenAddress === '0x0000000000000000000000000000000000000000') {
        toast({
          title: "Error",
          description: "Invalid token address. Please ensure the token was created successfully.",
          variant: "destructive",
        });
        return;
      }

      // Validate token address format
      if (!ethers.isAddress(tokenAddress)) {
        toast({
          title: "Error",
          description: "Invalid token address format",
          variant: "destructive",
        });
        return;
      }

      console.log('Approving token for trading:', tokenAddress);

      // Get factory contract
      const factory = await getPropertyFactoryContract(true);
      if (!factory) {
        throw new Error('Failed to get factory contract');
      }

      try {
        // First check if the property is already approved
        const factoryProps = await factory.getAllProperties();
        let isApproved = false;
        
        // Find the property in factory's list and check its approval
        for (const prop of factoryProps) {
          if (prop.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()) {
            isApproved = prop.isApproved;
            break;
          }
        }

        if (isApproved) {
          toast({
            title: "Already Approved",
            description: "This property is already approved for trading",
            variant: "default",
          });
          return;
        }

        // Verify ownership
        const factoryOwner = await factory.owner();
        if (factoryOwner.toLowerCase() !== address.toLowerCase()) {
          toast({
            title: "Error",
            description: "Only the factory owner can approve properties",
            variant: "destructive",
          });
          return;
        }

        // Get property token contract first
        const propertyToken = await getPropertyTokenContract(tokenAddress, true);
        if (!propertyToken) {
          throw new Error('Failed to get property token contract');
        }

        // Get initial approval status for logging
        const initialTokenDetails = await propertyToken.propertyDetails();
        console.log('Initial token status:', initialTokenDetails);

        // Get factory with signer
        const signer = await getSigner();
        const factoryWithSigner = await getPropertyFactoryContract(true);
        
        // Approve the property with explicit gas configuration
        console.log('Approving property in factory...');
        const approveTx = await factoryWithSigner.approveProperty(
          tokenAddress,
          {
            gasLimit: 1000000, // Increased gas limit
            nonce: await signer.provider.getTransactionCount(address)
          }
        );
        
        console.log('Approval transaction sent:', approveTx.hash);
        const receipt = await approveTx.wait();
        console.log('Approval transaction confirmed:', receipt.hash);

        // Look for the PropertyApproved event
        const approvedEvent = receipt.logs.find(
          (log: any) => log.fragment?.name === 'PropertyApproved'
        );

        if (!approvedEvent) {
          throw new Error('Property approval transaction did not emit PropertyApproved event');
        }

        // Update database status
        const { error: dbError } = await supabase
          .from('property_requests')
          .update({ 
            status: 'funding',
            updated_at: new Date().toISOString()
          })
          .eq('id', propertyId);

        if (dbError) {
          console.error('Error updating database:', dbError);
          throw new Error(`Error updating database: ${dbError.message}`);
        }

        // Update form values
        form.setValue('status', 'funding');

        toast({
          title: 'Success',
          description: 'Property has been approved for funding',
        });

        // Get EURC contract and check balance/allowance
        const eurcContract = await getEURCContract(EURC_TOKEN_ADDRESS!, true);
        const eurcBalance = await eurcContract.balanceOf(address);
        console.log('EURC Balance:', ethers.formatUnits(eurcBalance, 6));

        // Get property token with signer
        const propertyTokenWithSigner = await getPropertyTokenContract(tokenAddress, true);
        
        // Check whitelist status
        const whitelistContract = await getWhitelistContract(true);
        const isWhitelisted = await whitelistContract.isWhitelisted(address);
        console.log('Is whitelisted:', isWhitelisted);
        
        if (!isWhitelisted) {
          throw new Error('Address is not whitelisted. Please get whitelisted first.');
        }
        
        // Get property details and owner
        const details = await propertyTokenWithSigner.propertyDetails();
        console.log('Property details:', {
          price: ethers.formatUnits(details.price, 6),
          isActive: details.isActive
        });

        if (!details.isActive) {
          throw new Error('Property is not active for purchase');
        }

        // Calculate token amount and check owner's balance
        const tokenAmount = BigInt(form.getValues('number_of_tokens')) * BigInt(10 ** 18);
        
        // Calculate EURC amount needed
        const eurcNeeded = (details.price * tokenAmount) / BigInt(10 ** 18);
        console.log('EURC needed:', ethers.formatUnits(eurcNeeded, 6));

        // Check EURC balance
        if (eurcBalance < eurcNeeded) {
          throw new Error(`Insufficient EURC balance. Need ${ethers.formatUnits(eurcNeeded, 6)} EURC but have ${ethers.formatUnits(eurcBalance, 6)} EURC`);
        }

        // Check EURC allowance for the property token contract (not the owner)
        const allowance = await eurcContract.allowance(address, tokenAddress);
        console.log('Current EURC allowance for token contract:', ethers.formatUnits(allowance, 6));

        if (allowance < eurcNeeded) {
          console.log('Approving EURC spend for token contract:', ethers.formatUnits(eurcNeeded, 6));
          const approveTx = await eurcContract.approve(tokenAddress, eurcNeeded, {
            gasLimit: 100000
          });
          console.log('Approval transaction sent:', approveTx.hash);
          await approveTx.wait();
          console.log('EURC approved');
        }

        // Get current nonce
        const nonce = await signer.provider.getTransactionCount(address);
        console.log('Current nonce:', nonce);

        // Purchase tokens with explicit gas configuration
        console.log('Purchasing tokens:', ethers.formatUnits(tokenAmount, 18));
        const purchaseTx = await propertyTokenWithSigner.purchaseTokens(
          tokenAmount,
          {
            gasLimit: 500000,
            nonce: nonce
          }
        );

        console.log('Purchase transaction sent:', purchaseTx.hash);
        const purchaseReceipt = await purchaseTx.wait();
        console.log('Purchase confirmed:', purchaseReceipt.hash);

        // Verify the purchase event
        const purchaseEvent = purchaseReceipt.logs.find(
          (log: any) => log.fragment?.name === 'TokensPurchased'
        );

        if (!purchaseEvent) {
          throw new Error('Token purchase did not emit TokensPurchased event');
        }

        const [buyer, amount, eurcAmount] = purchaseEvent.args;
        console.log('Tokens purchased:', {
          buyer,
          amount: ethers.formatUnits(amount, 18),
          eurcAmount: ethers.formatUnits(eurcAmount, 6)
        });

      } catch (error: any) {
        console.error('Error in approval process:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to approve property",
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Error approving property:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve property",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleApproveToken}
      disabled={loading}
      variant="outline"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : null}
      Approve for Trading
    </Button>
  );
}
