import { NextResponse } from 'next/server';
import fetch from 'node-fetch';

const AGENT_ID = 'ag:33f52f90:20241206:untitled-agent:1bfc9f18';
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/agents/completions';
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, options: any, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (response.status === 429) {
        const waitTime = initialDelay * Math.pow(2, retryCount);
        console.log(`Rate limited. Waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
        await delay(waitTime);
        retryCount++;
        continue;
      }

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'API request failed');
      }

      return { response, data };
    } catch (error) {
      lastError = error;
      if (retryCount === maxRetries - 1) break;
      
      const waitTime = initialDelay * Math.pow(2, retryCount);
      console.log(`Request failed. Waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
      await delay(waitTime);
      retryCount++;
    }
  }

  throw lastError;
}

export async function POST(request: Request) {
  try {
    console.log('Starting market insights request...');
    
    if (!MISTRAL_API_KEY) {
      console.error('MISTRAL_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'Mistral API key not configured' },
        { status: 500 }
      );
    }

    const { location } = await request.json();
    console.log('Location:', location);

    if (!location) {
      console.log('No location provided');
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }

    try {
      console.log('Sending request to Mistral Agent API...');
      const { response, data } = await fetchWithRetry(
        MISTRAL_API_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${MISTRAL_API_KEY}`,
          },
          body: JSON.stringify({
            agent_id: AGENT_ID,
            messages: [
              {
                role: "user",
                content: `I need a detailed real estate market analysis for ${location}. Please include:
1. Current market trends and conditions
2. Average property prices in this specific area
3. Recent price evolution over the past year
4. Investment potential and ROI estimates
5. Local market dynamics (demand, supply, vacancy rates)
6. Key factors affecting property values in this location

Please be specific about this exact location and provide concrete data where possible.`
              }
            ]
          }),
        }
      );

      console.log('Response status:', response.status);
      console.log('Response data:', data);

      const insights = data.choices?.[0]?.message?.content;
      if (!insights) {
        throw new Error('No insights received from the API');
      }

      return NextResponse.json({ insights });
    } catch (apiError: any) {
      console.error('Detailed API error:', {
        name: apiError.name,
        message: apiError.message,
        stack: apiError.stack,
        response: apiError.response,
      });

      if (apiError.message?.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Service is currently busy. Please try again in a few minutes.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Error getting market insights: ${apiError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Request processing error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return NextResponse.json(
      { error: `Failed to process request: ${error.message}` },
      { status: 500 }
    );
  }
}
