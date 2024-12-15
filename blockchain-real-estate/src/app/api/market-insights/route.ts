import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for API routes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface MarketInsightsCache {
  id: string;
  location: string;
  insights: string;
  created_at: string;
}

export async function GET(request: Request) {
  try {
    console.log('Starting market insights request...');
    
    if (!process.env.MISTRAL_API_KEY) {
      console.error('MISTRAL_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'Mistral API key not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');
    console.log('Location:', location);

    if (!location) {
      console.log('No location provided');
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('market_insights_cache')
      .select('*')
      .eq('location', location)
      .single();

    if (cacheError && cacheError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Cache lookup error:', cacheError);
    }

    // If we have valid cached data that's less than 24 hours old, return it
    if (cachedData) {
      const cacheAge = Date.now() - new Date(cachedData.created_at).getTime();
      if (cacheAge < CACHE_DURATION) {
        console.log('Cache hit for location:', location);
        return NextResponse.json({ insights: cachedData.insights });
      }
    }

    // If no valid cache, proceed with Mistral API request
    const systemPrompt = `You are a real estate market analyst. Provide a detailed market analysis for the location: ${location}.
    Format your response with the following sections:
    **Location Overview**
    [Provide a brief overview of the area, including key characteristics and demographics]

    **Market Trends**
    [Analyze current market trends, including price trends, demand, and supply]

    **Investment Potential**
    [Evaluate the investment potential, including growth prospects and risk factors]

    Use markdown formatting for better readability. Keep the total response under 1000 characters.`;

    const userMessage = `Please provide a market analysis for ${location}.`;

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "open-mistral-nemo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
      }),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      if (response.status === 429) {
        return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
      }
      throw new Error(`API request failed with status ${response.status}`);
    }

    const insights = data.choices[0].message.content;

    // Update cache with new data
    const { error: upsertError } = await supabase
      .from('market_insights_cache')
      .upsert({
        location,
        insights,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'location'
      });

    if (upsertError) {
      console.error('Cache update error:', upsertError);
    }

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Market insights error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market insights' },
      { status: 500 }
    );
  }
}
