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
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { LocationPicker } from '@/components/LocationPicker'
import { Loader2 } from "lucide-react"

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
  const { address, isConnecting, isDisconnected } = useAccount()
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

  if (isConnecting) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Submit Property Request</h1>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p>Connecting wallet...</p>
        </div>
      </div>
    )
  }

  if (isDisconnected || !address) {
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
                  <LocationPicker
                    defaultCenter={defaultCenter}
                    onLocationSelect={handleLocationSelect}
                    currentValue={field.value}
                  />
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
                    <Input
                      placeholder="Enter image URL (must start with https://)"
                      {...field}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                    />
                  </FormControl>
                  {imagePreview && (
                    <div className="mt-2 relative w-full h-48">
                      {/* Only render Image component if we have a valid URL */}
                      {imagePreview.startsWith('http') && (
                        <Image
                          src={imagePreview}
                          alt="Property preview"
                          fill
                          className="object-cover rounded-md"
                          onError={() => {
                            setImagePreview('');
                            form.setError('imageUrl', {
                              type: 'manual',
                              message: 'Failed to load image. Please check the URL.'
                            });
                          }}
                        />
                      )}
                    </div>
                  )}
                  <FormDescription>
                    Please provide a valid https:// URL for the property image
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
                  <FormLabel>Expected Price (in EUR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter expected price"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The expected price in EUR
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
                      placeholder="10000"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    How many tokens do you want to create for this property? Each token represents partial ownership.
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
                  <FormLabel>Payout Frequency</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      placeholder="3"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    How often should yields be paid out? (in months)
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
                  <FormLabel>Contract End Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    When will the investment contract end?
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
                  <FormLabel>Annual Return on Investment (ROI)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="8.5"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Expected annual return on investment (%)
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
                  <FormLabel>Supporting Documents URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter documents URL"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    URL to any supporting documents (e.g., property deed, certificates)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                'Submit Property Request'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}
