'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_OPTIONS, PropertyStatus } from "@/lib/constants";
import { UseFormReturn } from "react-hook-form";

interface StatusFieldProps {
  form: UseFormReturn<{
    status: PropertyStatus;
    [key: string]: any;
  }>;
}

export function StatusField({ form }: StatusFieldProps) {
  const getStatusColor = (status: PropertyStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'onchain':
        return 'bg-yellow-500';
      case 'funding':
        return 'bg-purple-500';
      case 'staking':
        return 'bg-blue-500';
      case 'closed':
        return 'bg-gray-500';
      case 'paused':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <FormField
      control={form.control}
      name="status"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Status</FormLabel>
          <Select
            value={field.value}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(field.value as PropertyStatus)}`} />
                    <span className="capitalize">{field.value === 'onchain' ? 'On Chain' : field.value}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                    <span className="capitalize">{status === 'onchain' ? 'On Chain' : status}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>Current status of the property request</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
