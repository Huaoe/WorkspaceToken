import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('[AerialView API] Received request');
  
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    
    console.log('[AerialView API] Coordinates:', { lat, lng });
    
    if (!lat || !lng) {
      console.error('[AerialView API] Missing coordinates');
      return new NextResponse(
        JSON.stringify({ error: 'Missing coordinates' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('[AerialView API] Missing API key');
      return new NextResponse(
        JSON.stringify({ error: 'Server configuration error' }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const url = `https://aerialview.googleapis.com/v1/video?location=${lat},${lng}&key=${apiKey}`;
    console.log('[AerialView API] Fetching from Google API');

    const response = await fetch(url, {
      headers: {
        'Accept': 'video/mp4,video/*'
      }
    });
    console.log('[AerialView API] Google API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AerialView API] Google API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return new NextResponse(
        JSON.stringify({
          error: 'Failed to fetch aerial view',
          details: errorText
        }), 
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const contentType = response.headers.get('content-type');
    console.log('[AerialView API] Content type:', contentType);

    const videoData = await response.arrayBuffer();
    console.log('[AerialView API] Received video data size:', videoData.byteLength);

    // Set appropriate CORS headers
    return new NextResponse(videoData, {
      headers: {
        'Content-Type': contentType || 'video/mp4',
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': videoData.byteLength.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('[AerialView API] Unexpected error:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
