'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import PieChart from '../../components/PieChart';
import {
  Users, Activity, TrendingUp, AlertTriangle, RefreshCw, BarChart3,
  LayoutDashboard, Sparkles, CheckCircle2, AlertCircle,
} from 'lucide-react';

export default function DashboardOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/children/stats/overview');
      setStats(data.stats);
      setError(null);
    } catch { setError('Failed to load dashboard statistics.'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const cards = [
    { label: 'Total Students', value: stats?.totalChildren || 0, icon: Users, color: 'text-indigo-600', bg: 'from-indigo-500/10 to-indigo-600/5', shadow: 'shadow-indigo-500/10', border: 'border-indigo-200/50' },
    { label: 'Students with Predictions', value: stats?.childrenWithPredictions || 0, icon: BarChart3, color: 'text-purple-600', bg: 'from-purple-500/10 to-purple-600/5', shadow: 'shadow-purple-500/10', border: 'border-purple-200/50' },
    { label: 'Total Predictions', value: stats?.totalPredictions || 0, icon: Activity, color: 'text-emerald-600', bg: 'from-emerald-500/10 to-emerald-600/5', shadow: 'shadow-emerald-500/10', border: 'border-emerald-200/50' },
    { label: 'At-Risk Students', value: stats?.predictionDistribution?.['At-Risk'] || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'from-red-500/10 to-red-600/5', shadow: 'shadow-red-500/10', border: 'border-red-200/50' },
  ];

  const rateConfig = {
    Fit: { text: 'text-green-600', bg: 'bg-gradient-to-r from-green-50 to-green-100/50', bar: 'bg-gradient-to-r from-green-400 to-emerald-500' },
    Unhealthy: { text: 'text-amber-600', bg: 'bg-gradient-to-r from-amber-50 to-amber-100/50', bar: 'bg-gradient-to-r from-amber-400 to-orange-500' },
    'At-Risk': { text: 'text-red-600', bg: 'bg-gradient-to-r from-red-50 to-red-100/50', bar: 'bg-gradient-to-r from-red-400 to-rose-500' },
  };

  const EmptyState = () => (
    <div className="glass rounded-2xl p-12 text-center">
      <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
        <BarChart3 className="w-10 h-10 text-indigo-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">No Data Yet</h3>
      <p className="text-gray-500 max-w-sm mx-auto">Add students and run predictions to see health analytics here.</p>
    </div>
  );

  return (
    <div>
      {/* Gradient Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-6 lg:px-8 py-8 lg:py-12">
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-10" />
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-white/60 text-sm mb-2">
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-2">Dashboard Overview</h1>
            <p className="text-white/70 text-sm lg:text-base">Monitor your students&apos; health predictions and analytics</p>
          </div>
          <button onClick={fetchStats} disabled={loading}
            className="group flex items-center gap-2 px-5 py-3 rounded-xl bg-white/15 backdrop-blur-sm text-white font-medium text-sm
              hover:bg-white/25 transition-all duration-200 disabled:opacity-50 border border-white/10">
            <RefreshCw className={`w-4 h-4 transition-all duration-500 ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 lg:p-8 -mt-6 relative z-20">
        {error && (
          <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-2xl text-red-700 text-sm flex items-center gap-3 animate-slide-down">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass rounded-2xl p-5 animate-pulse">
                  <div className="w-10 h-10 rounded-xl shimmer mb-3" />
                  <div className="h-8 w-16 shimmer rounded-lg mb-2" />
                  <div className="h-4 w-24 shimmer rounded-lg" />
                </div>
              ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6"><div className="h-64 shimmer rounded-xl" /></div>
              <div className="glass rounded-2xl p-6"><div className="space-y-4"><div className="shimmer h-16 rounded-xl" /><div className="shimmer h-16 rounded-xl" /><div className="shimmer h-16 rounded-xl" /></div></div>
            </div>
          </div>
        ) : !stats || stats.totalChildren === 0 ? <EmptyState /> : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
              {cards.map((c, i) => {
                const Icon = c.icon;
                return (
                  <div key={c.label}
                    className={`group glass rounded-2xl p-5 border ${c.border} bg-gradient-to-br ${c.bg} animate-fade-in-up cursor-default
                      hover:shadow-xl ${c.shadow} hover:-translate-y-0.5 transition-all duration-300`}
                    style={{ animationDelay: `${i * 0.08}s` }}>
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.bg} bg-white flex items-center justify-center mb-3
                      group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-5 h-5 ${c.color}`} />
                    </div>
                    <p className="text-3xl font-bold text-gray-900 group-hover:scale-105 origin-left transition-transform duration-300">{c.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{c.label}</p>
                  </div>
                );
              })}
            </div>

            {/* Row: Chart + Summary */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="glass rounded-2xl p-6 lg:p-8 hover:shadow-xl transition-all duration-300 animate-fade-in-up">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Health Distribution</h2>
                    <p className="text-xs text-gray-400">Current state of all students</p>
                  </div>
                </div>
                <PieChart data={stats?.predictionDistribution} />
              </div>

              {/* Prediction Rates */}
              <div className="glass rounded-2xl p-6 lg:p-8 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Overall Prediction Rates</h2>
                    <p className="text-xs text-gray-400">Summary of health predictions</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Fit', key: 'Fit', icon: CheckCircle2 },
                    { label: 'Unhealthy', key: 'Unhealthy', icon: AlertTriangle },
                    { label: 'At-Risk', key: 'At-Risk', icon: AlertCircle },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    const val = stats?.predictionDistribution?.[item.key] || 0;
                    const total = stats?.childrenWithPredictions || 1;
                    const pct = total > 0 ? ((val / total) * 100).toFixed(0) : 0;
                    const rc = rateConfig[item.key];
                    return (
                      <div key={item.key} className={`${rc.bg} p-5 rounded-2xl hover:shadow-md transition-all duration-300 animate-fade-in-up border border-transparent hover:border-gray-200/50`}
                        style={{ animationDelay: `${idx * 0.08}s` }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${rc.text}`} />
                            <span className={`font-bold text-sm ${rc.text}`}>{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-extrabold text-lg">{val}</span>
                            <span className="text-gray-400 text-xs">students</span>
                          </div>
                        </div>
                        <div className="w-full h-3 bg-white/60 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${rc.bar}`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5 font-medium">
                          <span className={rc.text}>{pct}%</span> of predicted students
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
