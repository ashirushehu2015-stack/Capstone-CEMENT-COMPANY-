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
  ArrowRight
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

  const handleQuickRole = async (role: UserRole) => {
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
      setErrorMessage('Failed to authenticate staff role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0b1b36] border border-blue-900/60 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl text-slate-100 font-sans">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#071329] via-[#0b214a] to-[#071329] p-5 border-b border-blue-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                  INTERNAL TERMINAL
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  RBAC Secure
                </span>
              </div>
              <h3 className="text-base font-black text-white font-['Plus_Jakarta_Sans'] mt-0.5">
                Staff &amp; Operational Login
              </h3>
              <p className="text-[11px] text-blue-200/80">
                A.A. Master Nig. Limited — Kalambaina Plant
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

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

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

          {/* Quick Staff Persona Switcher (For Internal Plant Personnel) */}
          <div className="pt-3 border-t border-blue-900/40 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider text-center">
              Plant Operational Desks (Authorized Personnel)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickRole('MANAGER')}
                className="p-2 rounded-xl bg-[#071329] hover:bg-[#0d234a] border border-blue-900/50 hover:border-blue-600 text-left transition-all group"
              >
                <strong className="text-[10px] text-white block group-hover:text-amber-300 truncate">
                  Engr. Sanusi
                </strong>
                <span className="text-[9px] text-purple-300 font-semibold block">Manager</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('ASSISTANT_MANAGER')}
                className="p-2 rounded-xl bg-[#071329] hover:bg-[#0d234a] border border-blue-900/50 hover:border-blue-600 text-left transition-all group"
              >
                <strong className="text-[10px] text-white block group-hover:text-amber-300 truncate">
                  Fatima Aliyu
                </strong>
                <span className="text-[9px] text-indigo-300 font-semibold block">Asst. Mgr</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRole('AGENT')}
                className="p-2 rounded-xl bg-[#071329] hover:bg-[#0d234a] border border-blue-900/50 hover:border-blue-600 text-left transition-all group"
              >
                <strong className="text-[10px] text-white block group-hover:text-amber-300 truncate">
                  Haruna Danladi
                </strong>
                <span className="text-[9px] text-teal-300 font-semibold block">Issuing Agent</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#050e1f] px-5 py-2.5 border-t border-blue-900/40 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Separation of Duties Enforced
          </span>
          <span className="text-amber-400 font-mono">Kalambaina Kiln Operations</span>
        </div>
      </div>
    </div>
  );
};
