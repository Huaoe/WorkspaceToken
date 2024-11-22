'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAccount } from 'wagmi'
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from '@/lib/supabase'

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
  imageUrl: z.string()
    .url('Please enter a valid URL')
    .max(500, 'URL must not exceed 500 characters'),
  expectedPrice: z.string()
    .min(1, 'Expected price is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Please enter a valid positive number',
    }),
  documents: z.string()
    .url('Please enter a valid URL for documents')
    .max(500, 'URL must not exceed 500 characters')
    .optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function PropertyRequest() {
  const { address } = useAccount()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      imageUrl: '',
      expectedPrice: '',
      documents: '',
    },
  })

  const onSubmit = async (data: FormValues) => {
    if (!address) {
      toast({
        title: "Error",
        description: "Please connect your wallet first",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Store in Supabase
      const { error } = await supabase
        .from('property_requests')
        .insert([
          {
            owner_address: address,
            title: data.title,
            description: data.description,
            location: data.location,
            image_url: data.imageUrl,
            expected_price: parseFloat(data.expectedPrice),
            documents_url: data.documents,
            status: 'pending'
          }
        ])

      if (error) throw error

      toast({
        title: "Success! 🎉",
        description: "Your property request has been submitted successfully",
        variant: "default",
        duration: 5000,
      })

      // Reset form
      form.reset()
    } catch (error: any) {
      console.error('Error submitting property request:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to submit property request",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Submit Property Request</h1>
        <p>Please connect your wallet to submit a property request.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Submit Property Request</h1>
      <div className="bg-card p-6 rounded-lg shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter property title" {...field} />
                  </FormControl>
                  <FormDescription>
                    A clear and concise title for your property
                  </FormDescription>
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
                    <Textarea
                      placeholder="Describe your property"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Detailed description of the property including features and condition
                  </FormDescription>
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
                    <Input placeholder="Property location" {...field} />
                  </FormControl>
                  <FormDescription>
                    Full address or general location of the property
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormDescription>
                    URL to the main image of your property
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expectedPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Price (ETH)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Expected price in ETH
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
                  <FormLabel>Documents URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/documents.pdf"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    URL to any supporting documents (deeds, certificates, etc.)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Property Request'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
