'use client';

import { Activity } from 'lucide-react';

export default function BrandLoader({ text = 'Loading Student Wellness Dashboard...' }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />

      <div className="relative z-10 flex flex-col items-center text-center animate-fade-in-up">
        {/* Brand Logo matching exact user design screenshot */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 animate-pulse-soft">
            <Activity className="w-9 h-9 text-white stroke-[2.5]" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-extrabold text-indigo-600 tracking-tight">HealthPredict</h1>
            <p className="text-[11px] font-bold text-gray-400 tracking-wider uppercase mt-0.5">STUDENT WELLNESS DASHBOARD</p>
          </div>
        </div>

        {/* Loading Spinner & Status */}
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm shadow-md border border-indigo-100/60">
          <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-gray-600">{text}</span>
        </div>
      </div>
    </div>
  );
}
