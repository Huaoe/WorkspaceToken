'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { LocationPicker, geocodeAddress } from "@/components/LocationPicker";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { PropertyRequest } from "@/types/property";
import { Search } from "lucide-react";
import Image from 'next/image';
import { AdminCheck } from "@/app/admin/components/AdminCheck";
import { useWalletEvents } from "@/app/wallet-events-provider";
import { getPropertyFactoryContract } from "@/lib/ethereum";
import { ethers } from "ethers";

const formSchema = z.object({
  title: z.string().min(3).max(50, {
    message: "Title must be between 3 and 50 characters.",
  }),
  description: z.string().min(10).max(500, {
    message: "Description must be between 10 and 500 characters.",
  }),
  location: z.string().min(2, {
    message: "Location must be at least 2 characters.",
  }),
  expected_price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be a valid number greater than 0",
  }),
  image_url: z.string().url("Please enter a valid image URL").optional(),
  documents_url: z.string().url("Please enter a valid document URL").optional(),
  number_of_tokens: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Number of tokens must be a valid number greater than 0",
  }),
});

export default function SubmitProperty() {
  const { address, isConnected, signer } = useWalletEvents();
  const { toast } = useToast();
  const router = useRouter();
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const locationPickerRef = useRef<{ updateMapLocation: (lat: number, lng: number) => void }>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      expected_price: "",
      image_url: "",
      documents_url: "",
      number_of_tokens: "",
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

      if (!signer) {
        toast({
          title: "Error",
          description: "Please connect your wallet",
          variant: "destructive",
        });
        return;
      }

      const propertyRequest: Omit<PropertyRequest, 'id'> = {
        title: values.title,
        description: values.description,
        location: values.location,
        expected_price: Number(values.expected_price),
        owner_address: address,
        status: 'pending',
        created_at: new Date().toISOString(),
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        number_of_tokens: Number(values.number_of_tokens),
        image_url: values.image_url,
        documents_url: values.documents_url,
      };

      // First, create the property request in Supabase
      const { data: insertedRequest, error: supabaseError } = await supabase
        .from('property_requests')
        .insert([propertyRequest])
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      // Get the contract with signer
      const contract = getPropertyFactoryContract().connect(signer);

      // Convert price to wei (assuming 18 decimals)
      const priceInWei = ethers.parseUnits(values.expected_price, 18);
      const numberOfTokens = ethers.parseUnits(values.number_of_tokens, 0);

      // Create property token
      const tx = await contract.createPropertyToken(
        values.title,
        values.description,
        priceInWei,
        numberOfTokens,
        {
          gasLimit: 5000000, // Adjust as needed
        }
      );

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // Get the property token address from the event
      const propertyTokenAddress = receipt.logs[0].address;

      // Update the request with the token address
      const { error: updateError } = await supabase
        .from('property_requests')
        .update({ token_address: propertyTokenAddress })
        .eq('id', insertedRequest.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Success!",
        description: "Property request submitted successfully",
      });

      router.push('/property/list');
    } catch (error: any) {
      console.error('Error submitting property:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit property",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = async () => {
    const location = form.getValues('location');
    if (!location) return;

    setIsSearching(true);
    try {
      const result = await geocodeAddress(location);
      if (result) {
        setCoordinates(result);
        locationPickerRef.current?.updateMapLocation(result.lat, result.lng);
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      toast({
        title: "Error",
        description: "Failed to find location",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Submit Property</CardTitle>
            <CardDescription>Please connect your wallet to submit a property.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <AdminCheck>
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Submit Property</CardTitle>
            <CardDescription>Fill in the details to submit a new property.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Property title" {...field} />
                      </FormControl>
                      <FormDescription>
                        A descriptive title for the property
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
                        <Input placeholder="Property description" {...field} />
                      </FormControl>
                      <FormDescription>
                        Detailed description of the property
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Location</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input placeholder="Property location" {...field} />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleSearch}
                            disabled={isSearching}
                          >
                            {isSearching ? (
                              <div className="animate-spin">⌛</div>
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <FormDescription>
                          Enter the property location and click search
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="h-[400px] w-full">
                  <LocationPicker
                    ref={locationPickerRef}
                    onLocationSelect={(location) => {
                      setCoordinates({ lat: location.lat, lng: location.lng });
                      form.setValue('location', location.address);
                    }}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="expected_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Price (ETH)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormDescription>
                        The expected price in ETH
                      </FormDescription>
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
                        <Input type="number" placeholder="100" {...field} />
                      </FormControl>
                      <FormDescription>
                        Total number of tokens to create
                      </FormDescription>
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
                        <Input 
                          placeholder="https://" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(e);
                            setPreviewError(false);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        URL to the property image
                      </FormDescription>
                      <FormMessage />
                      {field.value && !previewError && (
                        <div className="mt-2 relative h-48 w-full">
                          <Image
                            src={field.value}
                            alt="Property preview"
                            fill
                            className="object-cover rounded-lg"
                            onError={() => setPreviewError(true)}
                          />
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
                      <FormLabel>Documents URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL to property documents (optional)
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
    </AdminCheck>
  );
}
