'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

console.log('[TestPage] Starting to initialize test page');

export default function TestPage() {
  console.log('[TestPage] Rendering test component');
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('[TestPage] Running mount effect');
    setMounted(true);
    return () => {
      console.log('[TestPage] Cleaning up test component');
    };
  }, []);

  if (!mounted) {
    console.log('[TestPage] Not mounted yet, returning loading state');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="text-muted-foreground">Loading test page...</p>
        </div>
      </div>
    );
  }

  console.log('[TestPage] Rendering main content');
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="space-y-8 text-center">
        <h1 className="text-4xl font-bold">Test Page</h1>
        <p className="text-xl text-muted-foreground">
          This is a simple test page to verify routing and providers
        </p>
        <div className="space-y-4">
          <p className="text-2xl">Count: {count}</p>
          <Button 
            onClick={() => {
              console.log('[TestPage] Incrementing count');
              setCount(c => c + 1);
            }}
          >
            Increment
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          <p>Component mounted successfully</p>
          <p>Current time: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}
