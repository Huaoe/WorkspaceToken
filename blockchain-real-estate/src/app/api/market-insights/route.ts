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

export async function GET(
  request: Request,
  { params }: { params: { location?: string } }
) {
  try {
    // Get location from query parameters
    const location = new URL(request.url).searchParams.get('location');

    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json(
        { error: 'Mistral API key not configured' },
        { status: 500 }
      );
    }

    if (!location) {
      return NextResponse.json(
        { error: 'Location parameter is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const { data: cachedInsights } = await supabase
      .from('market_insights_cache')
      .select('*')
      .eq('location', location)
      .single();

    if (cachedInsights) {
      const cacheAge = Date.now() - new Date(cachedInsights.created_at).getTime();
      if (cacheAge < CACHE_DURATION) {
        return NextResponse.json({ insights: cachedInsights.insights });
      }
    }

    // Generate new insights using Mistral API
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: 'mistral-tiny',
        messages: [
          {
            role: 'user',
            content: `Provide a brief market analysis for real estate in ${location}. Focus on current trends, average prices, and investment potential. Keep it concise and factual.`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch market insights');
    }

    const data = await response.json();
    const insights = data.choices[0].message.content;

    // Cache the new insights
    await supabase.from('market_insights_cache').upsert(
      {
        location,
        insights,
        created_at: new Date().toISOString()
      },
      { onConflict: 'location' }
    );

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error in market insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market insights' },
      { status: 500 }
    );
  }
}