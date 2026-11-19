'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Superadmin company details error:', error);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto p-8 my-12 bg-white rounded-2xl border border-rose-200 shadow-sm text-center">
      <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to Load Company Details</h2>
      <p className="text-sm text-slate-500 mb-6">
        {error?.message || 'An unexpected error occurred while loading this company profile.'}
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
        <Link
          href="/superadmin/companies"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Companies
        </Link>
      </div>
    </div>
  );
}
