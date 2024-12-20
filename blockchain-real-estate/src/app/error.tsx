'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log detailed error information
    console.error('[ErrorBoundary] Application error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      name: error.name,
      timestamp: new Date().toISOString()
    });
  }, [error]);

  const handleReset = () => {
    console.log('[ErrorBoundary] Attempting to reset application state');
    try {
      // Clear any cached state that might be causing issues
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }
      reset();
    } catch (resetError) {
      console.error('[ErrorBoundary] Error during reset:', resetError);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Something went wrong!</h2>
          <p className="text-muted-foreground">
            {error.message || 'An error occurred while loading this page.'}
          </p>
          {error.digest && (
            <p className="text-sm text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
          >
            Go Home
          </Button>
          <Button
            variant="default"
            onClick={handleReset}
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
