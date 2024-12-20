import React, { useEffect, useRef, useState } from 'react';
import { Loader } from "@googlemaps/js-api-loader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AerialViewProps {
  location: string | null;
  className?: string;
}

const AerialView: React.FC<AerialViewProps> = ({ location, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    console.log('[AerialView] Component mounted/updated with location:', location);
    
    if (!location) {
      console.log('[AerialView] No location provided, showing default state');
      setError("No location provided");
      setLoading(false);
      return;
    }

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      version: "weekly",
      libraries: ["places", "marker"]
    });

    const initializeAerialView = async () => {
      console.log('[AerialView] Initializing aerial view...');
      try {
        console.log('[AerialView] Loading Google Maps API...');
        await loader.load();
        console.log('[AerialView] Google Maps API loaded successfully');
        
        console.log('[AerialView] Starting geocoding for location:', location);
        const geocoder = new google.maps.Geocoder();
        
        geocoder.geocode({ address: location }, async (results, status) => {
          console.log('[AerialView] Geocoding status:', status);
          console.log('[AerialView] Geocoding results:', results);

          if (status === 'OK' && results && results[0]) {
            const coords = {
              lat: results[0].geometry.location.lat(),
              lng: results[0].geometry.location.lng()
            };
            setCoordinates(coords);
            console.log('[AerialView] Coordinates obtained:', coords);

            // Initialize map with the coordinates
            if (mapRef.current && !mapInstance.current) {
              const map = new google.maps.Map(mapRef.current, {
                center: coords,
                zoom: 18,
                mapTypeId: 'satellite',
                disableDefaultUI: true,
              });
              mapInstance.current = map;
            }
            
            try {
              const url = `/api/aerial-view/${coords.lat}/${coords.lng}`;
              console.log('[AerialView] Making API request to:', url);
              
              // Log request details
              const requestStartTime = Date.now();
              console.log('[AerialView] Request details:', {
                method: 'GET',
                url,
                coordinates: coords,
                timestamp: new Date().toISOString()
              });
              
              const response = await fetch(url);
              const requestDuration = Date.now() - requestStartTime;
              
              console.log('[AerialView] Response received:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                duration: `${requestDuration}ms`,
                url: response.url
              });
              
              if (!response.ok) {
                const errorBody = await response.text();
                console.error('[AerialView] Error response:', {
                  status: response.status,
                  statusText: response.statusText,
                  body: errorBody,
                  url: response.url
                });
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
              }
              
              const data = await response.json();
              console.log('[AerialView] Parsed response data:', data);
              
              if (data.success) {
                setVideoUrl(data.videoUrl);
                setShowMap(false);
              } else {
                console.log('[AerialView] No video URL, showing map');
                setShowMap(true);
              }
            } catch (error) {
              console.error('[AerialView] API error:', error);
              setError(error instanceof Error ? error.message : 'Failed to load aerial view');
              setShowMap(true);
            }
            
            setLoading(false);
          } else {
            console.error('[AerialView] Geocoding failed:', { status, results });
            setError('Failed to get location coordinates');
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('[AerialView] Error in initialization:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize aerial view');
        setLoading(false);
      }
    };

    initializeAerialView();
  }, [location]);

  // Effect for handling video element
  useEffect(() => {
    if (!videoUrl || !videoRef.current) {
      return;
    }

    console.log('[AerialView] Setting up video element with URL');
    const videoElement = videoRef.current;

    const onLoadStart = () => {
      console.log('[AerialView] Video loading started');
      setLoading(true);
    };
    
    const onLoadedData = () => {
      console.log('[AerialView] Video data loaded');
      setLoading(false);
    };
    
    const onCanPlay = () => {
      console.log('[AerialView] Video can start playing');
      setLoading(false);
    };
    
    const onError = () => {
      const error = videoElement.error;
      const errorMessage = error ? `Error ${error.code}: ${error.message}` : 'Unknown error';
      console.error('[AerialView] Video error:', { code: error?.code, message: error?.message });
      setError(`Failed to load video: ${errorMessage}`);
      setShowMap(true);
      setLoading(false);
    };

    videoElement.addEventListener('loadstart', onLoadStart);
    videoElement.addEventListener('loadeddata', onLoadedData);
    videoElement.addEventListener('canplay', onCanPlay);
    videoElement.addEventListener('error', onError);

    videoElement.src = videoUrl;
    videoElement.load();

    return () => {
      videoElement.removeEventListener('loadstart', onLoadStart);
      videoElement.removeEventListener('loadeddata', onLoadedData);
      videoElement.removeEventListener('canplay', onCanPlay);
      videoElement.removeEventListener('error', onError);
      videoElement.src = '';
      
      if (videoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  // Effect for handling map
  useEffect(() => {
    if (!showMap || !mapRef.current || !coordinates) {
      return;
    }

    console.log('[AerialView] Initializing fallback map');
    
    if (!mapInstance.current) {
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center: coordinates,
        zoom: 18,
        mapId: "aerial_view",
        mapTypeId: "satellite",
        tilt: 45,
        controlSize: 24,
        mapTypeControl: false,
        fullscreenControl: true,
        streetViewControl: true
      });

      new google.maps.Marker({
        position: coordinates,
        map: mapInstance.current,
        title: location || undefined
      });
    }
  }, [showMap, coordinates, location]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Property View</CardTitle>
        <CardDescription>
          {showMap ? '3D satellite view of the property location' : '360° aerial view of the property location'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="w-full h-[400px] rounded-lg">
            <Skeleton className="w-full h-full" />
            <p className="text-center mt-2 text-sm text-muted-foreground">Loading view...</p>
          </div>
        ) : error ? (
          <div className="w-full h-[400px] flex items-center justify-center bg-muted rounded-lg">
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : showMap ? (
          <div ref={mapRef} className="w-full h-[400px] rounded-lg" />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-[400px] rounded-lg object-cover"
            controls
            autoPlay
            loop
            muted
            playsInline
          >
            Your browser does not support the video element.
          </video>
        )}
      </CardContent>
    </Card>
  );
};

export default AerialView;
