import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');

  if (!location) {
    return NextResponse.json(
      { error: 'Location is required' },
      { status: 400 }
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key is not configured' },
      { status: 500 }
    );
  }

  try {
    // First, geocode the address to get coordinates
    const geocodeUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    geocodeUrl.searchParams.append('address', location);
    geocodeUrl.searchParams.append('key', apiKey);

    const geocodeResponse = await fetch(geocodeUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    const geocodeData = await geocodeResponse.json();
    console.log('Geocode response:', geocodeData);

    if (geocodeData.status !== 'OK' || !geocodeData.results[0]?.geometry?.location) {
      return NextResponse.json(
        { error: 'Failed to geocode location' },
        { status: 400 }
      );
    }

    const center = geocodeData.results[0].geometry.location;

    // Then, fetch nearby places
    const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    placesUrl.searchParams.append('location', `${center.lat},${center.lng}`);
    placesUrl.searchParams.append('radius', '500');
    placesUrl.searchParams.append('key', apiKey);

    const placesResponse = await fetch(placesUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    const placesData = await placesResponse.json();
    console.log('Places response:', placesData);

    if (placesData.status !== 'OK') {
      return NextResponse.json(
        { error: 'Failed to fetch nearby places' },
        { status: 400 }
      );
    }

    // Return both the center coordinates and places
    return NextResponse.json({
      center,
      places: placesData.results
    });
  } catch (error) {
    console.error('Error in places API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
