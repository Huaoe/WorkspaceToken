'use client';

import { useRef, useState, useEffect } from "react";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { LocationPicker, geocodeAddress } from "@/components/LocationPicker";
import { Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { propertyFormSchema } from "./PropertyDetailsFields";

type FormValues = z.infer<typeof propertyFormSchema> & {
  location: string;
  token_address?: string;
  roi: number;
  payout_duration: number;
};

interface LocationFieldProps {
  form: UseFormReturn<FormValues>;
  defaultLocation?: { lat: number; lng: number } | null;
}

export function LocationField({ form, defaultLocation }: LocationFieldProps) {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const locationPickerRef = useRef<{ updateMapLocation: (lat: number, lng: number) => void }>(null);

  // Initialize map with current location when component mounts
  useEffect(() => {
    const initializeLocation = async () => {
      const currentLocation = form.getValues('location');
      if (currentLocation) {
        setIsSearching(true);
        try {
          const result = await geocodeAddress(currentLocation);
          if (result) {
            locationPickerRef.current?.updateMapLocation(result.lat, result.lng);
          }
        } catch (error) {
          console.error('Error initializing location:', error);
        }
        setIsSearching(false);
      }
    };

    initializeLocation();
  }, [form]);

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
        locationPickerRef.current?.updateMapLocation(result.lat, result.lng);
      }
    } catch (error) {
      console.error('Error searching address:', error);
      toast({
        title: "Error",
        description: "Failed to find location",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Location</FormLabel>
            <div className="flex space-x-2">
              <FormControl>
                <Input 
                  placeholder="Enter property address" 
                  {...field} 
                  className="flex-1"
                />
              </FormControl>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddressSearch}
                disabled={isSearching}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <FormDescription>Enter the property address</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="h-[500px] w-full rounded-lg border bg-muted overflow-hidden">
        <LocationPicker ref={locationPickerRef} />
      </div>
    </div>
  );
}
