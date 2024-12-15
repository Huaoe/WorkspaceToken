'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccount, useContractRead } from "wagmi";
import { Address } from "viem";
import propertyTokenABI from '@contracts/abis/PropertyToken.json';
import { CopyButton } from "@/components/ui/copy-button";

interface ContractDetailsProps {
  tokenAddress: Address;
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ContractDetails({ tokenAddress }: ContractDetailsProps) {
  const { address } = useAccount();

  // Read owner address from contract
  const { data: owner } = useContractRead({
    address: tokenAddress,
    abi: propertyTokenABI.abi,
    functionName: 'owner',
  });

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
              <code className="text-xs flex-1 overflow-hidden text-ellipsis" title={owner as string}>
                {truncateAddress(owner as string)}
              </code>
              <CopyButton value={owner as string} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
