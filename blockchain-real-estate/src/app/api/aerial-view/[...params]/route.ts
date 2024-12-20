import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  const requestStartTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[AerialView API] [${requestId}] Request received:`, {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    params: params,
    timestamp: new Date().toISOString()
  });
  
  try {
    // Log raw params first
    console.log(`[AerialView API] [${requestId}] Raw params:`, params);
    
    if (!params?.params || !Array.isArray(params.params)) {
      console.error(`[AerialView API] [${requestId}] Invalid params structure:`, params);
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const [lat, lng] = params.params;
    console.log(`[AerialView API] [${requestId}] Extracted coordinates:`, { lat, lng });

    if (!lat || !lng) {
      console.error(`[AerialView API] [${requestId}] Missing coordinates:`, { lat, lng });
      return NextResponse.json(
        { error: 'Missing coordinates' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    console.log(`[AerialView API] [${requestId}] Parsed coordinates:`, { 
      latitude, 
      longitude,
      isLatValid: !isNaN(latitude),
      isLngValid: !isNaN(longitude)
    });
    
    if (isNaN(latitude) || isNaN(longitude)) {
      console.error(`[AerialView API] [${requestId}] Invalid coordinates:`, { 
        lat, 
        lng,
        parsedLat: latitude,
        parsedLng: longitude
      });
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    console.log(`[AerialView API] [${requestId}] API key status:`, {
      exists: !!apiKey,
      length: apiKey?.length
    });

    if (!apiKey) {
      console.error(`[AerialView API] [${requestId}] Missing Google Maps API key`);
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }

    // For testing, return a success response
    const response = {
      success: true,
      coordinates: { lat: latitude, lng: longitude },
      message: 'API endpoint working correctly',
      requestId
    };

    const requestDuration = Date.now() - requestStartTime;
    console.log(`[AerialView API] [${requestId}] Sending response:`, {
      ...response,
      duration: `${requestDuration}ms`
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error(`[AerialView API] [${requestId}] Error:`, {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${Date.now() - requestStartTime}ms`
    });
    
    return NextResponse.json(
      { error: 'Internal server error', requestId },
      { status: 500 }
    );
  }
}
