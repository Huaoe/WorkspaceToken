import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChartBarIcon, ArrowTrendingUpIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";

interface MarketInsightsProps {
  location: string;
}

interface MarketData {
  market_analysis: string;
  price_prediction: string;
  risk_assessment: string;
}

export default function MarketInsights({ location }: MarketInsightsProps) {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/mistral', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ location }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch market insights');
        }

        const data = await response.json();
        setMarketData(data);
      } catch (err) {
        console.error('Failed to fetch market insights:', err);
        setError('Failed to load market insights. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (location) {
      fetchInsights();
    }
  }, [location]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[150px] w-full" />
        <Skeleton className="h-[150px] w-full" />
        <Skeleton className="h-[150px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!marketData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No market data available for this location.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-blue-500" />
            <CardTitle>Market Analysis</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{marketData.market_analysis}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
            <CardTitle>Price Prediction</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{marketData.price_prediction}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldExclamationIcon className="h-5 w-5 text-yellow-500" />
            <CardTitle>Risk Assessment</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{marketData.risk_assessment}</p>
        </CardContent>
      </Card>
    </div>
  );
}
