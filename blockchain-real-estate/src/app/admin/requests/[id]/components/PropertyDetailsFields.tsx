'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { PropertyStatus } from "@/lib/constants";

export const propertyFormSchema = z.object({
  title: z.string().min(3).max(20),
  description: z.string().min(10).max(500),
  expected_price: z.coerce.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Expected price must be a positive number"
  }),
  number_of_tokens: z.coerce.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 1000000000, {
    message: "Number of tokens must be between 1 and 1,000,000,000",
  }),
  token_name: z.string().min(1).max(50),
  token_symbol: z.string().min(1).max(10),
  status: z.nativeEnum(PropertyStatus),
  location: z.string().min(1).max(100),
  token_address: z.string().optional(),
  roi: z.coerce.number().min(0).max(100),
  payout_duration: z.coerce.number().min(1).max(120),
  image_url: z.string().url().max(100).optional(),
  documents_url: z.string().url().optional(),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

interface PropertyDetailsFieldsProps {
  form: UseFormReturn<PropertyFormValues>;
}

export function PropertyDetailsFields({ form }: PropertyDetailsFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Apartment, House, Villa" {...field} maxLength={20} />
            </FormControl>
            <FormDescription>The title of the property (max 20 characters)</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea placeholder="Property description" {...field} maxLength={500} />
            </FormControl>
            <FormDescription>Brief description of the property (max 500 characters)</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="expected_price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Expected Price (EURC)</FormLabel>
            <FormControl>
              <Input type="number" placeholder="1000000" {...field} />
            </FormControl>
            <FormDescription>The expected price in EURC (6 decimal places)</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="number_of_tokens"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Number of Tokens</FormLabel>
            <FormControl>
              <Input 
                type="text" 
                pattern="[0-9]*"
                placeholder="1000" 
                {...field} 
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  console.log("Number of tokens input change:", {
                    rawValue: e.target.value,
                    cleanedValue: value,
                    fieldValue: field.value,
                  });
                  if (value === '' || (Number(value) > 0 && Number(value) <= 1000000000)) {
                    field.onChange(value);
                  }
                }}
                onBlur={(e) => {
                  console.log("Number of tokens input blur:", {
                    value: e.target.value,
                    fieldValue: field.value,
                  });
                  field.onBlur();
                }}
              />
            </FormControl>
            <FormDescription>Total number of tokens to create (between 1 and 1,000,000,000)</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="token_name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Token Name</FormLabel>
            <FormControl>
              <Input placeholder="e.g., Luxury Villa Token" {...field} maxLength={50} />
            </FormControl>
            <FormDescription>The name of the property token (max 50 characters)</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="token_symbol"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Token Symbol</FormLabel>
            <FormControl>
              <Input placeholder="e.g., LVT" {...field} maxLength={10} />
            </FormControl>
            <FormDescription>The symbol for the property token (max 10 characters)</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <FormControl>
              <Input placeholder="Property status" {...field} />
            </FormControl>
            <FormDescription>Status of the property</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Location</FormLabel>
            <FormControl>
              <Input placeholder="Property location" {...field} maxLength={100} />
            </FormControl>
            <FormDescription>Location of the property (max 100 characters)</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="token_address"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Token Address</FormLabel>
            <FormControl>
              <Input placeholder="Token address" {...field} />
            </FormControl>
            <FormDescription>Address of the property token</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="roi"
        render={({ field }) => (
          <FormItem>
            <FormLabel>ROI</FormLabel>
            <FormControl>
              <Input type="number" placeholder="10" {...field} />
            </FormControl>
            <FormDescription>Return on Investment (between 0 and 100)</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="payout_duration"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Payout Duration</FormLabel>
            <FormControl>
              <Input type="number" placeholder="12" {...field} />
            </FormControl>
            <FormDescription>Payout duration in months (between 1 and 120)</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="image_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Image URL</FormLabel>
            <FormControl>
              <Input placeholder="Image URL" {...field} maxLength={100} />
            </FormControl>
            <FormDescription>URL of the property image (max 100 characters)</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="documents_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Documents URL</FormLabel>
            <FormControl>
              <Input placeholder="Documents URL" {...field} />
            </FormControl>
            <FormDescription>URL of the property documents</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
