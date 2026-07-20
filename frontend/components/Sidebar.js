'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  LogOut,
  Heart,
  Menu,
  ChevronLeft,
  Activity,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, desc: 'Analytics & charts' },
  { label: 'Children List', href: '/dashboard/children', icon: Users, desc: 'Manage & predict' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState(null);
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (href) => pathname === href;

  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        onMouseEnter={() => setHoveredNav(item.href)}
        onMouseLeave={() => setHoveredNav(null)}
        className={`relative group flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 overflow-hidden
          ${active
            ? 'text-white'
            : 'text-white/50 hover:text-white hover:bg-white/5'
          }
          ${collapsed ? 'justify-center' : ''}`}
      >
        {/* Active indicator */}
        {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-indigo-400 to-purple-400 shadow-lg shadow-indigo-500/50" />}
        {/* Hover glow */}
        {hoveredNav === item.href && !active && (
          <div className="absolute inset-0 bg-white/5 animate-fade-in rounded-xl" />
        )}
        <Icon className={`w-5 h-5 flex-shrink-0 relative z-10 transition-transform duration-300 ${hoveredNav === item.href ? 'scale-110' : ''}
          ${active ? 'text-indigo-300' : ''}`} />
        {!collapsed && (
          <div className="relative z-10 flex-1 min-w-0">
            <span className="block truncate">{item.label}</span>
            <span className="block text-[10px] text-white/30 truncate">{item.desc}</span>
          </div>
        )}
        {active && !collapsed && (
          <div className="relative z-10 w-2 h-2 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 shadow-lg shadow-indigo-500/50 animate-pulse-soft" />
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <div className={`h-full flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-1.5">
                <h2 className="text-white font-extrabold text-sm tracking-tight">HealthPredict</h2>
                <Sparkles className="w-3 h-3 text-indigo-400" />
              </div>
              <p className="text-white/30 text-[10px] uppercase tracking-wider">Parent Dashboard</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-4 space-y-0.5">
        {navItems.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-white/5 space-y-2">
        {!collapsed && user && (
          <div className="px-3 py-2 rounded-xl bg-white/5">
            <p className="text-white/40 text-[10px] uppercase tracking-wider">Signed in as</p>
            <p className="text-white font-medium text-sm truncate flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-500/50 animate-pulse-soft" />
              {user.name}
            </p>
          </div>
        )}
        <button onClick={logout}
          className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium
            text-red-300/70 hover:text-red-200 hover:bg-red-500/10 transition-all duration-200 group
            ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-indigo-500/30">
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-gray-900 to-gray-950 transform transition-transform duration-300 shadow-2xl ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:flex relative flex-col bg-gradient-to-b from-gray-900 to-gray-950 min-h-screen transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} shadow-2xl`}>
        {sidebarContent}
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 w-7 h-7 rounded-full bg-gray-800 border border-gray-700 text-gray-400 flex items-center justify-center hover:bg-gray-700 hover:text-white transition-all shadow-lg z-30">
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </>
  );
}
