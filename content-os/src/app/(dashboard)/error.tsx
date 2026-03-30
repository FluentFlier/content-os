'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <AlertTriangle className="w-12 h-12 text-[#EB5E55] mb-4" />
      <h2 className="font-heading text-[22px] font-[800] text-[#1A1714] mb-2">
        Something went wrong
      </h2>
      <p className="text-[#8C857D] text-[13px] mb-6 max-w-md">
        An unexpected error occurred while loading this page. Please try again.
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-1.5 bg-[#EB5E55] text-white text-[13px] font-medium px-5 py-[10px] rounded-[7px] hover:opacity-90 transition-opacity"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}
