import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ChartBarIcon, ArrowTrendingUpIcon, BuildingOffice2Icon, CurrencyDollarIcon } from "@heroicons/react/24/outline";

interface MarketInsightsProps {
  location: string | null;
}

export default function MarketInsights({ location }: MarketInsightsProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) {
      setLoading(false);
      setInsights(null);
      return;
    }

    const fetchInsights = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/market-insights?location=${encodeURIComponent(location)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setInsights(data.insights);
      } catch (err) {
        console.error('Failed to fetch market insights:', err);
        setError('Failed to load market insights. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [location]);

  if (!location) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5" />
            Market Insights
          </CardTitle>
          <CardDescription>Select a property to view market insights for that area</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5" />
            Market Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5" />
            Market Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5" />
            Market Insights
          </CardTitle>
          <CardDescription>No insights available for this location</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5" />
          Market Insights
        </CardTitle>
        <CardDescription>Market analysis for {location}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose dark:prose-invert max-w-none">
          {insights.split('\n\n').map((section, index) => {
            const [title, ...content] = section.split('\n');
            const titleText = title.replace(/^\*\*|\*\*$/g, '');
            
            return (
              <div key={index} className="mb-6 last:mb-0">
                <h3 className="text-lg font-semibold mb-3 text-primary flex items-center gap-2">
                  {index === 0 && <BuildingOffice2Icon className="w-5 h-5" />}
                  {index === 1 && <CurrencyDollarIcon className="w-5 h-5" />}
                  {index === 2 && <ArrowTrendingUpIcon className="w-5 h-5" />}
                  {titleText}
                </h3>
                <div className="space-y-2">
                  {content.map((line, i) => (
                    <p key={i} className="text-sm text-muted-foreground">{line}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
