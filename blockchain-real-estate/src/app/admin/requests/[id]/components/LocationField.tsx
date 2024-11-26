'use client';

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { LocationPicker, geocodeAddress } from "@/components/LocationPicker";
import { Search } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRef, useState } from "react";

interface LocationFieldProps {
  form: UseFormReturn<any>;
}

export function LocationField({ form }: LocationFieldProps) {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const locationPickerRef = useRef<{ updateMapLocation: (lat: number, lng: number) => void }>(null);

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
        // Format location string to meet contract requirements
        const formattedLocation = `${result.display_name.split(',')[0]}, ${result.display_name.split(',').slice(-2).join(',').trim()}`;
        form.setValue('location', formattedLocation);
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

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="location"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Location</FormLabel>
            <div className="flex gap-2">
              <FormControl>
                <Input placeholder="Enter address..." {...field} maxLength={256} />
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
            <FormDescription>Property location (max 256 characters)</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <LocationPicker 
        ref={locationPickerRef} 
        onLocationSelect={({ lat, lng, address }) => {
          form.setValue('location', address);
        }}
      />
    </div>
  );
}
