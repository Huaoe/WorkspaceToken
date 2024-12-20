'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_OPTIONS, PropertyStatus } from "@/lib/constants";
import { UseFormReturn } from "react-hook-form";
import { propertyFormSchema } from "./PropertyDetailsFields";
import { z } from "zod";

type FormValues = z.infer<typeof propertyFormSchema>;

interface StatusFieldProps {
  form: UseFormReturn<FormValues>;
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
        <FormItem className="w-full">
          <FormLabel>Status</FormLabel>
          <FormControl>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              defaultValue={field.value}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    className={`${getStatusColor(status)} text-white`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
          <FormDescription>Current status of the property request</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
