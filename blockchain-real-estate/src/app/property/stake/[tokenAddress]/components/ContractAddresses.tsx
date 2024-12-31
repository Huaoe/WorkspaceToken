"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyIcon, ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface NetworkConfig {
  name: string;
  explorer: string;
}

interface ContractAddressesProps {
  addresses: {
    propertyToken: string;
    stakingContract: string;
    stakingFactory: string;
    rewardToken: string;
  };
  chainId: number;
  networkConfig: {
    [key: number]: NetworkConfig;
  };
}

export function ContractAddresses({ addresses, chainId, networkConfig }: ContractAddressesProps) {
  const { toast } = useToast();
  const network = networkConfig[chainId] || { name: 'Unknown Network', explorer: '#' };

  const copyToClipboard = (text: string, label: string) => {
    if (!text || text === 'Not deployed') return;
    navigator.clipboard.writeText(text);
    toast({
      description: `${label} address copied to clipboard`,
    });
  };

  const formatAddress = (address: string) => {
    if (!address) return "Not deployed";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getExplorerLink = (address: string) => {
    if (!address || address === 'Not deployed' || network.explorer === '#') return '#';
    return `${network.explorer}/address/${address}`;
  };

  const addressItems = [
    { label: "Property Token", address: addresses.propertyToken },
    { label: "Staking Contract", address: addresses.stakingContract },
    { label: "Staking Factory", address: addresses.stakingFactory },
    { label: "Reward Token (EURC)", address: addresses.rewardToken },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract Addresses</CardTitle>
        <CardDescription>
          View and copy contract addresses on {network.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {addressItems.map((item) => (
            <div key={item.label} className="flex flex-col space-y-2">
              <span className="text-sm text-muted-foreground">
                {item.label}
              </span>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-muted px-2 py-1 rounded">
                  {formatAddress(item.address)}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(item.address, item.label)}
                  disabled={!item.address || item.address === 'Not deployed'}
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(getExplorerLink(item.address), '_blank')}
                  disabled={!item.address || item.address === 'Not deployed' || network.explorer === '#'}
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
