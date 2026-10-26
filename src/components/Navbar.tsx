import React, { useState } from 'react';
import {
  ShoppingBag,
  Truck,
  Search,
  Building2,
  ShieldCheck,
  User,
  LogOut,
  ChevronDown,
  Layers,
  PhoneCall,
  Menu,
  X
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import type { UserRole } from '../types/index.ts';

interface NavbarProps {
  onOpenTracker: () => void;
  onOpenStaffDashboard: () => void;
  activeView: 'store' | 'dashboard';
  setActiveView: (view: 'store' | 'dashboard') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenTracker,
  onOpenStaffDashboard,
  activeView,
  setActiveView,
}) => {
  const { user, isStaff, logout, switchUserRoleDemo } = useAuth();
  const { totalTrailers, totalBags, totalWeightTonnes, setIsCartOpen } = useCart();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const roleColors: Record<UserRole, string> = {
    MANAGER: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
    ASSISTANT_MANAGER: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50',
    AGENT: 'bg-teal-900/40 text-teal-300 border-teal-700/50',
    ADMIN: 'bg-rose-900/40 text-rose-300 border-rose-700/50',
    STORE_MANAGER: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
    SALES_OFFICER: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
    DELIVERY_OFFICER: 'bg-orange-900/40 text-orange-300 border-orange-700/50',
    CUSTOMER: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 text-white">
      {/* Top Banner for A.A. Master Nig. Limited */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-emerald-950 text-white text-xs py-1.5 px-4 font-medium border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-extrabold uppercase tracking-wide text-amber-300">A.A. Master Nig. Limited:</span>
            <span className="text-slate-200 hidden sm:inline">
              General Merchant &amp; Supplier • Sokoto Cement Trailers ONLY (600 Bags @ ₦10,850 = ₦6,510,000 / Trailer)
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-300 text-xs">
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-amber-400" /> 30-Ton Fleet Haulage
            </span>
            <span className="hidden md:flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> NIS 444-1 Certified
            </span>
            <a href="tel:08036172280" className="hover:text-amber-300 flex items-center gap-1 font-semibold text-white">
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" /> 080-36172280
            </a>
            <a href="tel:08082111063" className="hidden lg:flex hover:text-amber-300 items-center gap-1 font-semibold text-slate-300">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" /> 080-82111063
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => setActiveView('store')}
          >
            <div className="h-10 w-10 rounded-xl bg-blue-900 border-2 border-red-600/70 shadow-lg p-0.5 flex items-center justify-center group-hover:scale-105 transition-transform overflow-hidden bg-white shrink-0">
              <img
                src="/assets/aistudio/image_8da756cd.png"
                alt="A.A.M. Logo"
                className="w-full h-full object-cover object-left"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  A.A. Master Nig. Ltd
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                  Trailers Only
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                General Merchant &amp; Supplier • Sokoto Cement Terminal
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveView('store')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeView === 'store'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              Trailer Catalog
            </button>
            <button
              onClick={onOpenTracker}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Search className="w-4 h-4 text-emerald-400" />
              Track Waybill Convoy
            </button>
            {isStaff && (
              <button
                onClick={() => {
                  setActiveView('dashboard');
                  onOpenStaffDashboard();
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  activeView === 'dashboard'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-amber-400 hover:bg-amber-950/40'
                }`}
              >
                <Layers className="w-4 h-4" />
                Plant Dashboard
              </button>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Quick RBAC Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  user ? roleColors[user.role] : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
                title="Switch persona for testing"
              >
                <User className="w-3.5 h-3.5" />
                <span className="font-semibold hidden sm:inline">
                  {user ? user.role.replace('_', ' ') : 'Select Persona'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-70" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Switch Role Persona (Instant Demo)
                    </p>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Logged in as <strong className="text-amber-400">{user?.fullName || 'Guest'}</strong>
                    </p>
                  </div>
                  <div className="py-1 space-y-1">
                    {(['MANAGER', 'ASSISTANT_MANAGER', 'AGENT', 'CUSTOMER'] as UserRole[]).map((r) => {
                      const acc = DEMO_ACCOUNTS[r];
                      const isCurrent = user?.role === r;
                      return (
                        <button
                          key={r}
                          onClick={() => {
                            switchUserRoleDemo(r);
                            setShowRoleMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            isCurrent
                              ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                              : 'hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <div>
                            <span className="font-bold block text-white">{r.replace('_', ' ')}</span>
                            <span className="text-[11px] text-slate-400">{acc?.label || r}</span>
                          </div>
                          {isCurrent && <span className="text-amber-400 font-bold text-xs">Active</span>}
                        </button>
                      );
                    })}
                  </div>
                  <div className="pt-1.5 mt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        logout();
                        setShowRoleMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/30 rounded-lg flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Trailer Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md shadow-amber-950/40 transition-all border border-amber-400/20 active:scale-95"
            >
              <Truck className="w-4 h-4" />
              <span className="hidden sm:inline">Trailer Cart</span>
              {totalTrailers > 0 && (
                <span className="flex items-center justify-center bg-white text-slate-950 text-xs font-black px-2 py-0.5 rounded-full shadow-sm">
                  {totalTrailers} {totalTrailers === 1 ? 'Trailer' : 'Trailers'} <span className="text-[10px] ml-1 text-slate-600">({totalWeightTonnes}T)</span>
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-800 space-y-2">
            <button
              onClick={() => {
                setActiveView('store');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 rounded-lg"
            >
              Sokoto Cement Trailer Catalogue
            </button>
            <button
              onClick={() => {
                onOpenTracker();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 rounded-lg flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-emerald-400" />
              Track Waybill & Convoy
            </button>
            {isStaff && (
              <button
                onClick={() => {
                  setActiveView('dashboard');
                  onOpenStaffDashboard();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-amber-400 hover:bg-slate-800 rounded-lg flex items-center gap-2"
              >
                <Layers className="w-4 h-4" />
                Staff Operations Portal
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
