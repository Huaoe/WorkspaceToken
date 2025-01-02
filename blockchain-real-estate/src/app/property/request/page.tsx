'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { LocationPicker } from '@/components/LocationPicker'
import { Loader2 } from "lucide-react"
import { useWalletEvents } from '@/app/wallet-events-provider'

const defaultCenter = {
  lat: 48.8566, // Paris
  lng: 2.3522
};

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required").max(255),
  imageUrl: z.string().min(1, "Image URL is required").url("Must be a valid URL"),
  expectedPrice: z.string().min(1, "Price is required"),
  documents: z.string()
    .url('Please enter a valid URL for documents')
    .max(500, 'URL must not exceed 500 characters')
    .optional(),
  numberOfTokens: z.coerce.number().int().min(1, "Must have at least 1 token").max(100000, "Cannot exceed 100000 tokens"),
  payoutDuration: z.coerce.number().int().min(1, "Payout duration must be at least 1 month").max(12, "Payout duration cannot exceed 12 months"),
  finishAt: z.string().min(1, "End date is required"),
  roi: z.coerce.number().min(0, "ROI must be positive").max(100, "ROI cannot exceed 100%")
})

type FormValues = z.infer<typeof formSchema>

export default function PropertyRequest() {
  const { address, isConnected } = useWalletEvents()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')

  // Handle image URL change
  const handleImageUrlChange = (url: string) => {
    try {
      if (url) {
        // Test if it's a valid URL
        new URL(url);
        if (!url.startsWith('http')) {
          throw new Error('URL must start with http:// or https://');
        }
        setImagePreview(url);
        form.setValue('imageUrl', url);
      } else {
        setImagePreview('');
      }
    } catch (error) {
      setImagePreview('');
      form.setError('imageUrl', {
        type: 'manual',
        message: 'Please enter a valid http:// or https:// URL'
      });
    }
  };

  // Handle location selection
  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    form.setValue('latitude', location.lat);
    form.setValue('longitude', location.lng);
    form.setValue('location', location.address);
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      imageUrl: '',
      expectedPrice: '',
      documents: '',
      numberOfTokens: 100,
      payoutDuration: 3,
      finishAt: '',
      roi: 8.5,
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
      // Convert price from EURC to smallest unit (6 decimals)
      const priceInSmallestUnit = parseFloat(data.expectedPrice) * Math.pow(10, 6);

      const { error } = await supabase
        .from('property_requests')
        .insert([
          {
            title: data.title,
            description: data.description,
            location: data.location,
            image_url: data.imageUrl,
            expected_price: data.expectedPrice,
            documents_url: data.documents || null,
            owner_address: address,
            number_of_tokens: data.numberOfTokens,
            payout_duration: data.payoutDuration,
            finish_at: data.finishAt,
            roi: data.roi,
            status: 'pending'
          }
        ])

      if (error) throw error

      toast({
        title: "Property Request Submitted! ",
        description: (
          <div className="mt-2 space-y-2">
            <p>Your property <span className="font-semibold">{data.title}</span> has been submitted for review.</p>
            <p className="text-sm text-muted-foreground">Our team will review your request and contact you soon.</p>
          </div>
        ),
        duration: 5000,
      })

      // Reset form
      form.reset()
      setImagePreview('')
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

  if (!isConnected) {
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
                    Enter a descriptive title for your property
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
                      placeholder="Describe your property..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed description of your property
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
                    <LocationPicker
                      defaultCenter={defaultCenter}
                      onLocationSelect={handleLocationSelect}
                    />
                  </FormControl>
                  <FormDescription>
                    Select the property location on the map
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
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter image URL"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleImageUrlChange(e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a URL to an image of your property
                  </FormDescription>
                  <FormMessage />
                  {imagePreview && (
                    <div className="mt-2 relative aspect-video rounded-lg overflow-hidden">
                      <Image
                        src={imagePreview}
                        alt="Property preview"
                        fill
                        className="object-cover"
                        onError={() => setImagePreview('')}
                      />
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expectedPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Price (EURC)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter expected price in EURC"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the expected price in EURC
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
                      placeholder="Enter documents URL"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a URL to any relevant documents (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numberOfTokens"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Tokens</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the total number of tokens to be created (1-100,000)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payoutDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payout Duration (months)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the payout duration in months (1-12)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="finishAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Select the end date for the property listing
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roi"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected APR (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the expected APR (0-100%)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Property Request"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
