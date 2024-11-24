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

      // Add timestamps based on status
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
                    <ActionButtons id={id as string} status={status} onSuccess={router.refresh} />
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
