'use client';

import { useEffect, useState, useRef } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { Loader } from "@googlemaps/js-api-loader";

interface Place {
  name: string;
  vicinity: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  rating?: number;
}

interface MiniMapProps {
  location: string;
  height?: string;
}

const defaultMapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    }
  ]
};

export function MiniMap({ location, height = '400px' }: MiniMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlaceIndex, setSelectedPlaceIndex] = useState<number | null>(null);

  const handlePlaceClick = (place: Place, index: number) => {
    if (!mapRef.current || !markersRef.current[index + 1]) return; // +1 because first marker is property

    // Update selected place
    setSelectedPlaceIndex(index);

    // Center map on the selected place
    mapRef.current.panTo(place.geometry.location);
    mapRef.current.setZoom(16);

    // Show info window
    if (infoWindowRef.current) {
      const content = `
        <div class="p-2">
          <h3 class="font-semibold">${place.name}</h3>
          <p class="text-sm text-gray-600">${place.vicinity}</p>
          ${place.rating ? `<p class="text-sm">Rating: ${place.rating} ⭐</p>` : ''}
        </div>
      `;
      infoWindowRef.current.setContent(content);
      infoWindowRef.current.open(mapRef.current, markersRef.current[index + 1]);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (!location || !mapContainerRef.current) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Load Google Maps
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
          version: "weekly",
          libraries: ["places", "marker"]
        });

        await loader.load();

        // Get location data
        const response = await fetch(`/api/places?location=${encodeURIComponent(location)}`);
        const data = await response.json();

        if (!isMounted) return;

        if (data.error) {
          throw new Error(data.error);
        }

        if (!data.center || !data.places) {
          throw new Error('Invalid response from API');
        }

        // Update places state
        setPlaces(data.places);

        // Clear previous markers
        if (markersRef.current) {
          markersRef.current.forEach(marker => {
            if (marker) marker.map = null;
          });
          markersRef.current = [];
        }

        // Clear previous map
        if (mapRef.current) {
          mapRef.current = null;
        }

        // Create new map
        const map = new google.maps.Map(mapContainerRef.current, {
          center: data.center,
          zoom: 15,
          mapId: "8f12f671f0524eae",
          ...defaultMapOptions
        });

        mapRef.current = map;

        // Create info window
        infoWindowRef.current = new google.maps.InfoWindow();

        // Add property marker
        const propertyPin = document.createElement('div');
        propertyPin.className = 'w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-lg';

        const propertyMarker = new google.maps.marker.AdvancedMarkerElement({
          position: data.center,
          map,
          content: propertyPin,
          title: location
        });
        markersRef.current.push(propertyMarker);

        // Add place markers
        for (const place of data.places) {
          const placePin = document.createElement('div');
          placePin.className = 'w-4 h-4 rounded-full bg-red-500 bg-opacity-80 border border-white shadow';

          const marker = new google.maps.marker.AdvancedMarkerElement({
            position: place.geometry.location,
            map,
            content: placePin,
            title: place.name
          });

          markersRef.current.push(marker);
        }

        if (!isMounted) return;
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize map');
          setIsLoading(false);
        }
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (markersRef.current) {
        markersRef.current.forEach(marker => {
          if (marker) marker.map = null;
        });
        markersRef.current = [];
      }
      if (mapRef.current) {
        mapRef.current = null;
      }
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [location]);

  return (
    <div className="space-y-4">
      {/* Map */}
      <div className="relative w-full" style={{ height }}>
        <div
          ref={mapContainerRef}
          className="absolute inset-0 rounded-lg"
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 rounded-lg">
            <p className="text-red-500">{error}</p>
          </div>
        )}
      </div>

      {/* Places List */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Nearby Places</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {places.map((place, index) => (
            <div
              key={index}
              onClick={() => handlePlaceClick(place, index)}
              className={`flex items-start space-x-2 p-2 rounded-md cursor-pointer transition-colors ${
                selectedPlaceIndex === index
                  ? 'bg-blue-50 ring-1 ring-blue-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <MapPin className={`h-5 w-5 mt-1 flex-shrink-0 ${
                selectedPlaceIndex === index ? 'text-blue-500' : 'text-red-500'
              }`} />
              <div>
                <h4 className="font-medium">{place.name}</h4>
                <p className="text-sm text-gray-600">{place.vicinity}</p>
                {place.rating && (
                  <p className="text-sm text-gray-600">Rating: {place.rating} ⭐</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
