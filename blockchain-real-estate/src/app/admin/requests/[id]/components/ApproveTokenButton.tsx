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
        toast({
          title: "Error",
          description: "Invalid token address. Please ensure the token was created successfully.",
          variant: "destructive",
        });
        return;
      }

      // Validate token address format
      if (!ethers.isAddress(tokenAddress)) {
        throw new Error('Invalid token address format');
      }

      console.log('Approving token for trading:', tokenAddress);

      // Get contracts
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
          const tx = await factory.setValidator(signerAddress);
          await tx.wait();
          console.log('Updated validator to:', signerAddress);
        } else {
          throw new Error(`Not authorized. Only validator (${validator}) can approve properties. Please connect with the validator wallet.`);
        }
      }

      // Get property count for debugging
      const propertyCount = await factory.getPropertyCount();
      console.log('Property count:', propertyCount.toString());

      // Check if property exists and get its index
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

      // Call approveProperty on the factory
      console.log('Approving property token:', tokenAddress);
      const tx = await factory.approveProperty(tokenAddress);
      console.log('Approval transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Property approved:', receipt.hash);

      // Get updated property state
      const propertyToken = await getPropertyTokenContract(tokenAddress, true);
      const [newOwner, newIsApproved] = await Promise.all([
        propertyToken.owner(),
        factory.properties(propertyIndex).then((prop: any) => prop.isApproved)
      ]);

      console.log('Updated property state:', {
        address: tokenAddress,
        owner: newOwner,
        isApproved: newIsApproved
      });

      // Update the database status
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
        description: "Property has been approved for trading",
      });

    } catch (error: any) {
      console.error('Error in approval process:', error);
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
