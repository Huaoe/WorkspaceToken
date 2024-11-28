'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_COLORS, STATUS_OPTIONS, PropertyStatus } from "@/lib/constants";
import { UseFormReturn } from "react-hook-form";

interface StatusFieldProps {
  form: UseFormReturn<{
    status: PropertyStatus;
    [key: string]: any;
  }>;
}

export function StatusField({ form }: StatusFieldProps) {
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
                    <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[field.value as PropertyStatus] ? `bg-${STATUS_COLORS[field.value as PropertyStatus]}-500` : ''}`} />
                    <span className="capitalize">{field.value === 'onchain' ? 'On Chain' : field.value}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${STATUS_COLORS[status]}-500`} />
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
