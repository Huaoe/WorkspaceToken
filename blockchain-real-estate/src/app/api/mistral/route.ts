import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

// CORS headers configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    if (!MISTRAL_API_KEY) {
      throw new Error('MISTRAL_API_KEY is not configured');
    }

    const { location } = await request.json();

    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { 
          status: 400,
          headers: corsHeaders
        }
      );
    }

    const prompt = `Please analyze the real estate market in ${location}. Provide a concise analysis with the following structure:
1. Market Analysis: Current market conditions, trends, and key factors affecting property values.
2. Price Prediction: Expected price movements in the next 12 months.
3. Risk Assessment: Key risks and opportunities for real estate investment in this area.
Keep each section under 200 words.`;

    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-medium",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get market insights');
    }

    const data = await response.json();
    
    return NextResponse.json(data, { 
      headers: corsHeaders
    });

  } catch (error: any) {
    console.error('Mistral API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { 
        status: error.status || 500,
        headers: corsHeaders
      }
    );
  }
}
