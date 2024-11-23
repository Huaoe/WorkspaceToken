'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { useRouter } from "next/navigation";
import { LocationPicker, geocodeAddress } from "@/components/LocationPicker";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { PropertyRequest } from "@/types/property";
import { Search } from "lucide-react";
import Image from 'next/image';

const formSchema = z.object({
  property_type: z.string().min(2, {
    message: "Property type must be at least 2 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be a valid number greater than 0",
  }),
  area: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Area must be a valid number greater than 0",
  }),
  image_url: z.string().url("Please enter a valid image URL").optional(),
  documents_url: z.string().url("Please enter a valid document URL").optional(),
});

export default function SubmitProperty() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const router = useRouter();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const locationPickerRef = useRef<{ updateMapLocation: (lat: number, lng: number) => void }>(null);

  const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as `0x${string}`;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      property_type: "",
      description: "",
      location: "",
      price: "",
      area: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      if (!coordinates) {
        toast({
          title: "Error",
          description: "Please select a location on the map",
          variant: "destructive",
        });
        return;
      }

      const propertyRequest: Omit<PropertyRequest, 'id'> = {
        property_type: values.property_type,
        description: values.description,
        location: values.location,
        price: Number(values.price),
        area: Number(values.area),
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        owner_address: address,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        image_url: values.image_url,
        documents_url: values.documents_url ? [values.documents_url] : undefined,
      };

      // First, create the property request in Supabase
      const { data: insertedRequest, error: supabaseError } = await supabase
        .from('property_requests')
        .insert([propertyRequest])
        .select()
        .single();

      if (supabaseError) throw supabaseError;

      toast({
        title: "Success",
        description: "Property request submitted successfully. Waiting for admin approval.",
      });

      router.push('/property/list');
    } catch (error) {
      console.error('Error submitting property:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit property",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationSelect = ({ lat, lng, address }: { lat: number; lng: number; address: string }) => {
    setCoordinates({ lat, lng });
    form.setValue('location', address);
  };

  const handleAddressSearch = async () => {
    const address = form.getValues('location');
    if (!address) {
      toast({
        title: "Error",
        description: "Please enter an address to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const result = await geocodeAddress(address);
      if (result) {
        setCoordinates({ lat: result.lat, lng: result.lng });
        form.setValue('location', result.display_name);
        locationPickerRef.current?.updateMapLocation(result.lat, result.lng);
      } else {
        toast({
          title: "Error",
          description: "Could not find location. Please try a different address.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search location",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to submit a property
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Submit Property</CardTitle>
          <CardDescription>
            Fill in the details of your property to submit it for review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="property_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Apartment, House, Villa" {...field} />
                    </FormControl>
                    <FormDescription>
                      The type of property you are listing
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
                      <Input placeholder="Describe your property" {...field} />
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
                    <div className="flex gap-2">
                      <FormControl>
                        <Input 
                          placeholder="Enter property address" 
                          {...field}
                        />
                      </FormControl>
                      <Button 
                        type="button" 
                        variant="secondary"
                        onClick={handleAddressSearch}
                        disabled={isSearching}
                      >
                        {isSearching ? (
                          "Searching..."
                        ) : (
                          <>
                            <Search className="h-4 w-4 mr-2" />
                            Search
                          </>
                        )}
                      </Button>
                    </div>
                    <FormDescription>
                      Enter an address and click search, or select a location on the map
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Map Location</FormLabel>
                <LocationPicker
                  ref={locationPickerRef}
                  onLocationSelect={handleLocationSelect}
                  defaultCenter={coordinates || undefined}
                />
                <FormDescription>
                  Click on the map to set the exact location of your property
                </FormDescription>
              </div>

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (EURC)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormDescription>
                      The price in EURC tokens
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormLabel>Property Image URL</FormLabel>
                    <FormControl>
                      <Input 
                        type="url" 
                        placeholder="https://example.com/property-image.jpg"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setPreviewError(false);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the URL of your property's main image
                    </FormDescription>
                    <FormMessage />
                    {field.value && (
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={field.value}
                          alt="Property preview"
                          fill
                          className="object-cover"
                          onError={() => {
                            setPreviewError(true);
                            toast({
                              title: "Error",
                              description: "Failed to load image preview. Please check the URL.",
                              variant: "destructive",
                            });
                          }}
                          onLoad={() => setPreviewError(false)}
                        />
                        {previewError && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
                            <p>Failed to load image preview</p>
                          </div>
                        )}
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documents_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Documents URL</FormLabel>
                    <FormControl>
                      <Input 
                        type="url" 
                        placeholder="https://example.com/property-documents.pdf"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the URL of your property documents
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Property"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
