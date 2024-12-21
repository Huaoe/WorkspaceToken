'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useWalletEvents } from "@/app/wallet-events-provider";
import { getPropertyFactoryContract, getSigner, getPropertyTokenContract } from "@/lib/ethereum";
import { UseFormReturn } from "react-hook-form";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/supabase/types";

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

      if (!tokenAddress || tokenAddress.trim() === '') {
        toast({
          title: "Error",
          description: "Please create the token first before approving",
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
        console.log('Initial token status:', {
          isActive: initialTokenDetails.isActive
        });

        // Approve the property with explicit gas configuration
        console.log('Approving property in factory...');
        const approveTx = await factory.approveProperty(tokenAddress, {
          gasLimit: 500000 // Explicit gas limit
        });
        
        console.log('Waiting for approval transaction...');
        const receipt = await approveTx.wait();
        console.log('Approval transaction receipt:', receipt);

        // Look for the PropertyApproved event
        const approvedEvent = receipt.logs.find(
          (log: any) => log.fragment?.name === 'PropertyApproved'
        );

        if (!approvedEvent) {
          throw new Error('Property approval transaction did not emit PropertyApproved event');
        }

        // Verify final approval status
        const finalTokenDetails = await propertyToken.propertyDetails();
        
        // Check final factory approval status
        const finalFactoryProps = await factory.getAllProperties();
        let finalFactoryApproval = false;
        for (const prop of finalFactoryProps) {
          if (prop.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()) {
            finalFactoryApproval = prop.isApproved;
            break;
          }
        }

        console.log('Final status:', {
          factoryApproval: finalFactoryApproval,
          tokenActive: finalTokenDetails.isActive
        });

        if (!finalFactoryApproval || !finalTokenDetails.isActive) {
          throw new Error('Property approval failed - not fully approved');
        }

        // Update database status
        const { error: dbError } = await supabase
          .from('property_requests')
          .update({ status: 'active' })
          .eq('id', propertyId);

        if (dbError) {
          console.error('Error updating database:', dbError);
          throw new Error('Failed to update database status');
        }

        toast({
          title: "Success",
          description: "Property approved for trading",
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
