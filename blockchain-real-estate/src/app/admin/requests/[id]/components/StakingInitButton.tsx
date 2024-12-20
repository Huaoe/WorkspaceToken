'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useWalletEvents } from "@/app/wallet-events-provider";
import { getPropertyFactoryContract, getSigner } from "@/lib/ethereum";

interface StakingInitButtonProps {
  tokenAddress: string;
}

export function StakingInitButton({ tokenAddress }: StakingInitButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { address, isConnected } = useWalletEvents();

  const handleInitStaking = async () => {
    try {
      setLoading(true);

      if (!isConnected) {
        throw new Error('Please connect your wallet first');
      }

      if (!address) {
        throw new Error('No wallet address available');
      }

      // Get signer
      const signer = await getSigner();
      if (!signer) {
        throw new Error('No signer available');
      }

      // Get factory contract
      const factory = await getPropertyFactoryContract(signer);
      if (!factory) {
        throw new Error('Failed to get factory contract');
      }

      // Initialize staking
      const tx = await factory.initializeStaking(tokenAddress);
      await tx.wait();

      toast({
        title: "Success",
        description: "Staking initialized successfully",
      });
    } catch (error: any) {
      console.error('Error initializing staking:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to initialize staking",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleInitStaking}
      disabled={loading || !isConnected}
    >
      {loading ? (
        <>
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
          Initializing Staking...
        </>
      ) : (
        'Initialize Staking'
      )}
    </Button>
  );
}
