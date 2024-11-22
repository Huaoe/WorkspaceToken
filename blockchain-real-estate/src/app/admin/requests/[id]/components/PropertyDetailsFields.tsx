'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";

interface PropertyDetailsFieldsProps {
  form: UseFormReturn<any>;
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
              <Textarea placeholder="Property description" {...field} maxLength={50} />
            </FormControl>
            <FormDescription>Brief description of the property (max 50 characters)</FormDescription>
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
        name="image_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Image URL</FormLabel>
            <FormControl>
              <Input placeholder="https://..." {...field} maxLength={100} />
            </FormControl>
            <FormDescription>URL to the property image (max 100 characters)</FormDescription>
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
              <Input placeholder="https://..." {...field} />
            </FormControl>
            <FormDescription>URL to property documents (optional)</FormDescription>
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
              <Input type="number" placeholder="1000" {...field} />
            </FormControl>
            <FormDescription>Total number of tokens to create</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
