'use client';

import { Property } from '@/types/property';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="relative h-48 w-full">
        {property.imageUrl ? (
          <Image
            src={property.imageUrl}
            alt={property.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
            No Image Available
          </div>
        )}
      </div>
      <CardHeader className="flex-none">
        <div className="flex justify-between items-start gap-2">
          <div>
            <CardTitle className="text-xl line-clamp-1">{property.name}</CardTitle>
            <CardDescription className="line-clamp-1">{property.location}</CardDescription>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
            property.isApproved 
              ? "bg-green-100 text-green-800" 
              : "bg-yellow-100 text-yellow-800"
          }`}>
            {property.isApproved ? "Approved" : "Pending"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 line-clamp-2">{property.description}</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold">{property.price} ETH</p>
              {property.isSold && (
                <span className="text-xs text-red-600">Sold</span>
              )}
            </div>
            <span className="text-xs text-gray-500 truncate" title={property.owner}>
              Owner: {property.owner.slice(0, 6)}...{property.owner.slice(-4)}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-none">
        <Button className="w-full" variant={property.isSold ? "secondary" : "default"}>
          {property.isSold ? "View Details" : "Purchase Property"}
        </Button>
      </CardFooter>
    </Card>
  );
}
