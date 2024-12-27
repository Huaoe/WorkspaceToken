'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useWalletEvents } from "@/app/wallet-events-provider";
import { getPropertyFactoryContract, getSigner, getPropertyTokenContract, getEURCContract, getWhitelistContract, getProvider } from "@/lib/ethereum";
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
        throw new Error("Invalid token address. Please ensure the token was created successfully.");
      }
  
      // Validate token address format
      if (!ethers.isAddress(tokenAddress)) {
        throw new Error('Invalid token address format');
      }
  
      console.log('Approving token for trading:', tokenAddress);
  
      // Get contracts with signer
      const signer = await getSigner();
      const factory = await getPropertyFactoryContract(true);
      
      // Check if signer is validator
      const validator = await factory.validator();
      const signerAddress = await signer.getAddress();
      console.log('Validator check:', {
        validator,
        signer: signerAddress,
        isValidator: validator.toLowerCase() === signerAddress.toLowerCase()
      });
  
      if (validator.toLowerCase() !== signerAddress.toLowerCase()) {
        // If not validator, try to get validator role
        const factoryOwner = await factory.owner();
        if (factoryOwner.toLowerCase() === signerAddress.toLowerCase()) {
          console.log('Signer is factory owner, updating validator...');
          const setValidatorTx = await factory.setValidator(signerAddress, {
            gasLimit: BigInt(200000)
          });
          await setValidatorTx.wait();
          console.log('Updated validator to:', signerAddress);
        } else {
          throw new Error(`Not authorized. Only validator (${validator}) can approve properties.`);
        }
      }
  
      // Get property count and check property
      const propertyCount = await factory.getPropertyCount();
      console.log('Property count:', propertyCount.toString());
  
      let propertyIndex = -1;
      const count = parseInt(propertyCount.toString());
      
      console.log('Checking properties...');
      for (let i = 0; i < count; i++) {
        const prop = await factory.properties(i);
        console.log(`Property ${i}:`, {
          tokenAddress: prop.tokenAddress,
          isApproved: prop.isApproved
        });
        
        if (prop.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()) {
          propertyIndex = i;
          if (prop.isApproved) {
            throw new Error('Property is already approved');
          }
          break;
        }
      }
  
      if (propertyIndex === -1) {
        throw new Error(`Property token ${tokenAddress} not found in factory`);
      }
  
      console.log('Found property at index:', propertyIndex);
  
      // Prepare transaction data
      const approveData = factory.interface.encodeFunctionData('approveProperty', [tokenAddress]);
      
      // Get nonce
      const nonce = await signer.provider.getTransactionCount(signerAddress, 'latest');
  
      // Prepare transaction
      const txRequest = {
        to: factory.target,
        from: signerAddress,
        nonce: nonce,
        gasLimit: BigInt(500000),
        data: approveData,
        chainId: (await signer.provider.getNetwork()).chainId
      };
  
      console.log('Sending transaction:', txRequest);
  
      // Send transaction
      const tx = await signer.sendTransaction(txRequest);
  
      toast({
        title: "Transaction Submitted",
        description: "Approval transaction is being processed..."
      });
  
      console.log('Transaction hash:', tx.hash);
      const receipt = await tx.wait();
      console.log('Property approved:', receipt.hash);
  
      // Verify approval
      const propertyToken = await getPropertyTokenContract(tokenAddress, true);
      const [newOwner, newIsApproved] = await Promise.all([
        propertyToken.owner(),
        factory.properties(propertyIndex).then((prop: any) => prop.isApproved)
      ]);
  
      if (!newIsApproved) {
        throw new Error('Property approval verification failed');
      }
  
      // Update database
      const { error: updateError } = await supabase
        .from('property_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        })
        .eq('id', propertyId);
  
      if (updateError) {
        console.error('Error updating database:', updateError);
        throw new Error('Failed to update database status');
      }
  
      toast({
        title: "Success",
        description: "Property has been approved for trading"
      });
  
    } catch (error: any) {
      console.error('Error in approval process:', error);
      
      // Handle specific error cases
      let errorMessage = "Failed to approve property";
      if (error.message?.includes("user rejected")) {
        errorMessage = "Transaction was rejected in your wallet";
      } else if (error.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds for transaction";
      } else if (error.message?.includes("nonce")) {
        errorMessage = "Transaction nonce error. Please try again";
      } else if (error.code === -32603) {
        errorMessage = "Network error. Please try again with higher gas limit";
      }
  
      toast({
        title: "Error",
        description: errorMessage,
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
