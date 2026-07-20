'use client';

import { AlertTriangle, ThumbsUp, AlertCircle } from 'lucide-react';

const config = {
  Fit: {
    icon: ThumbsUp, color: 'text-green-600', bg: 'bg-gradient-to-br from-green-50 to-emerald-50/50',
    border: 'border-green-200/50', label: 'Fit & Healthy', desc: 'Great habits! Keep it up.',
    gradient: 'from-green-500 to-emerald-600', glow: 'shadow-green-500/20',
    ring: 'ring-green-400/30', statusDot: 'bg-green-500',
  },
  Unhealthy: {
    icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-gradient-to-br from-amber-50 to-orange-50/50',
    border: 'border-amber-200/50', label: 'Needs Attention', desc: 'Some areas could improve.',
    gradient: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/20',
    ring: 'ring-amber-400/30', statusDot: 'bg-amber-500',
  },
  'At-Risk': {
    icon: AlertCircle, color: 'text-red-600', bg: 'bg-gradient-to-br from-red-50 to-rose-50/50',
    border: 'border-red-200/50', label: 'At Risk', desc: 'Professional guidance recommended.',
    gradient: 'from-red-500 to-rose-600', glow: 'shadow-red-500/20',
    ring: 'ring-red-400/30', statusDot: 'bg-red-500 animate-pulse-soft',
  },
};

function ConfidenceRing({ value }) {
  const r = 36; const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = value >= 80 ? '#22c55e' : value >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20 flex-shrink-0">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-extrabold" style={{ color }}>{value.toFixed(0)}%</span>
        </div>
      </div>
      <div className="flex-1">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span className="font-medium">Model Confidence</span>
        </div>
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${value >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : value >= 60 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`}
            style={{ width: `${value}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function PredictionCard({ prediction, loading }) {
  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 lg:p-8 animate-pulse">
        <div className="flex items-center gap-4 mb-6">
          <div className="shimmer w-14 h-14 rounded-2xl" />
          <div className="space-y-2 flex-1"><div className="shimmer h-5 w-36 rounded-lg" /><div className="shimmer h-3 w-24 rounded-lg" /></div>
        </div>
        <div className="shimmer h-20 rounded-xl mb-4" />
        <div className="grid grid-cols-3 gap-3"><div className="shimmer h-12 rounded-xl" /><div className="shimmer h-12 rounded-xl" /><div className="shimmer h-12 rounded-xl" /></div>
      </div>
    );
  }
  if (!prediction) return null;

  const c = config[prediction.result] || config['At-Risk'];
  const Icon = c.icon;

  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} overflow-hidden animate-slide-up shadow-lg ${c.glow} hover:shadow-xl transition-shadow duration-300`}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${c.gradient} px-6 lg:px-8 py-5 flex items-center gap-4`}>
        <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-lg">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-extrabold text-xl tracking-tight">{c.label}</h3>
          <p className="text-white/70 text-sm">{c.desc}</p>
        </div>
        <div className={`w-3 h-3 rounded-full ${c.statusDot} shadow-lg`} />
      </div>

      {/* Body */}
      <div className="px-6 lg:px-8 py-6 space-y-5">
        <ConfidenceRing value={prediction.confidence} />

        {/* Probability breakdown */}
        {prediction.probabilities && (
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(prediction.probabilities).map(([key, val]) => {
              const isPrimary = key === prediction.result;
              return (
                <div key={key}
                  className={`text-center p-3 rounded-2xl transition-all duration-200 hover:scale-105 cursor-default
                    ${isPrimary ? 'bg-white shadow-md shadow-black/5 ring-1 ring-black/5' : 'bg-white/50'}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isPrimary ? 'text-gray-700' : 'text-gray-400'}`}>
                    {key}
                  </div>
                  <div className={`text-lg font-extrabold ${isPrimary ? (key === 'Fit' ? 'text-green-600' : key === 'Unhealthy' ? 'text-amber-600' : 'text-red-600') : 'text-gray-400'}`}>
                    {val.toFixed(1)}<span className="text-xs font-medium">%</span>
                  </div>
                  {isPrimary && (
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current mx-auto opacity-50" />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Input summary */}
        {prediction.inputSummary && (
          <div className="border-t border-gray-100 pt-4 mt-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-2">Input Data</p>
            <div className="grid grid-cols-3 gap-3 text-xs text-gray-600">
              <span>Sleep: {prediction.inputSummary.sleep}h</span>
              <span>Steps: {prediction.inputSummary.steps.toLocaleString()}</span>
              <span>Diet: {prediction.inputSummary.diet}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
