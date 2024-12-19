import { NextResponse } from 'next/server';

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

export async function POST(request: Request) {
  try {
    if (!MISTRAL_API_KEY) {
      throw new Error('MISTRAL_API_KEY is not configured');
    }

    const { location } = await request.json();

    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
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
    const content = data.choices[0].message.content;

    // Parse the content into sections
    const sections = content.split(/\d\.\s+/).filter(Boolean);
    const [marketAnalysis, pricePrediction, riskAssessment] = sections.map(
      section => section.trim()
    );

    return NextResponse.json({
      market_analysis: marketAnalysis || 'Market analysis not available',
      price_prediction: pricePrediction || 'Price prediction not available',
      risk_assessment: riskAssessment || 'Risk assessment not available',
    });
  } catch (error) {
    console.error('Mistral API error:', error);
    return NextResponse.json(
      { error: 'Failed to get market insights' },
      { status: 500 }
    );
  }
}
