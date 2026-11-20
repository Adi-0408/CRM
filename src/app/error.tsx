'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('CRM Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f8fafc] text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800">Something went wrong</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">
        {error.message || 'An unexpected error occurred in the CRM module.'}
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
        <button
          onClick={() => { window.location.href = '/dashboard'; }}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-all cursor-pointer active:scale-95"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
