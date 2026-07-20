'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Activity, Mail, Lock, User, Eye, EyeOff, Heart, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [focusedField, setFocusedField] = useState(null);
  const { login, register, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      } else {
        await register(form.name, form.email, form.password);
        toast.success('Account created!');
      }
      router.push('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full pl-10 pr-12 py-3.5 rounded-xl border-2 bg-white/80 backdrop-blur-sm text-sm outline-none transition-all duration-300
    ${focusedField === field ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 scale-[1.01]' : 'border-gray-200 hover:border-gray-300'}
    ${form[field] && !focusedField ? 'border-indigo-300 bg-indigo-50/30' : ''}`;

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* LEFT — Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />

        <div className="w-full max-w-md relative animate-fade-in-up">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 animate-glow">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold gradient-text">HealthPredict</h1>
              <p className="text-xs text-gray-400 tracking-wide uppercase">Student Wellness Dashboard</p>
            </div>
          </div>

          {/* Glass card */}
          <div className="glass rounded-3xl p-8 md:p-10 shadow-2xl shadow-indigo-500/5">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-gray-500 mb-8 text-sm">
              {isLogin
                ? 'Sign in to monitor your children\'s health'
                : 'Register to start tracking student wellness'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <div className="animate-fade-in-up">
                  <label className="block text-sm font-medium text-gray-600 mb-1.5 ml-1">Full Name</label>
                  <div className="relative">
                    <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'name' ? 'text-indigo-500' : 'text-gray-400'}`} />
                    <input type="text" name="name" value={form.name} onChange={handleChange}
                      onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)}
                      placeholder="John Doe"
                      className={inputClass('name')} required={!isLogin} />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'email' ? 'text-indigo-500' : 'text-gray-400'}`} />
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
                    placeholder="you@example.com"
                    className={inputClass('email')} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${focusedField === 'password' ? 'text-indigo-500' : 'text-gray-400'}`} />
                  <input type={showPw ? 'text' : 'password'} name="password" value={form.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className={inputClass('password')} required minLength={6} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="group relative w-full py-3.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-sm
                  shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg overflow-hidden">
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
                {loading ? (
                  <span className="flex items-center justify-center gap-2 relative z-10">
                    <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {isLogin ? 'Signing in...' : 'Creating...'}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 relative z-10">
                    <Sparkles className="w-4 h-4" />
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </span>
                )}
              </button>
            </form>

            <div className="mt-8 text-center relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative">
                <span className="bg-white px-4 text-xs text-gray-400">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                </span>
              </div>
            </div>

            <p className="mt-4 text-center">
              <button onClick={() => { setIsLogin(!isLogin); setForm({ name: '', email: '', password: '' }); }}
                className="text-indigo-600 font-semibold text-sm hover:text-indigo-700 transition-colors hover:underline underline-offset-4">
                {isLogin ? 'Create one here →' : 'Sign in instead →'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT — Decorative Panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative items-center justify-center overflow-hidden">
        {/* Floating particles */}
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />
        <div className="particle" />

        {/* Gradient orbs */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 text-center px-12 max-w-lg">
          <div className="w-24 h-24 mx-auto mb-10 rounded-3xl bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl animate-float">
            <Activity className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-5xl font-extrabold text-white mb-6 leading-tight">
            Student Health<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-pink-200">Prediction</span>
          </h2>

          <p className="text-white/70 text-lg leading-relaxed mb-12">
            Monitor and predict your children&apos;s health conditions using advanced machine learning.
            Get AI-powered insights and personalized recommendations.
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'At-Risk', color: 'from-red-400 to-red-500', emoji: '🚨' },
              { label: 'Unhealthy', color: 'from-amber-400 to-amber-500', emoji: '⚠️' },
              { label: 'Fit', color: 'from-green-400 to-green-500', emoji: '✅' },
            ].map((item) => (
              <div key={item.label}
                className={`bg-gradient-to-b ${item.color} bg-opacity-80 backdrop-blur-sm rounded-2xl p-5 border border-white/10
                  hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-default`}>
                <p className="text-2xl mb-1">{item.emoji}</p>
                <p className="text-white font-bold text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
