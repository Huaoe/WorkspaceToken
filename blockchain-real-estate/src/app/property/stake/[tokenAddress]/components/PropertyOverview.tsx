"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HomeIcon, MapPinIcon, EuroIcon } from "lucide-react";

interface PropertyDetails {
  id: string;
  created_at: string;
  owner_address: string;
  title: string;
  description: string;
  location: string;
  image_url: string;
  expected_price: number;
  documents_url: string;
  status: string;
}

interface PropertyOverviewProps {
  propertyDetails: PropertyDetails | null;
}

export function PropertyOverview({ propertyDetails }: PropertyOverviewProps) {
  if (!propertyDetails) return null;

  // Format price with proper error handling
  const formattedPrice = (() => {
    try {
      if (!propertyDetails.expected_price) {
        return "Price not available";
      }
      return `€${propertyDetails.expected_price.toLocaleString()}`;
    } catch (error) {
      console.error("Error formatting price:", error);
      return "Price not available";
    }
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {propertyDetails.title}
          <Badge 
            variant={propertyDetails.status === "staking" ? "success" : "destructive"}
            className="ml-2"
          >
            {propertyDetails.status.charAt(0).toUpperCase() + propertyDetails.status.slice(1)}
          </Badge>
        </CardTitle>
        <CardDescription>Owner: {propertyDetails.owner_address}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {propertyDetails.image_url && (
          <div className="relative w-full h-48 rounded-lg overflow-hidden">
            <img
              src={propertyDetails.image_url}
              alt={propertyDetails.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HomeIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Property</span>
            </div>
            <span className="font-medium">{propertyDetails.title}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPinIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Location</span>
            </div>
            <span className="font-medium">{propertyDetails.location || "Location not available"}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <EuroIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Price</span>
            </div>
            <span className="font-medium">{formattedPrice}</span>
          </div>

          {propertyDetails.description && (
            <div className="pt-2">
              <p className="text-sm text-muted-foreground">
                {propertyDetails.description}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
