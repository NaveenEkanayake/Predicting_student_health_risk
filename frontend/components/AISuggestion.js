'use client';

import { Sparkles, AlertCircle, Brain, Lightbulb } from 'lucide-react';

export default function AISuggestion({ suggestion, loading, error }) {
  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 lg:p-8 animate-pulse">
        <div className="flex items-center gap-3 mb-5">
          <div className="shimmer w-12 h-12 rounded-2xl" />
          <div className="space-y-2 flex-1"><div className="shimmer h-5 w-32 rounded-lg" /><div className="shimmer h-3 w-24 rounded-lg" /></div>
          <div className="shimmer w-8 h-8 rounded-lg" />
        </div>
        <div className="space-y-2.5">
          <div className="shimmer h-3 w-full rounded-lg" />
          <div className="shimmer h-3 w-11/12 rounded-lg" />
          <div className="shimmer h-3 w-4/5 rounded-lg" />
          <div className="shimmer h-3 w-3/4 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!suggestion) return null;

  return (
    <div className="glass rounded-2xl overflow-hidden animate-slide-up shadow-lg hover:shadow-xl transition-shadow duration-300">
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 lg:px-8 py-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-sm">AI Health Analysis</h3>
          <p className="text-white/60 text-[11px] tracking-wide">Powered by Gemini AI</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4 text-yellow-300" />
          <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse-soft" />
        </div>
      </div>

      {/* Body */}
      <div className="px-6 lg:px-8 py-6 animate-typewriter">
        {error ? (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-amber-600" />
            <p className="text-amber-800 text-sm leading-relaxed">{suggestion}</p>
          </div>
        ) : (
          <div className="flex gap-4">
            <div className="w-1 flex-shrink-0 rounded-full bg-gradient-to-b from-violet-400 to-indigo-500 opacity-50" />
            <p className="text-gray-700 text-sm leading-relaxed tracking-wide">{suggestion}</p>
          </div>
        )}
      </div>
    </div>
  );
}
