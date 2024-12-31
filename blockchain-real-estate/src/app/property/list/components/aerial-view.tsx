"use client";

import { useEffect, useState, useRef } from 'react';
import { Loader } from "@googlemaps/js-api-loader";
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface AerialViewProps {
  location: string;
  className?: string;
}

export function AerialView({ location, className }: AerialViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [aerialViewUrl, setAerialViewUrl] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    const initializeView = async () => {
      console.log('[AerialView] Initializing aerial view...');
      try {
        // Load Google Maps API
        console.log('[AerialView] Loading Google Maps API...');
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['places', 'geocoding']
        });

        await loader.load();
        console.log('[AerialView] Google Maps API loaded successfully');

        // Geocode the location
        console.log('[AerialView] Starting geocoding for location:', location);
        const geocoder = new google.maps.Geocoder();
        const geocodeResult = await geocoder.geocode({ address: location });

        console.log('[AerialView] Geocoding status:', geocodeResult.status);
        console.log('[AerialView] Geocoding results:', geocodeResult.results);

        if (geocodeResult.results.length > 0) {
          const { lat, lng } = geocodeResult.results[0].geometry.location.toJSON();
          console.log('[AerialView] Coordinates obtained:', { lat, lng });
          setCoordinates({ lat, lng });

          // Initialize Google Map as fallback
          if (mapRef.current && !googleMapRef.current) {
            googleMapRef.current = new google.maps.Map(mapRef.current, {
              center: { lat, lng },
              zoom: 18,
              mapTypeId: 'satellite',
              tilt: 45,
            });
          }

          // Try to fetch aerial view
          try {
            console.log('[AerialView] Making API request to:', `/api/aerial-view/${lat}/${lng}`);
            console.log('[AerialView] Request details:', {
              method: 'GET',
              url: `/api/aerial-view/${lat}/${lng}`,
              coordinates: { lat, lng },
              timestamp: new Date().toISOString(),
            });

            const response = await fetch(`/api/aerial-view/${lat}/${lng}`);
            if (!response.ok) throw new Error('Failed to fetch aerial view');
            
            const data = await response.json();
            setAerialViewUrl(data.url);
          } catch (error) {
            console.error('[AerialView] Error fetching aerial view:', error);
            setError('Aerial view unavailable. Showing satellite view instead.');
          }
        } else {
          throw new Error('Location not found');
        }
      } catch (error) {
        console.error('[AerialView] Error:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (location) {
      initializeView();
    }

    return () => {
      if (googleMapRef.current) {
        // Clean up map instance if needed
      }
    };
  }, [location]);

  if (loading) {
    return (
      <Card className={className}>
        <Skeleton className="w-full h-[400px] rounded-lg" />
      </Card>
    );
  }

  if (error || !aerialViewUrl) {
    return (
      <Card className={className}>
        <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
          {error && (
            <div className="absolute top-4 left-4 right-4 z-10 bg-black/75 text-white px-4 py-2 rounded">
              {error}
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
        <img
          src={aerialViewUrl}
          alt={`Aerial view of ${location}`}
          className="w-full h-full object-cover"
        />
      </div>
    </Card>
  );
}
