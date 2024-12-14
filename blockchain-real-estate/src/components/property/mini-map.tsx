'use client';

import { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface MiniMapProps {
  location: string;
  className?: string;
}

export function MiniMap({ location, className = "" }: MiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
        libraries: ['places'],
      });

      try {
        const google = await loader.load();
        const geocoder = new google.maps.Geocoder();

        geocoder.geocode({ address: location }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            const map = new google.maps.Map(mapRef.current!, {
              center: results[0].geometry.location,
              zoom: 15,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
            });

            new google.maps.Marker({
              map,
              position: results[0].geometry.location,
            });
          }
        });
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    if (mapRef.current) {
      initMap();
    }
  }, [location]);

  return (
    <div 
      ref={mapRef} 
      className={`w-full h-[200px] rounded-lg overflow-hidden ${className}`}
    />
  );
}
