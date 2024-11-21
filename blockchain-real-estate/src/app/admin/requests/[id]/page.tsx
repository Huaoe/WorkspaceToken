'use client';

import { useEffect, useState } from 'react';
import { useAccount, useContractRead, useContractWrite } from 'wagmi';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { propertyFactoryABI } from '@/contracts/abis/propertyFactoryABI';
import { supabase } from '@/lib/supabase';
import { Address } from 'viem';
import { useRouter, useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

const formSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(50, 'Title must not exceed 50 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters'),
  location: z.string()
    .min(3, 'Location must be at least 3 characters')
    .max(100, 'Location must not exceed 100 characters'),
  image_url: z.string()
    .url('Please enter a valid URL'),
  expected_price: z.coerce.number()
    .min(0.000001, 'Expected price must be greater than 0')
    .max(1000000, 'Expected price must not exceed 1,000,000 ETH'),
  documents: z.string()
    .url('Please enter a valid URL for documents')
    .optional(),
  status: z.enum(['pending', 'approved', 'rejected']),
  wallet_address: z.string(),
})

type FormValues = z.infer<typeof formSchema>

export default function ReviewRequest() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const { address, isConnected } = useAccount();
  const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as Address;

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  // Read owner from the contract
  const { data: owner } = useContractRead({
    address: contractAddress,
    abi: propertyFactoryABI,
    functionName: 'owner',
  });

  // Contract write for approving properties
  const { writeAsync: approveProperty } = useContractWrite({
    address: contractAddress,
    abi: propertyFactoryABI,
    functionName: 'approveProperty',
  });

  useEffect(() => {
    if (!isConnected || !address) {
      router.push('/');
      return;
    }

    // Check if the connected address is the owner
    if (owner && address !== owner) {
      router.push('/');
      return;
    }

    fetchRequest();
  }, [address, isConnected, owner]);

  async function fetchRequest() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('property_requests')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      if (data) {
        // Set form default values
        form.reset(data);
      }
    } catch (err) {
      console.error('Error fetching request:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch request');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(data: FormValues) {
    try {
      setLoading(true);

      // Update in Supabase
      const { error: updateError } = await supabase
        .from('property_requests')
        .update(data)
        .eq('id', params.id);

      if (updateError) throw updateError;

      // If status is approved, call the smart contract
      if (data.status === 'approved') {
        try {
          await approveProperty({
            args: [data.wallet_address],
          });
        } catch (contractError) {
          console.error('Contract error:', contractError);
          toast({
            title: "Contract Error",
            description: "Failed to approve property on the blockchain",
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Success",
        description: "Property request updated successfully",
      });

      router.push('/admin/requests');
    } catch (err) {
      console.error('Error updating request:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update request',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!isConnected || !address) {
    return <div className="text-center p-8">Please connect your wallet</div>;
  }

  if (owner && address !== owner) {
    return <div className="text-center p-8">Access restricted to factory owner</div>;
  }

  if (loading) {
    return <div className="text-center p-8">Loading request...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Review Property Request</h1>
        <Button variant="outline" onClick={() => router.push('/admin/requests')}>
          Back to Requests
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
                      <Textarea {...field} />
                    </FormControl>
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
                      <Input {...field} />
                    </FormControl>
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
                      <Input {...field} onChange={(e) => {
                        field.onChange(e);
                        // Update preview image
                        const img = document.getElementById('preview-image') as HTMLImageElement;
                        if (img) {
                          img.src = e.target.value;
                        }
                      }} />
                    </FormControl>
                    <div className="mt-2 aspect-video relative rounded-lg overflow-hidden bg-gray-100">
                      <img
                        id="preview-image"
                        src={field.value}
                        alt="Property Preview"
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.src = 'https://via.placeholder.com/800x600?text=Invalid+Image+URL';
                        }}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expected_price"
                render={({ field: { value, onChange, ...field } }) => (
                  <FormItem>
                    <FormLabel>Expected Price (ETH)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        type="number"
                        step="0.000001"
                        value={value}
                        onChange={(e) => onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the price in ETH (e.g., 1.5 for 1.5 ETH)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documents URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
                      <select
                        {...field}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wallet_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wallet Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/requests')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
