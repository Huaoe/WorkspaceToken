'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { useWalletEvents } from "@/app/wallet-events-provider";
import { getPropertyFactoryContract, getSigner } from "@/lib/ethereum";
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

      const tokenAddress = form.getValues('token_address');
      if (!tokenAddress) {
        throw new Error('No token address available');
      }

      console.log('Approving token for trading:', tokenAddress);

      // Get signer and verify connection
      const signer = await getSigner();
      if (!signer) {
        throw new Error('No signer available');
      }

      // Get factory contract
      const factory = await getPropertyFactoryContract(true);
      if (!factory) {
        throw new Error('Failed to get property factory contract');
      }

      // Verify ownership
      const factoryOwner = await factory.owner();
      if (factoryOwner.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Only the factory owner can approve properties');
      }



      // Approve the property
      console.log('Approving property...');
      const tx = await factory.approveProperty(tokenAddress);
      await tx.wait();
      console.log('Property approved for trading');

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
