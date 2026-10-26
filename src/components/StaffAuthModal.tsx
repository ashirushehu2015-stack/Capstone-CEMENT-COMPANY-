import React, { useState } from 'react';
import {
  Lock,
  User,
  ShieldCheck,
  CheckCircle2,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Truck,
  FileCheck2,
  KeyRound
} from 'lucide-react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext.tsx';
import type { UserRole } from '../types/index.ts';

interface StaffAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StaffAuthModal: React.FC<StaffAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, switchUserRoleDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState<'rbac_picker' | 'manual'>('rbac_picker');

  if (!isOpen) return null;

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed. Please verify credentials.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectRole = async (role: UserRole) => {
    setErrorMessage('');
    setIsSubmitting(true);
    const creds = DEMO_ACCOUNTS[role];
    if (creds) {
      setEmail(creds.email);
      setPassword(creds.pass);
    }
    try {
      await switchUserRoleDemo(role);
      onSuccess();
      onClose();
    } catch {
      setErrorMessage('Failed to authenticate into selected role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b1b36] border border-blue-900/60 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-slate-100 font-sans">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#071329] via-[#0b214a] to-[#071329] p-5 border-b border-blue-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                  RBAC ACCESS GATEWAY
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Tripartite Policy Active
                </span>
              </div>
              <h3 className="text-base font-black text-white font-['Plus_Jakarta_Sans'] mt-0.5">
                Staff &amp; Operations Terminal
              </h3>
              <p className="text-[11px] text-blue-200/80">
                A.A. Master Nig. Limited — Kalambaina Plant RBAC Enforcement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-[#071738] text-xs font-bold border-b border-blue-900/40">
          <button
            type="button"
            onClick={() => {
              setAuthMode('rbac_picker');
              setErrorMessage('');
            }}
            className={`py-1.5 px-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'rbac_picker'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Select Operational Role (RBAC)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('manual');
              setErrorMessage('');
            }}
            className={`py-1.5 px-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 ${
              authMode === 'manual'
                ? 'bg-blue-600 text-white font-black shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Enter Staff Credentials</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {authMode === 'rbac_picker' ? (
            /* ================= 3 ROLE SELECTOR CARDS ================= */
            <div className="space-y-3">
              <p className="text-xs text-slate-300">
                Select your designated plant operational authority to enter your customized RBAC dashboard:
              </p>

              {/* 1. DEPOT MANAGER */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSelectRole('MANAGER')}
                className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-800/60 hover:border-purple-400 transition-all group flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-purple-900/80 text-purple-200 border border-purple-700">
                      1. DEPOT MANAGER
                    </span>
                    <span className="text-[10px] text-purple-300 font-mono">manager@aamaster.ng</span>
                  </div>
                  <strong className="text-sm text-white font-bold block group-hover:text-purple-300">
                    Engr. Sanusi Kalambaina
                  </strong>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    <strong>Mandate:</strong> Executive order approval/rejection authority, Zenith Bank payment validation, stock intake final verification, and staff RBAC governance.
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-purple-900/60 flex items-center justify-center text-purple-300 shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-all mt-1">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* 2. ASSISTANT MANAGER */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSelectRole('ASSISTANT_MANAGER')}
                className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-800/60 hover:border-indigo-400 transition-all group flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-indigo-900/80 text-indigo-200 border border-indigo-700">
                      2. ASSISTANT MANAGER
                    </span>
                    <span className="text-[10px] text-indigo-300 font-mono">assistant@aamaster.ng</span>
                  </div>
                  <strong className="text-sm text-white font-bold block group-hover:text-indigo-300">
                    Fatima Aliyu
                  </strong>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    <strong>Mandate:</strong> Order queue verification, wholesale documentation audit, physical stock intake tallying, and authorizer ledger oversight.
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-indigo-900/60 flex items-center justify-center text-indigo-300 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all mt-1">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* 3. SALES & ISSUING AGENT */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSelectRole('AGENT')}
                className="w-full text-left p-3.5 rounded-2xl bg-gradient-to-r from-teal-950/40 to-slate-900 border border-teal-800/60 hover:border-teal-400 transition-all group flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded bg-teal-900/80 text-teal-200 border border-teal-700">
                      3. SALES &amp; ISSUING AGENT
                    </span>
                    <span className="text-[10px] text-teal-300 font-mono">agent@aamaster.ng</span>
                  </div>
                  <strong className="text-sm text-white font-bold block group-hover:text-teal-300">
                    Haruna Danladi
                  </strong>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    <strong>Mandate:</strong> Kalambaina Plant loading bay weighbridge operations, truck &amp; trailer bed registration recording, and 600-bag gate pass issuance.
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-teal-900/60 flex items-center justify-center text-teal-300 shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-all mt-1">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          ) : (
            /* ================= MANUAL CREDENTIAL FORM ================= */
            <form onSubmit={handleManualLogin} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Official Staff Work Email <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@aamaster.ng"
                    required
                    className="w-full bg-[#050e1f] border border-blue-900/70 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-medium"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">
                    Password <span className="text-amber-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-blue-300 hover:text-white flex items-center gap-1 font-semibold"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-[#050e1f] border border-blue-900/70 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 disabled:opacity-50 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 mt-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Operations Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#050e1f] px-5 py-2.5 border-t border-blue-900/40 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Strict Separation of Duties: Dual Control
          </span>
          <span className="text-amber-400 font-mono">Kalambaina Kiln Operations</span>
        </div>
      </div>
    </div>
  );
};
