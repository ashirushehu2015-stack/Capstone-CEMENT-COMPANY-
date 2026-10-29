import React, { useState, useEffect } from 'react';
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
  KeyRound,
  Building2,
  BadgeCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import type { UserRole } from '../types/index.ts';

interface StaffAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface StaffMemberProfile {
  id: string;
  role: UserRole;
  name: string;
  title: string;
  email: string;
  defaultPass: string;
  badge: string;
  theme: {
    border: string;
    badgeBg: string;
    badgeText: string;
    buttonBg: string;
    ring: string;
  };
  mandate: string;
  keyResponsibilities: string[];
}

const STAFF_PROFILES: StaffMemberProfile[] = [
  {
    id: 'staff_manager',
    role: 'MANAGER',
    name: 'Uwaisu Musa',
    title: 'Depot General Manager (Plant Executive)',
    email: 'manager@aamaster.ng',
    defaultPass: 'Manager123!',
    badge: '1. Executive Approval & Finance',
    theme: {
      border: 'border-purple-600/70',
      badgeBg: 'bg-purple-950/80 border-purple-700 text-purple-200',
      badgeText: 'text-purple-300',
      buttonBg: 'bg-gradient-to-r from-purple-700 to-purple-600 hover:from-purple-600 hover:to-purple-500',
      ring: 'ring-purple-500'
    },
    mandate: 'Executive wholesale order approval/rejection, 100% upfront Zenith Bank wire transfer validation, physical stock intake verification, and staff ledger governance.',
    keyResponsibilities: [
      'Approve / Reject Wholesale Orders',
      'Reconcile 100% Wire Payments',
      'Authorize Physical Stock Release',
      'Manage Staff RBAC Directory'
    ]
  },
  {
    id: 'staff_assistant',
    role: 'ASSISTANT_MANAGER',
    name: 'Mamuda Ahmed',
    title: 'Assistant Manager (Stock & Verification)',
    email: 'asstmanager@aamaster.ng',
    defaultPass: 'AsstManager123!',
    badge: '2. Queue Audit & Stock Intake',
    theme: {
      border: 'border-indigo-600/70',
      badgeBg: 'bg-indigo-950/80 border-indigo-700 text-indigo-200',
      badgeText: 'text-indigo-300',
      buttonBg: 'bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500',
      ring: 'ring-indigo-500'
    },
    mandate: 'Wholesale order queue triage, wholesale customer documentation audit, physical factory stock intake tallying (Sec. 2), and delivery log monitoring.',
    keyResponsibilities: [
      'Order Queue Review & Verification',
      'Log Factory Trailer Stock Intake',
      'Audit Transporter Documentation',
      'Delivery Log & Demurrage Monitoring'
    ]
  },
  {
    id: 'staff_agent',
    role: 'AGENT',
    name: 'Isiyaka Sulaiman',
    title: 'Sales & Issuing Agent (Loading Terminal)',
    email: 'agent@aamaster.ng',
    defaultPass: 'Agent123!',
    badge: '3. Loading Bay & Gate Pass',
    theme: {
      border: 'border-teal-600/70',
      badgeBg: 'bg-teal-950/80 border-teal-700 text-teal-200',
      badgeText: 'text-teal-300',
      buttonBg: 'bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500',
      ring: 'ring-teal-500'
    },
    mandate: 'Kalambaina Plant loading bay weighbridge operations, truck head & trailer bed registration recording, 600-bag truck issuance, and official gate pass issuance.',
    keyResponsibilities: [
      'Loading Bay Weighbridge Operations',
      'Truck Head & Flatbed Inspection',
      'Issue 600 Bags (30 Tonnes) Payload',
      'Official Gate Pass Authorization'
    ]
  }
];

export const StaffAuthModal: React.FC<StaffAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('MANAGER');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [customEmail, setCustomEmail] = useState('');

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // When changing selected staff, clear password and error
  const handleSelectStaff = (role: UserRole) => {
    setSelectedRole(role);
    setPassword('');
    setErrorMessage('');
  };

  if (!isOpen) return null;

  const currentProfile = STAFF_PROFILES.find((p) => p.role === selectedRole) || STAFF_PROFILES[0];

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const emailToUse = showManualForm ? customEmail.trim() : currentProfile.email;
    if (!emailToUse) {
      setErrorMessage('Please enter an official staff email.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your staff password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(emailToUse, password);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : `Authentication failed. Please verify credentials for ${currentProfile.name}.`;
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemoPassword = () => {
    setPassword(currentProfile.defaultPass);
    setErrorMessage('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0b1b36] border border-blue-900/70 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl text-slate-100 font-sans my-auto">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#071329] via-[#0b214a] to-[#071329] p-4 sm:p-5 border-b border-blue-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
              <KeyRound className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 bg-amber-950/70 border border-amber-800/60 px-2 py-0.5 rounded">
                  OFFICIAL STAFF RBAC GATEWAY
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Tripartite Separation of Duties
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white font-['Plus_Jakarta_Sans'] mt-0.5">
                Staff &amp; Operations Terminal Authentication
              </h3>
              <p className="text-[11px] text-blue-200/80">
                A.A. Master Nig. Limited — Select your staff member profile and sign with individual credentials.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {!showManualForm ? (
            <>
              {/* STEP 1: SELECT FROM THE 3 STAFF MEMBERS */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Step 1: Select Staff Member Identity <span className="text-amber-400">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Click a staff member below to authenticate</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {STAFF_PROFILES.map((profile) => {
                    const isSelected = selectedRole === profile.role;
                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => handleSelectStaff(profile.role)}
                        className={`text-left p-3 rounded-2xl border transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? `bg-slate-900/95 ${profile.theme.border} ring-2 ${profile.theme.ring} shadow-lg shadow-blue-950/50`
                            : 'bg-[#061226]/80 border-blue-950 hover:border-blue-800 hover:bg-[#081836]/90 opacity-80 hover:opacity-100'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 text-amber-400">
                            <BadgeCheck className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <span
                            className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded border inline-block mb-1.5 ${profile.theme.badgeBg}`}
                          >
                            {profile.badge}
                          </span>
                          <h4 className="text-xs sm:text-sm font-black text-white leading-tight">
                            {profile.name}
                          </h4>
                          <p className="text-[10px] text-slate-300 font-medium mt-0.5 line-clamp-1">
                            {profile.title}
                          </p>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                          <span className={profile.theme.badgeText}>{profile.email}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: INDIVIDUAL CREDENTIAL SIGN-IN FOR SELECTED STAFF */}
              <div className="bg-[#050e1f] border border-blue-900/80 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-blue-900/40">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-400 block">
                        Step 2: Sign With Individual Staff Password
                      </span>
                      <h4 className="text-sm font-black text-white">
                        Signing in as: <span className="text-amber-300">{currentProfile.name}</span> ({currentProfile.role})
                      </h4>
                    </div>
                  </div>

                  {/* Pre-fill default demo credential button */}
                  <button
                    type="button"
                    onClick={handleFillDemoPassword}
                    className="self-start sm:self-auto text-[10px] bg-blue-900/40 hover:bg-blue-800 text-blue-200 hover:text-white px-2.5 py-1 rounded-lg border border-blue-700/50 transition-colors flex items-center gap-1 font-mono"
                    title="Quickly fill the demo password for this staff member"
                  >
                    <span>Use Demo Password:</span>
                    <strong className="text-amber-400">{currentProfile.defaultPass}</strong>
                  </button>
                </div>

                {/* Mandate & Scope Reminder */}
                <div className="text-[11px] text-slate-300 bg-blue-950/40 p-2.5 rounded-xl border border-blue-900/40 space-y-1">
                  <p>
                    <strong className="text-amber-400">Authorized Mandate:</strong> {currentProfile.mandate}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {currentProfile.keyResponsibilities.map((resp, i) => (
                      <span
                        key={i}
                        className="text-[9px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-slate-300"
                      >
                        ✓ {resp}
                      </span>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleStaffLogin} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      Official Work Email (Locked)
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        value={currentProfile.email}
                        readOnly
                        className="w-full bg-[#020713] border border-blue-950 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-300 font-mono font-bold cursor-not-allowed select-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-300">
                        Individual Staff Password <span className="text-amber-400">*</span>
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
                        placeholder="Enter password..."
                        required
                        autoFocus
                        className="w-full bg-[#030914] border border-blue-900/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full ${currentProfile.theme.buttonBg} disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {isSubmitting
                        ? 'Verifying Credentials...'
                        : `Authenticate & Open ${currentProfile.name.split(' ')[0]}'s Portal`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* ALTERNATIVE: MANUAL CUSTOM EMAIL / PASSWORD */
            <div className="bg-[#050e1f] border border-blue-900/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-blue-900/40">
                <h4 className="text-sm font-black text-white">Manual Staff Sign-In</h4>
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="text-xs text-amber-400 hover:underline"
                >
                  &larr; Back to 3 Staff Profiles
                </button>
              </div>

              <form onSubmit={handleStaffLogin} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Staff Email Address <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      placeholder="e.g. manager@aamaster.ng"
                      required
                      className="w-full bg-[#030914] border border-blue-900/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-medium"
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
                      className="w-full bg-[#030914] border border-blue-900/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{isSubmitting ? 'Verifying...' : 'Sign In with Custom Credentials'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Toggle manual form link */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setShowManualForm(!showManualForm);
                setErrorMessage('');
              }}
              className="text-[11px] text-blue-300 hover:text-white hover:underline transition-colors"
            >
              {showManualForm
                ? '← Return to 3 Staff Members selection'
                : 'Signing in with a different staff / managing director account? Click here'}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#050e1f] px-5 py-3 border-t border-blue-900/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Strict Role-Based Access Control (RBAC) enforced per NIS &amp; A.A. Master Audit Guidelines</span>
          </span>
          <span className="text-amber-400 font-mono shrink-0">Kalambaina Loading Bay Terminal</span>
        </div>
      </div>
    </div>
  );
};
