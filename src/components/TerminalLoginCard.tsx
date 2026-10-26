import React, { useState } from 'react';
import {
  Lock,
  User,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  ArrowRight,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Layers
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext.tsx';
import type { UserRole } from '../types/index.ts';

interface TerminalLoginCardProps {
  onOpenDashboard: () => void;
  onOpenOrder: () => void;
}

export const TerminalLoginCard: React.FC<TerminalLoginCardProps> = ({
  onOpenDashboard,
  onOpenOrder,
}) => {
  const { user, login, logout, switchUserRoleDemo, isStaff } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginMode, setLoginMode] = useState<'quick' | 'manual'>('quick');

  const roleColors: Record<UserRole, { badge: string; text: string; bg: string }> = {
    MANAGER: { badge: 'bg-purple-900/60 text-purple-300 border-purple-700', text: 'Order & Stock Approval Authority', bg: 'from-purple-950/40' },
    ASSISTANT_MANAGER: { badge: 'bg-indigo-900/60 text-indigo-300 border-indigo-700', text: 'Queue Verification & Pricing Review', bg: 'from-indigo-950/40' },
    AGENT: { badge: 'bg-teal-900/60 text-teal-300 border-teal-700', text: 'Physical Loading & Gate Pass Clearance', bg: 'from-teal-950/40' },
    ADMIN: { badge: 'bg-rose-900/60 text-rose-300 border-rose-700', text: 'Full Administrative Authority', bg: 'from-rose-950/40' },
    CUSTOMER: { badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700', text: 'Wholesale Trailer Buyer', bg: 'from-emerald-950/40' },
    STORE_MANAGER: { badge: 'bg-amber-900/60 text-amber-300 border-amber-700', text: 'Depot Stock Operations', bg: 'from-amber-950/40' },
    SALES_OFFICER: { badge: 'bg-cyan-900/60 text-cyan-300 border-cyan-700', text: 'Sales Queue Management', bg: 'from-cyan-950/40' },
    DELIVERY_OFFICER: { badge: 'bg-orange-900/60 text-orange-300 border-orange-700', text: 'Logistics Haulage Dispatch', bg: 'from-orange-950/40' },
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
      setLoginError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSwitch = async (role: UserRole) => {
    setLoginError('');
    setIsSubmitting(true);
    try {
      await switchUserRoleDemo(role);
    } catch {
      setLoginError('Failed to switch role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentRoleConfig = user ? (roleColors[user.role] || roleColors.CUSTOMER) : roleColors.CUSTOMER;

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between h-full overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-900/60 border border-blue-600/50 flex items-center justify-center text-blue-300">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white font-['Plus_Jakarta_Sans'] leading-tight">
                Terminal Access Portal
              </h3>
              <p className="text-[10px] text-slate-400">
                Staff &amp; Authorized Buyer Authentication
              </p>
            </div>
          </div>

          {user && (
            <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Authenticated
            </span>
          )}
        </div>

        {/* If User is Logged In: Show Active Session & Management Actions */}
        {user ? (
          <div className="mt-3 space-y-3">
            {/* Active User Banner */}
            <div className={`p-3 rounded-xl bg-gradient-to-r ${currentRoleConfig.bg} to-slate-950 border border-slate-800 space-y-1.5`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${currentRoleConfig.badge}`}>
                  {user.role}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ID: #{user.id.slice(-6)}
                </span>
              </div>
              <div>
                <strong className="text-sm text-white font-bold block">{user.fullName}</strong>
                <span className="text-[11px] text-slate-400">{user.email}</span>
              </div>
              <p className="text-[10px] text-amber-300/90 font-medium pt-0.5">
                Authority: {currentRoleConfig.text}
              </p>
            </div>

            {/* Primary Action depending on Role */}
            <div className="space-y-2">
              {isStaff ? (
                <button
                  onClick={onOpenDashboard}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 text-xs transition-all active:scale-95"
                >
                  <Layers className="w-4 h-4" />
                  <span>Enter Staff Logistics Portal ({user.role})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={onOpenOrder}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 text-xs transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Place Full Trailer Order (600 Bags)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Switch Role Picker */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Switch Operational Persona:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleQuickSwitch('ADMIN')}
                  className={`text-[11px] font-bold p-1.5 rounded-lg border text-left transition-all ${
                    user.role === 'ADMIN'
                      ? 'bg-rose-900/60 text-rose-200 border-rose-500'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  🏛️ Admin (Managing Dir.)
                </button>
                <button
                  onClick={() => handleQuickSwitch('MANAGER')}
                  className={`text-[11px] font-bold p-1.5 rounded-lg border text-left transition-all ${
                    user.role === 'MANAGER'
                      ? 'bg-purple-900/60 text-purple-200 border-purple-500'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  👔 Manager (Approvals)
                </button>
                <button
                  onClick={() => handleQuickSwitch('AGENT')}
                  className={`text-[11px] font-bold p-1.5 rounded-lg border text-left transition-all ${
                    user.role === 'AGENT'
                      ? 'bg-teal-900/60 text-teal-200 border-teal-500'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  🚛 Agent (Truck Loading)
                </button>
                <button
                  onClick={() => handleQuickSwitch('ASSISTANT_MANAGER')}
                  className={`text-[11px] font-bold p-1.5 rounded-lg border text-left transition-all ${
                    user.role === 'ASSISTANT_MANAGER'
                      ? 'bg-indigo-900/60 text-indigo-200 border-indigo-500'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  📋 Asst. Manager
                </button>
                
                <button
                  onClick={() => handleQuickSwitch('CUSTOMER')}
                  className={`text-[11px] font-bold p-1.5 rounded-lg border text-left transition-all ${
                    user.role === 'CUSTOMER'
                      ? 'bg-emerald-900/60 text-emerald-200 border-emerald-500'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                >
                  🏗️ Customer Portal
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* When NOT Logged In: Mode Tabs & Forms */
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setLoginMode('quick')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  loginMode === 'quick'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                1-Click Demo Login
              </button>
              <button
                onClick={() => setLoginMode('manual')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  loginMode === 'manual'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Enter Credentials
              </button>
            </div>

            {loginError && (
              <div className="p-2 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {loginMode === 'quick' ? (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Select Role to Sign In Immediately:
                </span>
                <div className="space-y-1.5">
                  <button
                    onClick={() => handleQuickSwitch('ADMIN')}
                    disabled={isSubmitting}
                    className="w-full text-left p-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-600 text-xs flex items-center justify-between group transition-all"
                  >
                    <div>
                      <strong className="text-white block group-hover:text-rose-300">1. Managing Director / Admin</strong>
                      <span className="text-[10px] text-slate-400">Alhaji Shehu Bello (Executive Authority &amp; RBAC Control)</span>
                    </div>
                    <span className="text-[10px] font-bold text-rose-400">&rarr;</span>
                  </button>

                  <button
                    onClick={() => handleQuickSwitch('MANAGER')}
                    disabled={isSubmitting}
                    className="w-full text-left p-2 rounded-xl bg-slate-950 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-600 text-xs flex items-center justify-between group transition-all"
                  >
                    <div>
                      <strong className="text-white block group-hover:text-purple-300">2. Manager Terminal</strong>
                      <span className="text-[10px] text-slate-400">Engr. Sanusi Kalambaina (Order &amp; Stock Approvals)</span>
                    </div>
                    <span className="text-[10px] font-bold text-purple-400">&rarr;</span>
                  </button>

                  <button
                    onClick={() => handleQuickSwitch('ASSISTANT_MANAGER')}
                    disabled={isSubmitting}
                    className="w-full text-left p-2 rounded-xl bg-slate-950 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-600 text-xs flex items-center justify-between group transition-all"
                  >
                    <div>
                      <strong className="text-white block group-hover:text-indigo-300">2. Assistant Manager</strong>
                      <span className="text-[10px] text-slate-400">Fatima Aliyu (Queue &amp; Document Review)</span>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-400">&rarr;</span>
                  </button>

                  

                  <button
                    onClick={() => handleQuickSwitch('AGENT')}
                    disabled={isSubmitting}
                    className="w-full text-left p-2 rounded-xl bg-slate-950 hover:bg-teal-950/40 border border-slate-800 hover:border-teal-600 text-xs flex items-center justify-between group transition-all"
                  >
                    <div>
                      <strong className="text-white block group-hover:text-teal-300">4. Agent (Production Site)</strong>
                      <span className="text-[10px] text-slate-400">Haruna Danladi (Truck Issuance &amp; Gate Pass)</span>
                    </div>
                    <span className="text-[10px] font-bold text-teal-400">&rarr;</span>
                  </button>

                  <button
                    onClick={() => handleQuickSwitch('CUSTOMER')}
                    disabled={isSubmitting}
                    className="w-full text-left p-2 rounded-xl bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-600 text-xs flex items-center justify-between group transition-all"
                  >
                    <div>
                      <strong className="text-white block group-hover:text-emerald-300">5. Customer Facing Portal</strong>
                      <span className="text-[10px] text-slate-400">Alhaji Mukhtar Dan-Kano (Wholesale Buyer)</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400">&rarr;</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleManualLogin} className="space-y-2.5">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Work Email / Account
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="manager@aamaster.ng"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Password / PIN
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-extrabold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md mt-1"
                >
                  <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Terminal'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Secure RBAC Session
        </span>
        {user && (
          <button
            onClick={() => logout()}
            className="hover:text-rose-400 flex items-center gap-1 transition-colors"
          >
            <LogOut className="w-3 h-3" /> Sign Out
          </button>
        )}
      </div>
    </div>
  );
};
