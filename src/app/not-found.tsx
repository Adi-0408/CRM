'use client';

import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#f8fafc] text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 font-bold text-2xl">
        404
      </div>
      <h2 className="text-2xl font-bold text-slate-800">Page Not Found</h2>
      <p className="text-sm text-slate-500 mt-2 max-w-sm">
        The requested resource or page does not exist in the CRM system.
      </p>
      <Link
        href="/"
        className="mt-6 flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20"
      >
        <Home className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
