'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, ExternalLink, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from 'react';

interface KYCSubmissionCardProps {
  submission: {
    id: string;
    wallet_address: string;
    status: string;
    created_at: string;
    whitelist_tx_hash?: string;
  };
  handleKYCValidation: (id: string, status: 'approved' | 'rejected') => Promise<void>;
}

export function KYCSubmissionCard({ submission, handleKYCValidation }: KYCSubmissionCardProps) {
  const [isValidating, setIsValidating] = useState(false);

  const handleValidation = async (status: 'approved' | 'rejected') => {
    setIsValidating(true);
    try {
      await handleKYCValidation(submission.id, status);
    } catch (error) {
      console.error('Error validating KYC:', error);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card key={submission.id}>
      <CardContent className="flex justify-between items-center py-4">
        <div className="flex items-center space-x-4">
          <User className="h-6 w-6" />
          <div>
            <p className="font-medium">
              {submission.wallet_address.substring(0, 6)}...
              {submission.wallet_address.substring(submission.wallet_address.length - 4)}
            </p>
            <p className="text-sm text-muted-foreground">
              Submitted {formatDistanceToNow(new Date(submission.created_at))} ago
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {submission.whitelist_tx_hash && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${submission.whitelist_tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-accent rounded-full transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View transaction on Etherscan</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {isValidating ? (
            <Button disabled>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </Button>
          ) : (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleValidation('rejected')}
              >
                Reject
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleValidation('approved')}
              >
                Approve
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
