'use client';

import { useEffect, useState } from 'react';
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/lib/supabase';
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
  FormMessage 
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { propertyFactoryABI } from '@/contracts/abis/propertyFactoryABI';
import { parseEther } from 'viem';
import Image from 'next/image';

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
  documents_url: z.string()
    .url('Please enter a valid URL for documents')
    .optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'onchain']),
  owner_address: z.string(),
})

type FormValues = z.infer<typeof formSchema>

export default function ReviewRequest() {
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const { address, isConnected } = useAccount();
  const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as `0x${string}`;

  // Contract write for creating properties
  const { write: createProperty, data: createPropertyData } = useContractWrite({
    address: contractAddress,
    abi: propertyFactoryABI,
    functionName: 'createProperty',
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create property",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const { isLoading: isPropertyCreating } = useWaitForTransaction({
    hash: createPropertyData?.hash,
    onSuccess: async () => {
      // Update status to onchain in Supabase
      const { error: updateError } = await supabase
        .from('property_requests')
        .update({
          status: 'onchain'
        })
        .eq('id', params.id);

      if (updateError) {
        toast({
          title: "Warning",
          description: "Property created on chain but failed to update status",
          variant: "destructive",
          duration: 5000,
        });
      }

      toast({
        title: "Success!",
        description: "Property created successfully on the blockchain!",
        duration: 5000,
      });
      router.push('/admin/requests');
    },
  });

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (!isConnected) {
      setIsInitializing(false);
      return;
    }

    fetchRequest();
  }, [address, isConnected]);

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
      setIsInitializing(false);
    }
  }

  async function onSubmit(values: FormValues) {
    try {
      setLoading(true);

      // Update in Supabase
      const { error: updateError } = await supabase
        .from('property_requests')
        .update({
          title: values.title,
          description: values.description,
          location: values.location,
          image_url: values.image_url,
          expected_price: values.expected_price,
          documents_url: values.documents_url,
          status: values.status,
          owner_address: values.owner_address
        })
        .eq('id', params.id);

      if (updateError) throw updateError;

      toast({
        title: "Success! ",
        description: `Property request ${values.status === 'approved' ? 'approved' : 'updated'} successfully`,
        duration: 5000,
      });

      router.push('/admin/requests');
    } catch (err) {
      console.error('Error updating request:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update request',
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  async function onCreateProperty(data: FormValues) {
    try {
      if (!address) {
        toast({
          title: "Error",
          description: "Please connect your wallet first",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }

      const args = [
        data.title,
        data.description,
        data.location,
        data.image_url,
        parseEther(data.expected_price.toString()),
      ] as const;

      createProperty?.({
        args,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create property",
        variant: "destructive",
        duration: 5000,
      });
    }
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Please connect your wallet to continue</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
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
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Review Property Request</CardTitle>
              <CardDescription>Review and update property request details</CardDescription>
            </div>
            <Badge 
              variant={
                form.getValues("status") === 'approved' ? 'success' :
                form.getValues("status") === 'rejected' ? 'destructive' :
                form.getValues("status") === 'pending' ? 'secondary' :
                form.getValues("status") === 'onchain' ? 'purple' :
                'outline'
              }
              className={form.getValues("status") === 'onchain' ? 'bg-purple-500 hover:bg-purple-600 text-white' : ''}
            >
              {form.getValues("status") === 'onchain' ? '🦄 ' : ''}
              {form.getValues("status")?.charAt(0).toUpperCase() + form.getValues("status")?.slice(1)}
            </Badge>
          </div>
        </CardHeader>
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
                      <Image
                        id="preview-image"
                        src={field.value}
                        alt="Property Preview"
                        className="object-cover w-full h-full rounded-md"
                        onError={() => field.onChange('/images/property-placeholder.svg')}
                        width={500}
                        height={300}
                        priority={true}
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
                name="documents_url"
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
                      <div className="flex items-center gap-2">
                        <select
                          {...field}
                          className={`flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                            field.value === 'approved' ? 'text-green-600' : 
                            field.value === 'rejected' ? 'text-red-600' : 
                            field.value === 'onchain' ? 'text-blue-600' : 
                            'text-yellow-600'
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="onchain">On-chain</option>
                        </select>
                        <Badge 
                          variant={
                            field.value === 'approved' ? 'success' :
                            field.value === 'rejected' ? 'destructive' :
                            field.value === 'pending' ? 'secondary' :
                            field.value === 'onchain' ? 'purple' :
                            'outline'
                          }
                          className={field.value === 'onchain' ? 'bg-purple-500 hover:bg-purple-600 text-white' : ''}
                        >
                          {field.value === 'onchain' ? '🦄 ' : ''}
                          {field.value.charAt(0).toUpperCase() + field.value.slice(1)}
                        </Badge>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="owner_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4 mt-6">
                <Button 
                  type="submit" 
                  disabled={loading || isPropertyCreating}
                >
                  Save Changes
                </Button>
                <Button 
                  type="button"
                  variant="destructive"
                  onClick={() => onCreateProperty(form.getValues())}
                  disabled={loading || isPropertyCreating || form.getValues('status') !== 'approved' || form.getValues('status') === 'onchain'}
                >
                  Create Property
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
