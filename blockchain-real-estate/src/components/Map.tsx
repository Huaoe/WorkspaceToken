'use client'

import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react';

// Create a simple div icon instead of using image files
const icon = L.divIcon({
  className: 'bg-primary w-6 h-6 rounded-full border-2 border-white shadow-lg',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

interface MapProps {
  center: { lat: number; lng: number };
  marker: { lat: number; lng: number };
  onMapClick: (lat: number, lng: number) => void;
}

// MapEvents component to handle click events
function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to handle map centering
function MapCentering({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([center.lat, center.lng], 13);
  }, [map, center.lat, center.lng]);
  
  return null;
}

export default function Map({ center, marker, onMapClick }: MapProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      style={{ height: '400px', width: '100%' }}
      className="rounded-lg border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker 
        position={[marker.lat, marker.lng]}
        icon={icon}
      />
      <MapEvents onMapClick={onMapClick} />
      <MapCentering center={center} />
    </MapContainer>
  );
}
