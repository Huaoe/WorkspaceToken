'use client'

import { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react'
import dynamic from 'next/dynamic'
import type { LatLngExpression } from 'leaflet'

// Default center if none provided
const defaultLocation = {
  lat: 48.8566, // Paris
  lng: 2.3522
};

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
  defaultCenter?: { lat: number; lng: number };
  currentValue?: string;
}

// Dynamically import the map components with ssr disabled
const MapWithNoSSR = dynamic(
  () => import('./Map'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full rounded-lg border bg-muted flex items-center justify-center">
        Loading map...
      </div>
    )
  }
)

export const LocationPicker = forwardRef<
  { updateMapLocation: (lat: number, lng: number) => void },
  LocationPickerProps
>(({ onLocationSelect, defaultCenter, currentValue }, ref) => {
  const [marker, setMarker] = useState(defaultCenter || defaultLocation);
  const [center, setCenter] = useState(defaultCenter || defaultLocation);

  // Validate coordinates
  const validatedCenter = {
    lat: isNaN(center.lat) ? defaultLocation.lat : center.lat,
    lng: isNaN(center.lng) ? defaultLocation.lng : center.lng
  };

  const validatedMarker = {
    lat: isNaN(marker.lat) ? defaultLocation.lat : marker.lat,
    lng: isNaN(marker.lng) ? defaultLocation.lng : marker.lng
  };

  // Update marker and center when defaultCenter changes
  useEffect(() => {
    if (defaultCenter && defaultCenter.lat && defaultCenter.lng) {
      setMarker(defaultCenter);
      setCenter(defaultCenter);
    }
  }, [defaultCenter]);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setMarker({ lat, lng });
    setCenter({ lat, lng });

    // Get address from coordinates using Nominatim (OpenStreetMap's geocoding service)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      
      onLocationSelect({
        lat,
        lng,
        address: data.display_name || `${lat}, ${lng}`
      });
    } catch (error) {
      console.error('Error getting address:', error);
      onLocationSelect({
        lat,
        lng,
        address: `${lat}, ${lng}`
      });
    }
  }, [onLocationSelect]);

  // Function to update map location
  const updateMapLocation = useCallback((lat: number, lng: number) => {
    setMarker({ lat, lng });
    setCenter({ lat, lng });
  }, []);

  // Expose updateMapLocation function
  useImperativeHandle(ref, () => ({
    updateMapLocation
  }));

  return (
    <MapWithNoSSR
      center={validatedCenter}
      marker={validatedMarker}
      onMapClick={handleMapClick}
    />
  );
});

LocationPicker.displayName = 'LocationPicker';

// Utility function to geocode address
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number; display_name: string } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    const data = await response.json();
    
    if (data && data[0]) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        display_name: data[0].display_name
      };
    }
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}
