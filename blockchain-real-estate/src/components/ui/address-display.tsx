"use client";

import { useState } from "react";
import { Button } from "./button";
import { toast } from "./use-toast";
import { Copy as CopyIcon, Check as CheckIcon } from "lucide-react";

interface AddressDisplayProps {
  address: string;
  label?: string;
  className?: string;
}

export function AddressDisplay({ address, label, className = "" }: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const truncateAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast({
        description: "Address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        description: "Failed to copy address",
      });
    }
  };

  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      {label && <p className="text-sm text-gray-500">{label}</p>}
      <div className="flex items-center space-x-2">
        <code className="bg-secondary px-2 py-1 rounded text-xs">
          {truncateAddress(address)}
        </code>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={copyToClipboard}
        >
          {copied ? (
            <CheckIcon className="h-4 w-4 text-green-500" />
          ) : (
            <CopyIcon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
