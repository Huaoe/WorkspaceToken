'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KYCSubmissionCardProps {
  submission: any;
  onStatusChange: () => void;
  onValidate: (id: string, status: 'approved' | 'rejected') => void;
}

export function KYCSubmissionCard({ submission, onStatusChange, onValidate }: KYCSubmissionCardProps) {
  return (
    <Card key={submission.id}>
      <CardContent className="flex justify-between items-center py-4">
        <div className="flex items-center space-x-4">
          <User className="h-6 w-6" />
          <div>
            <p className="font-medium">
              {submission.wallet_address.substring(0, 6)}...
              {submission.wallet_address.substring(
                submission.wallet_address.length - 4
              )}
            </p>
            <p className="text-sm text-gray-500">
              Submitted{' '}
              {formatDistanceToNow(new Date(submission.created_at), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          {submission.status === 'pending' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onValidate(submission.id, 'rejected')}
              >
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => onValidate(submission.id, 'approved')}
              >
                Approve
              </Button>
            </>
          ) : (
            <Badge
              className={
                submission.status === 'approved'
                  ? 'bg-green-500'
                  : 'bg-red-500'
              }
            >
              {submission.status}
            </Badge>
          )}
          {submission.whitelist_tx_hash && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-2"
                    onClick={() =>
                      window.open(
                        `https://sepolia.etherscan.io/tx/${submission.whitelist_tx_hash}`,
                        '_blank'
                      )
                    }
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View transaction on Etherscan</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
