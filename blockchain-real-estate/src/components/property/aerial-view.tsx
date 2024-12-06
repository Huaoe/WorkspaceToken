import React, { useEffect, useRef } from 'react';
import { Loader } from "@googlemaps/js-api-loader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AerialViewProps {
  location: string | null;
  className?: string;
}

const AerialView: React.FC<AerialViewProps> = ({ location, className }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      version: "weekly",
      libraries: ["places"]
    });

    const initializeAerialView = async () => {
      try {
        await loader.load();
        
        if (!mapRef.current) return;

        if (!location) {
          // Default to a nice location if none selected
          const defaultLocation = { lat: 48.8584, lng: 2.2945 }; // Paris
          const map = new google.maps.Map(mapRef.current, {
            center: defaultLocation,
            zoom: 18,
            mapId: "aerial_view",
            mapTypeId: "satellite",
            tilt: 45
          });
          mapInstance.current = map;
          return;
        }

        // Use Geocoding service
        const geocoder = new google.maps.Geocoder();
        
        geocoder.geocode({ address: location }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const coordinates = results[0].geometry.location;
            
            // Initialize or update the map
            if (!mapInstance.current) {
              mapInstance.current = new google.maps.Map(mapRef.current!, {
                center: coordinates,
                zoom: 18,
                mapId: "aerial_view",
                mapTypeId: "satellite",
                tilt: 45
              });
            } else {
              mapInstance.current.setCenter(coordinates);
            }

            // Add a marker
            new google.maps.Marker({
              position: coordinates,
              map: mapInstance.current,
              title: location
            });
          } else {
            console.error('Geocoding failed:', status);
          }
        });
      } catch (error) {
        console.error("Error initializing aerial view:", error);
      }
    };

    initializeAerialView();

    return () => {
      // Cleanup if needed
    };
  }, [location]);

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader>
        <CardTitle>Property Location</CardTitle>
        <CardDescription>
          {location || 'Select a property to view its location'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-5rem)]">
        <div ref={mapRef} className="w-full h-full" />
      </CardContent>
    </Card>
  );
};

export default AerialView;
