import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ChartBarIcon, ArrowTrendingUpIcon, BuildingOffice2Icon, CurrencyDollarIcon } from "@heroicons/react/24/outline";

interface MarketInsightsProps {
  location: string | null;
}

export default function MarketInsights({ location }: MarketInsightsProps) {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMarketInsights() {
      if (!location) {
        setInsights(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('Fetching market insights for:', location);
        const response = await fetch('/api/market-insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ location }),
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Service is busy. Please try again in a few minutes.');
          }
          throw new Error(data.error || 'Failed to fetch market insights');
        }

        setInsights(data.insights);
      } catch (err) {
        console.error('Market insights error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch market insights');
      } finally {
        setLoading(false);
      }
    }

    fetchMarketInsights();
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

  const formatMarkdown = (text: string) => {
    const sections = text.split('\n\n');
    return sections.map((section, sectionIndex) => {
      const lines = section.split('\n');
      
      // Handle section titles (##)
      if (lines[0].startsWith('**') && lines[0].endsWith('**')) {
        const title = lines[0].replace(/^\*\*|\*\*$/g, '');
        const content = lines.slice(1);
        return (
          <div key={sectionIndex} className="mb-6 last:mb-0">
            <h3 className="text-lg font-semibold mb-3 text-primary flex items-center gap-2">
              {sectionIndex === 0 && <BuildingOffice2Icon className="w-5 h-5" />}
              {sectionIndex === 1 && <CurrencyDollarIcon className="w-5 h-5" />}
              {sectionIndex === 2 && <ArrowTrendingUpIcon className="w-5 h-5" />}
              {title}
            </h3>
            <div className="space-y-2">
              {content.map((line, lineIndex) => {
                // Handle images
                const imageMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
                if (imageMatch) {
                  const [_, altText, imageUrl] = imageMatch;
                  return (
                    <div key={lineIndex} className="my-4">
                      <div className="relative rounded-lg overflow-hidden border bg-muted/20">
                        <img
                          src={imageUrl}
                          alt={altText}
                          className="w-full h-auto object-cover"
                          loading="lazy"
                        />
                        {altText && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">
                            {altText}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // Handle numbered lists
                if (line.match(/^\d+\./)) {
                  return (
                    <div key={lineIndex} className="flex gap-2 ml-4">
                      <span className="text-primary font-medium">{line.match(/^\d+/)?.[0]}.</span>
                      <span className="text-muted-foreground">{line.replace(/^\d+\.\s*/, '')}</span>
                    </div>
                  );
                }
                // Handle bold text within paragraphs
                if (line.includes('**')) {
                  const parts = line.split(/(\*\*.*?\*\*)/g);
                  return (
                    <p key={lineIndex} className="text-muted-foreground">
                      {parts.map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return (
                            <span key={i} className="font-medium text-foreground">
                              {part.slice(2, -2)}
                            </span>
                          );
                        }
                        return part;
                      })}
                    </p>
                  );
                }
                // Regular paragraphs
                if (line.trim()) {
                  return (
                    <p key={lineIndex} className="text-muted-foreground">
                      {line}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </div>
        );
      }
      
      // Handle regular paragraphs
      return (
        <div key={sectionIndex} className="mb-4">
          {lines.map((line, lineIndex) => {
            // Handle images in regular paragraphs
            const imageMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
            if (imageMatch) {
              const [_, altText, imageUrl] = imageMatch;
              return (
                <div key={lineIndex} className="my-4">
                  <div className="relative rounded-lg overflow-hidden border bg-muted/20">
                    <img
                      src={imageUrl}
                      alt={altText}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                    />
                    {altText && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">
                        {altText}
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            return (
              <p key={lineIndex} className="text-muted-foreground mb-2">
                {line}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/40">
        <CardTitle className="flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5" />
          Market Insights
        </CardTitle>
        <CardDescription>Real estate market analysis for {location}</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        ) : error ? (
          <div className="p-4 text-sm border rounded-lg bg-destructive/10 text-destructive">
            <p className="font-medium">Error loading market insights</p>
            <p className="mt-1">{error}</p>
            {error.includes('busy') && (
              <p className="mt-2 text-xs">
                The AI service is currently experiencing high demand. 
                Please wait a moment and try selecting the property again.
              </p>
            )}
          </div>
        ) : insights ? (
          <div className="text-sm divide-y">
            {formatMarkdown(insights)}
          </div>
        ) : (
          <div className="text-muted-foreground">No insights available for this location</div>
        )}
      </CardContent>
    </Card>
  );
}
