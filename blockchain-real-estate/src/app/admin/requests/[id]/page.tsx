'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { StatusField } from './components/StatusField';
import { PropertyDetailsFields } from './components/PropertyDetailsFields';
import { LocationField } from './components/LocationField';
import { ActionButtons } from './components/ActionButtons';
import { ClientOnly } from './components/ClientOnly';
import { useAccount, usePublicClient, useWalletClient, useSwitchChain, useReadContract } from "wagmi";
import propertyFactoryJSON from '@contracts/abis/PropertyFactory.json';
import { type Abi } from 'viem';
import { parseUnits } from 'viem';

const formSchema = z.object({
  title: z.string().min(3).max(20, {
    message: "Title must be between 3 and 20 characters.",
  }),
  description: z.string().min(10).max(50, {
    message: "Description must be between 10 and 50 characters.",
  }),
  location: z.string().min(2).max(256, {
    message: "Location must be between 2 and 256 characters.",
  }),
  expected_price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be a valid number greater than 0",
  }),
  image_url: z.string().url("Please enter a valid image URL").max(100, {
    message: "Image URL must be less than 100 characters.",
  }).optional(),
  documents_url: z.string().url("Please enter a valid document URL").optional(),
  number_of_tokens: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Number of tokens must be a valid number greater than 0",
  }),
  status: z.enum(['pending', 'approved', 'rejected', 'onchain']),
});

function CreateTokenButton({ id, status, formData }: { id: string, status: string, formData: any }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const { address, isConnected } = useAccount();
  const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as `0x${string}`;
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const router = useRouter();
  const propertyFactoryABI = propertyFactoryJSON.abi as Abi;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (walletClient) {
      console.log('Wallet client ready:', walletClient);
    }
  }, [walletClient]);

  const { data: factoryOwner } = useReadContract({
    address: contractAddress,
    abi: propertyFactoryABI,
    functionName: 'owner',
  });

  const isOwner = address && factoryOwner && factoryOwner.toLowerCase() === address.toLowerCase();

  if (!mounted || !isConnected) {
    return null;
  }

  const testTransaction = async () => {
    console.log('Starting test transaction...');
    console.log('Wallet client:', walletClient);
    console.log('Connected:', isConnected);
    console.log('Address:', address);
    console.log('Contract address:', contractAddress);
    console.log('Chain:', walletClient?.chain);

    if (!walletClient || !address || !contractAddress) {
      console.error('Missing required values:', { walletClient, address, contractAddress });
      toast({
        title: "Error",
        description: "Missing required values",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      console.log('Testing transaction with PropertyFactory contract...');

      // Prepare the transaction request
      const request = {
        address: contractAddress,
        abi: propertyFactoryABI,
        functionName: 'createProperty',
        args: [
          'Test Property',
          'Test Description',
          'Test Location',
          'https://example.com/image.jpg',
          BigInt(1000000), // 1 EURC
        ],
        account: address,
        chain: walletClient.chain,
      } as const;

      console.log('Preparing transaction with request:', request);

      try {
        // Execute transaction
        console.log('Executing transaction...');
        const hash = await walletClient.writeContract(request);
        console.log('Transaction hash:', hash);

        toast({
          title: "Transaction Sent",
          description: "Waiting for confirmation...",
        });

        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash,
          timeout: 60_000,
        });

        console.log('Transaction receipt:', receipt);

        if (receipt.status === 'success') {
          toast({
            title: "Success!",
            description: "Test transaction confirmed",
          });
        } else {
          throw new Error('Transaction failed');
        }
      } catch (txError) {
        console.error('Transaction execution failed:', txError);
        throw txError;
      }
    } catch (error) {
      console.error('Transaction test failed:', error);
      toast({
        title: "Error",
        description: "Transaction test failed: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const convertPriceToTokens = (price: string | number): bigint => {
    let numericPrice: number;
    if (typeof price === 'string') {
      numericPrice = parseFloat(price);
    } else {
      numericPrice = price;
    }

    if (isNaN(numericPrice) || numericPrice <= 0) {
      throw new Error('Invalid price value');
    }

    return parseUnits(numericPrice.toString(), 6);
  };

  const handleCreateToken = async () => {
    if (!walletClient || !formData || !isConnected) {
      toast({
        title: "Error",
        description: "Please connect your wallet and ensure form data is complete",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      console.log('Starting token creation with:', {
        contractAddress,
        formData,
        walletAddress: address,
      });

      const priceValue = convertPriceToTokens(formData.expected_price);
      console.log('Converted price:', priceValue.toString());

      const params = {
        address: contractAddress,
        abi: propertyFactoryABI,
        functionName: 'createProperty',
        args: [
          formData.title,
          formData.description,
          formData.location,
          formData.image_url || '',
          priceValue,
        ],
      };

      const { request } = await publicClient.simulateContract({
        ...params,
        account: address,
      });
      console.log('Simulation successful:', request);

      toast({
        title: "Confirm Transaction",
        description: "Please confirm the transaction in your wallet",
      });

      const hash = await walletClient.sendTransaction(request);
      
      console.log('Transaction submitted:', hash);

      toast({
        title: "Transaction Sent",
        description: "Creating property token...",
      });

      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash, 
        timeout: 60_000,
      });

      console.log('Transaction receipt:', receipt);

      if (receipt.status === 'success') {
        await supabase
          .from('property_requests')
          .update({ status: 'onchain' })
          .eq('id', id);

        toast({
          title: "Success!",
          description: "Property token created successfully",
        });

        router.push('/admin/requests');
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Contract interaction error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create property token",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (status !== 'approved' || !isOwner) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Button 
        onClick={testTransaction}
        disabled={loading}
        className="bg-secondary"
      >
        {loading ? 'Testing Transaction...' : 'Test Transaction'}
      </Button>
      
      <Button 
        onClick={handleCreateToken} 
        disabled={loading}
        className="bg-primary"
      >
        {loading ? 'Creating Token...' : 'Create Token'}
      </Button>
    </div>
  );
}

export default function ReviewRequest() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const status = form.watch('status');
  
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const { data, error } = await supabase
          .from('property_requests')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        form.reset({
          title: data.title,
          description: data.description,
          location: data.location,
          expected_price: data.expected_price.toString(),
          image_url: data.image_url || '',
          documents_url: data.documents_url || '',
          number_of_tokens: data.number_of_tokens?.toString() || '',
          status: data.status,
        });
      } catch (error) {
        console.error('Error fetching request:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch property request',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, toast, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setSaving(true);

      const now = new Date().toISOString();
      const updates = {
        title: values.title,
        description: values.description,
        location: values.location,
        expected_price: Number(values.expected_price),
        image_url: values.image_url || null,
        documents_url: values.documents_url || null,
        number_of_tokens: Number(values.number_of_tokens),
        status: values.status,
      };

      if (values.status === 'approved') {
        updates['approved_at'] = now;
      } else if (values.status === 'rejected') {
        updates['rejected_at'] = now;
      } else if (values.status === 'onchain') {
        updates['tokenized_at'] = now;
      }

      const { error } = await supabase
        .from('property_requests')
        .update(updates)
        .match({ id });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Property request updated successfully',
      });

      router.refresh();
    } catch (error) {
      console.error('Error saving request:', error);
      toast({
        title: 'Error',
        description: 'Failed to save property request',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <p>Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Review Property Request</CardTitle>
          <CardDescription>Review and update property request details</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <StatusField form={form} />
              <PropertyDetailsFields form={form} />
              <LocationField form={form} />
              
              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => router.push('/admin/requests')}>
                  Back
                </Button>
                <div className="flex gap-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <ClientOnly>
                    {() => <CreateTokenButton id={id} status={status} formData={form.getValues()} />}
                  </ClientOnly>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
