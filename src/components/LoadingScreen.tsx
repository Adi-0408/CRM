'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  isFading?: boolean;
}

export default function LoadingScreen({
  message = 'Loading your workspace...',
  isFading = false,
}: LoadingScreenProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#F4F3FA] via-[#FAF9FE] to-[#EFEBFD] transition-opacity duration-300 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Floating Decorative Blurred Glass Pill Shapes */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-200/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/3 w-64 h-32 bg-blue-100/50 rounded-full blur-2xl pointer-events-none -rotate-12" />

      {/* Centerpiece Floating Card */}
      <div className="relative z-10 flex flex-col items-center text-center p-8 max-w-sm w-full mx-4">
        {/* Floating Glass/White Logo Badge */}
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-2xl bg-white shadow-[0_10px_30px_-5px_rgba(99,91,255,0.15)] border border-slate-100 flex items-center justify-center p-3 animate-bounce duration-1000">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white font-extrabold text-xl shadow-sm shadow-indigo-500/30">
              P
            </div>
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#EEF2FF] border border-indigo-100 flex items-center justify-center text-[#635BFF]">
            <Sparkles className="w-3 h-3 animate-spin duration-3000" />
          </div>
        </div>

        {/* Brand Name */}
        <h3 className="text-base font-bold tracking-tight text-slate-900 mb-1">
          Prism<span className="text-violet-600 font-extrabold">CRM</span>
        </h3>

        {/* Dynamic Status Subtext */}
        <p className="text-xs font-medium text-slate-400 tracking-wide mb-6 h-4 transition-all">
          {message}
        </p>

        {/* Minimalist Progress Bar */}
        <div className="h-1.5 w-48 bg-slate-200/70 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-gradient-to-r from-[#635BFF] via-[#817AFE] to-[#635BFF] rounded-full animate-[progress_1.2s_ease-in-out_infinite]" />
        </div>

        {/* Subtle pill footer */}
        <div className="mt-6 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/80 border border-slate-100 shadow-xs text-[10px] text-slate-400 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Role-Based Portal</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% {
            width: 15%;
            margin-left: 0%;
          }
          50% {
            width: 60%;
            margin-left: 20%;
          }
          100% {
            width: 100%;
            margin-left: 0%;
          }
        }
      `}</style>
    </div>
  );
}
