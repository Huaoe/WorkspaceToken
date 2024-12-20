'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Address } from "viem";
import { CopyButton } from "@/components/ui/copy-button";
import { useWalletEvents } from "@/app/wallet-events-provider";
import { getPropertyTokenContract } from "@/lib/ethereum";
import { useEffect, useState } from "react";

interface ContractDetailsProps {
  tokenAddress: Address;
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ContractDetails({ tokenAddress }: ContractDetailsProps) {
  const { address } = useWalletEvents();
  const [owner, setOwner] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOwner() {
      try {
        const contract = getPropertyTokenContract(tokenAddress);
        const ownerAddress = await contract.owner();
        setOwner(ownerAddress);
      } catch (error) {
        console.error('Error fetching owner:', error);
      }
    }

    fetchOwner();
  }, [tokenAddress]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Details</CardTitle>
        <CardDescription>
          View the smart contract details for this property
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-1">Contract Address</h4>
          <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
            <code className="text-xs flex-1 overflow-hidden text-ellipsis" title={tokenAddress}>
              {truncateAddress(tokenAddress)}
            </code>
            <CopyButton value={tokenAddress} />
          </div>
        </div>

        {owner && (
          <div>
            <h4 className="text-sm font-medium mb-1">Owner Address</h4>
            <div className="flex items-center gap-2 bg-muted p-2 rounded-md">
              <code className="text-xs flex-1 overflow-hidden text-ellipsis" title={owner}>
                {truncateAddress(owner)}
              </code>
              <CopyButton value={owner} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
