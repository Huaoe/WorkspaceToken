'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_COLORS } from "@/lib/constants";
import { UseFormReturn } from "react-hook-form";

interface StatusFieldProps {
  form: UseFormReturn<any>;
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
                    <div className={`w-2 h-2 rounded-full bg-${STATUS_COLORS[field.value]}-500`} />
                    <span className="capitalize">{field.value}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {Object.entries(STATUS_COLORS).map(([status, color]) => (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${color}-500`} />
                    <span className="capitalize">{status}</span>
                  </div>
                </SelectItem>
              ))}
              <SelectItem value="onchain">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="capitalize">On Chain</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <FormDescription>Current status of the property request</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
