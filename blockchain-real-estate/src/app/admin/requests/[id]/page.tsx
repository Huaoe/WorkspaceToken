'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { PropertyRequest } from '@/types/property';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { STATUS_COLORS } from '@/lib/constants';
import { useAccount, useWriteContract, useWatchContractEvent, useSimulateContract } from 'wagmi';
import { Separator } from '@/components/ui/separator';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { icon } from 'leaflet';
import Image from 'next/image';
import { propertyFactoryABI } from '@/contracts/abis/propertyFactoryABI';
import { parseEther } from 'viem';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { LocationPicker, geocodeAddress } from "@/components/LocationPicker";
import { Search } from "lucide-react";

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
  status: z.enum(['pending', 'approved', 'rejected', 'onchain']),
});

const MARKER_ICON = icon({
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function ReviewRequest() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const { address } = useAccount();
  const contractAddress = process.env.NEXT_PUBLIC_PROPERTY_FACTORY_ADDRESS as `0x${string}`;
  const locationPickerRef = useRef<{ updateMapLocation: (lat: number, lng: number) => void }>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const { data, error } = await supabase
          .from('property_requests')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        // Set form values
        form.reset({
          property_type: data.property_type,
          description: data.description,
          location: data.location,
          price: data.price.toString(),
          area: data.area.toString(),
          image_url: data.image_url || '',
          documents_url: Array.isArray(data.documents_url) ? data.documents_url[0] : data.documents_url || '',
          status: data.status,
        });

        // Update map location
        if (data.latitude && data.longitude) {
          locationPickerRef.current?.updateMapLocation(data.latitude, data.longitude);
        }
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('property_requests')
        .update({
          property_type: values.property_type,
          description: values.description,
          location: values.location,
          price: Number(values.price),
          area: Number(values.area),
          image_url: values.image_url,
          documents_url: values.documents_url ? [values.documents_url] : undefined,
          status: values.status,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Property request updated successfully',
      });
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
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full bg-${STATUS_COLORS[field.value]}-500`} />
                              <span className="capitalize">{field.value}</span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(STATUS_COLORS).map(([status, color]) => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full bg-${color}-500`} />
                              <span className="capitalize">{status}</span>
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="onchain">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="capitalize">On Chain</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Current status of the property request</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Property Type */}
              <FormField
                control={form.control}
                name="property_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Apartment, House, Villa" {...field} />
                    </FormControl>
                    <FormDescription>The type of property being listed</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the property"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Detailed description of the property</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
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

              {/* Map */}
              <div className="space-y-2">
                <FormLabel>Map Location</FormLabel>
                <LocationPicker
                  ref={locationPickerRef}
                  onLocationSelect={({ lat, lng, address }) => {
                    form.setValue('location', address);
                  }}
                />
                <FormDescription>
                  Click on the map to set the exact location of the property
                </FormDescription>
              </div>

              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (EURC)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormDescription>The price in EURC tokens</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Area */}
              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area (m²)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormDescription>The area in square meters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image URL */}
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
                    <FormDescription>URL of the property's main image</FormDescription>
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

              {/* Documents URL */}
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
                    <FormDescription>URL of the property documents</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => router.push('/admin/requests')}>
                  Back
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
