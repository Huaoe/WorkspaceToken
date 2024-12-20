'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Percent, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from 'next/navigation';

interface PropertyRequestCardProps {
  request: any;
  onStatusChange: () => void;
}

export function PropertyRequestCard({ request, onStatusChange }: PropertyRequestCardProps) {
  const router = useRouter();

  return (
    <Card key={request.id} className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{request.title}</CardTitle>
            <CardDescription className="mt-2">
              {request.description?.substring(0, 100)}...
            </CardDescription>
          </div>
          <Badge
            className={
              request.status === 'pending'
                ? 'bg-yellow-500'
                : request.status === 'approved'
                ? 'bg-green-500'
                : request.status === 'rejected'
                ? 'bg-red-500'
                : 'bg-blue-500'
            }
          >
            {request.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{request.location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
            </span>
          </div>
          {request.expected_price && (
            <div className="flex items-center space-x-2">
              <span className="text-sm">
                {request.expected_price} EURC
              </span>
            </div>
          )}
          {request.roi && (
            <div className="flex items-center space-x-2">
              <Percent className="h-4 w-4" />
              <span className="text-sm">{request.roi}% ROI</span>
            </div>
          )}
          {request.payout_duration && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm">
                {request.payout_duration} days payout
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/admin/requests/${request.id}`)}
        >
          View Details
        </Button>
        {request.token_address && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-2"
                  onClick={() =>
                    window.open(
                      `https://sepolia.etherscan.io/address/${request.token_address}`,
                      '_blank'
                    )
                  }
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View on Etherscan</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardFooter>
    </Card>
  );
}
