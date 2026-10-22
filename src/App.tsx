import React, { useState, useEffect } from 'react';
import {
  Building2,
  Truck,
  ShieldCheck,
  Calculator,
  Search,
  CheckCircle2,
  ShoppingBag,
  Award,
  Layers,
  MapPin,
  PhoneCall,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
  FileText,
  Plus,
  Minus,
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  AlertCircle,
  FileCheck2,
  DollarSign
} from 'lucide-react';
import { AuthProvider, useAuth, DEMO_ACCOUNTS } from './context/AuthContext.tsx';
import { CartProvider, useCart } from './context/CartContext.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { CalculatorModal } from './components/CalculatorModal.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { OrderReceiptModal } from './components/OrderReceiptModal.tsx';
import { OrderTrackerModal } from './components/OrderTrackerModal.tsx';
import { StaffDashboard } from './components/StaffDashboard.tsx';
import { apiProducts, apiReports } from './services/api.ts';
import type { Product, Order, BusinessSettings, UserRole } from './types/index.ts';

function StorefrontContent() {
  const { user, login, logout, switchUserRoleDemo, isStaff } = useAuth();
  const { addItem, totalTrailers, setIsCartOpen } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [viewSpecsProduct, setViewSpecsProduct] = useState<Product | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // View state: 'store' or 'dashboard'
  const [activeView, setActiveView] = useState<'store' | 'dashboard'>('store');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live clock
  const [currentTime, setCurrentTime] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, settingsRes] = await Promise.all([
        apiProducts.getAll(),
        apiReports.getSettings().catch(() => ({ settings: null })),
      ]);
      setProducts(prodRes.products);
      if (settingsRes?.settings) setSettings(settingsRes.settings);
    } catch (e) {
      console.error('Failed to load initial data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
      setLoginError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickRoleSelect = async (role: UserRole) => {
    setLoginError('');
    setIsSubmitting(true);
    const demo = DEMO_ACCOUNTS[role];
    if (demo) {
      setLoginEmail(demo.email);
      setLoginPassword(demo.pass);
    }
    try {
      await switchUserRoleDemo(role);
    } catch {
      setLoginError('Failed to authenticate demo account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const primaryProduct = products[0];

  const handleQuickOrderDirect = () => {
    if (primaryProduct) {
      addItem(primaryProduct, 1);
      setIsCheckoutOpen(true);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#040914] text-slate-100 font-sans flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      
      {/* 1. TOP STATUS & NAVIGATION BAR (Dark navy with amber operational badge) */}
      <header className="bg-[#060e1d] border-b border-blue-900/40 text-xs py-2 px-4 sm:px-6 shrink-0 z-30">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Operational Status & System Version & Address */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <span className="bg-amber-500 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded tracking-wider uppercase flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
              OPERATIONAL 24/7
            </span>
            <span className="font-extrabold text-white text-xs tracking-wide">
              A.A. MASTER NIG. LTD V4.2
            </span>
            <span className="text-slate-400 hidden lg:inline">|</span>
            <span className="text-slate-300 hidden md:flex items-center gap-1 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              P. O. Box 746, Canteen Area, Gusau, Zamfara State
            </span>
          </div>

          {/* Right: Hotline, Utility Shortcuts, Live Clock */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <a
              href="tel:08036172280"
              className="bg-[#0b1f3f] hover:bg-[#122e5a] text-blue-200 border border-blue-700/50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-mono font-bold transition-colors"
            >
              <PhoneCall className="w-3 h-3 text-emerald-400" />
              <span>080-36172280</span>
            </a>

            <button
              onClick={() => setIsCalculatorOpen(true)}
              className="bg-[#0b1f3f] hover:bg-[#122e5a] text-blue-200 border border-blue-700/50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Trailer Estimator</span>
            </button>

            <button
              onClick={() => setIsTrackerOpen(true)}
              className="bg-[#0b1f3f] hover:bg-[#122e5a] text-blue-200 border border-blue-700/50 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-medium transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Track Waybill</span>
            </button>

            <button
              onClick={handleQuickOrderDirect}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-lg flex items-center gap-1.5 text-xs shadow-md transition-all active:scale-95"
            >
              <Truck className="w-3.5 h-3.5 text-slate-950" />
              <span>Order Trailer (600 Bags)</span>
            </button>

            <div className="text-slate-300 font-mono text-xs flex items-center gap-1 pl-1 border-l border-slate-700/60">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentTime}</span>
            </div>
          </div>
        </div>
      </header>

      {/* RENDER VIEW: STAFF LOGISTICS PORTAL OR SPLIT LANDING PAGE */}
      {activeView === 'dashboard' && isStaff ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <StaffDashboard
            onClose={() => setActiveView('store')}
            onViewOrderReceipt={(order) => setReceiptOrder(order)}
          />
        </div>
      ) : (
        /* 2. SPLIT SCREEN LANDING: Left Brand Presentation + Right Clean Login Card */
        <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: Circular Brand Crest, Mandate, & Highlights */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 bg-gradient-to-b from-[#071329] via-[#091b3b] to-[#040a18] p-4 sm:p-6 lg:p-8 flex flex-col justify-center items-center text-center relative overflow-hidden border-r border-blue-900/30">
            {/* Subtle radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(37,99,235,0.18),transparent_65%)] pointer-events-none" />

            <div className="max-w-xl w-full mx-auto space-y-4 sm:space-y-5 z-10 flex flex-col items-center">
              
              {/* Circular Emblem / Crest */}
              <div className="relative group">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-blue-400/40 bg-[#081b3d] shadow-[0_0_50px_rgba(37,99,235,0.35)] flex items-center justify-center p-3 relative">
                  {/* Dashed secondary ring */}
                  <div className="absolute inset-2 rounded-full border-2 border-dashed border-blue-300/30 animate-[spin_60s_linear_infinite]" />
                  
                  {/* Inner logo artwork */}
                  <div className="w-full h-full rounded-full bg-white flex flex-col items-center justify-center p-1.5 shadow-inner overflow-hidden border-2 border-red-600/60">
                    <img
                      src="/assets/aistudio/image_8da756cd.png"
                      alt="A.A. MASTER NIG. LIMITED"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Main Headline */}
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase font-['Plus_Jakarta_Sans']">
                  A. A. MASTER <span className="text-amber-400">NIG. LIMITED</span>
                </h1>
                <p className="text-xs sm:text-sm text-blue-300 italic font-semibold">
                  General Merchant &amp; Supplier
                </p>
              </div>

              {/* Address Badge Pill */}
              <div className="inline-flex items-center gap-1.5 bg-[#0e2754]/80 border border-blue-500/40 px-3.5 py-1 rounded-full text-[11px] sm:text-xs text-blue-100 font-medium shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span>NO. 746, CANTEEN AREA, GUSAU, ZAMFARA STATE</span>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
                Exclusive Authorized Merchant for authentic <strong className="text-white">Sokoto Cement (Kalambaina Plant)</strong> trailers (600 standard 50kg bags / 30 metric tonnes). Orders placed via the <strong className="text-amber-400">Customer Facing Portal</strong>, verified by the <strong className="text-white">Cashier</strong>, checked by the <strong className="text-white">Assistant Manager</strong>, authorized by the <strong className="text-white">Manager</strong>, and physically issued at the production site by the <strong className="text-white">Agent</strong>.
              </p>

              {/* 3 Key Metric Highlight Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-lg pt-1">
                <div className="bg-[#0b214a]/70 border border-blue-700/50 rounded-2xl p-2.5 sm:p-3 text-center shadow-lg">
                  <span className="text-base sm:text-xl font-black text-amber-400 font-mono block">
                    600 Bags
                  </span>
                  <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider block mt-0.5">
                    30T Per Trailer
                  </span>
                </div>

                <div className="bg-[#0b214a]/70 border border-blue-700/50 rounded-2xl p-2.5 sm:p-3 text-center shadow-lg">
                  <span className="text-base sm:text-xl font-black text-emerald-400 font-mono block">
                    ₦10,850
                  </span>
                  <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider block mt-0.5">
                    Fixed Price / Bag
                  </span>
                </div>

                <div className="bg-[#0b214a]/70 border border-blue-700/50 rounded-2xl p-2.5 sm:p-3 text-center shadow-lg">
                  <span className="text-base sm:text-xl font-black text-white font-mono block">
                    ₦6,510,000
                  </span>
                  <span className="text-[10px] text-blue-200 font-bold uppercase tracking-wider block mt-0.5">
                    Per Full Trailer
                  </span>
                </div>
              </div>

              {/* Feature Pills showing the exact system workflow */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] max-w-lg pt-1">
                <span className="bg-[#0d2857]/80 text-blue-200 border border-blue-600/40 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Cashier: 100% Upfront Settlement
                </span>
                <span className="bg-[#0d2857]/80 text-blue-200 border border-blue-600/40 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" /> Asst. Mgr: Queue Verification
                </span>
                <span className="bg-[#0d2857]/80 text-blue-200 border border-blue-600/40 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Manager: Order Approval
                </span>
                <span className="bg-[#0d2857]/80 text-blue-200 border border-blue-600/40 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-teal-400" /> Agent: Production Site Issuance
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Light Background with Centered Login Card   */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 bg-[#eef3f9] p-4 sm:p-6 lg:p-8 flex items-center justify-center overflow-y-auto">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col justify-between">
              
              {/* Card Header (Deep Blue with live badge) */}
              <div className="bg-[#0b224d] text-white p-4 sm:p-5">
                <div className="flex items-center justify-between text-[11px] text-blue-200 font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-amber-400 uppercase tracking-wider font-bold">
                    <ShieldCheck className="w-4 h-4 text-amber-400" /> AUTHORIZED STAFF TERMINAL
                  </span>
                  <span className="font-mono text-slate-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-300" /> {currentTime}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  Sign In to Logistics Portal
                </h2>
                <p className="text-xs text-blue-200/80 mt-0.5">
                  A.A. Master Nig. Limited Management &amp; Dispatch System
                </p>
              </div>

              {/* Card Content Form */}
              <div className="p-5 sm:p-6 space-y-4">
                
                {loginError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* If Logged In: Show Active Session with Direct Access */}
                {user ? (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-blue-900 text-white px-2 py-0.5 rounded">
                          {user.role}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
                        </span>
                      </div>
                      <div>
                        <strong className="text-sm text-slate-900 block font-bold">{user.fullName}</strong>
                        <span className="text-xs text-slate-600 font-mono">{user.email}</span>
                      </div>
                    </div>

                    {isStaff ? (
                      <button
                        onClick={() => setActiveView('dashboard')}
                        className="w-full bg-[#0052cc] hover:bg-[#0043a8] text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all active:scale-95"
                      >
                        <Layers className="w-4 h-4" />
                        <span>Enter Staff Logistics Portal ({user.role})</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleQuickOrderDirect}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition-all active:scale-95"
                      >
                        <Truck className="w-4 h-4" />
                        <span>Place 600-Bag Trailer Order Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => logout()}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                      <button
                        onClick={() => handleQuickRoleSelect('CUSTOMER')}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        Switch to Buyer View
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Form Inputs */
                  <form onSubmit={handleManualLogin} className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Staff Username or Account Email
                      </label>
                      <input
                        type="text"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="manager@aamaster.ng"
                        required
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">Password</label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-xs text-blue-700 hover:underline flex items-center gap-1 font-semibold"
                        >
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{showPassword ? 'Hide' : 'Show'}</span>
                        </button>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#0052cc] hover:bg-[#0043a8] disabled:opacity-50 text-white font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Logistics System'}</span>
                    </button>
                  </form>
                )}

                {/* Exactly 4 Staff Roles: Manager, Assistant Manager, Cashier, Agent (Production Site) */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700 flex items-center gap-1 uppercase tracking-wider text-[10px]">
                      <User className="w-3.5 h-3.5 text-blue-700" /> SYSTEM STAFF ROLES (CLICK TO FILL)
                    </span>
                    <span className="font-mono text-slate-400 text-[10px]">Production Site &amp; Desk</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-left">
                    {/* 1. MANAGER */}
                    <button
                      onClick={() => handleQuickRoleSelect('MANAGER')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        user?.role === 'MANAGER'
                          ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-500'
                          : 'bg-slate-50 hover:bg-blue-50/50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <strong className="text-xs text-slate-900 block font-bold leading-tight flex items-center justify-between">
                        <span>Engr. Sanusi Kalambaina</span>
                        {user?.role === 'MANAGER' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                      </strong>
                      <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">1. Manager (Approval)</span>
                      <span className="text-[9px] text-slate-500 block">Overall stock approval &amp; reservation</span>
                    </button>

                    {/* 2. ASSISTANT MANAGER */}
                    <button
                      onClick={() => handleQuickRoleSelect('ASSISTANT_MANAGER')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        user?.role === 'ASSISTANT_MANAGER'
                          ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-500'
                          : 'bg-slate-50 hover:bg-blue-50/50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <strong className="text-xs text-slate-900 block font-bold leading-tight flex items-center justify-between">
                        <span>Fatima Aliyu</span>
                        {user?.role === 'ASSISTANT_MANAGER' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                      </strong>
                      <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">2. Assistant Manager</span>
                      <span className="text-[9px] text-slate-500 block">Queue &amp; document verification</span>
                    </button>

                    {/* 3. CASHIER */}
                    <button
                      onClick={() => handleQuickRoleSelect('CASHIER')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        user?.role === 'CASHIER'
                          ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-500'
                          : 'bg-slate-50 hover:bg-blue-50/50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <strong className="text-xs text-slate-900 block font-bold leading-tight flex items-center justify-between">
                        <span>Abubakar Garba</span>
                        {user?.role === 'CASHIER' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                      </strong>
                      <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">3. Cashier (Accounts)</span>
                      <span className="text-[9px] text-slate-500 block">100% upfront bank reconciliation</span>
                    </button>

                    {/* 4. AGENT (Production Site) */}
                    <button
                      onClick={() => handleQuickRoleSelect('AGENT')}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        user?.role === 'AGENT'
                          ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-500'
                          : 'bg-slate-50 hover:bg-blue-50/50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <strong className="text-xs text-slate-900 block font-bold leading-tight flex items-center justify-between">
                        <span>Haruna Danladi</span>
                        {user?.role === 'AGENT' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                      </strong>
                      <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">4. Agent (Production Site)</span>
                      <span className="text-[9px] text-slate-500 block">Physical stock issuance &amp; gate pass</span>
                    </button>
                  </div>

                  {/* Customer Facing Portal Option */}
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-medium">Ordering Cement as a Contractor?</span>
                    <button
                      onClick={() => handleQuickRoleSelect('CUSTOMER')}
                      className={`text-xs font-bold px-3 py-1 rounded-lg border transition-all ${
                        user?.role === 'CUSTOMER'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-1 ring-emerald-500'
                          : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Customer Facing Portal &rarr;
                    </button>
                  </div>
                </div>

                {/* Protected Badge Note */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center text-[10px] text-slate-500 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Protected under Nigerian Industrial Standards &amp; Corporate Logistics Guidelines.</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* 3. SUB-FOOTER BAR (Addresses & Corporate Contacts) */}
      <div className="bg-[#060e1d] border-t border-blue-950 text-slate-400 text-xs py-2 px-4 sm:px-6 shrink-0 z-30">
        <div className="max-w-[1700px] mx-auto flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-bold text-white uppercase">NO. 746, CANTEEN AREA, GUSAU, ZAMFARA STATE</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300 font-mono text-[11px]">
            <span className="flex items-center gap-1">
              <PhoneCall className="w-3 h-3 text-emerald-400" /> 080-36172280
            </span>
            <span>•</span>
            <span>080-82111063</span>
            <span>•</span>
            <span>080-68806113</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Kalambaina Plant Kiln Line Direct • Sokoto State
          </div>
        </div>
      </div>

      {/* 4. VERY BOTTOM FOOTER STRIP */}
      <footer className="bg-[#03060d] text-[10px] text-slate-400 py-1.5 px-4 sm:px-6 shrink-0 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2">
        <span>&copy; {new Date().getFullYear()} A. A. MASTER NIG. LIMITED - All rights reserved.</span>
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-bold">Wholesale Sokoto Cement Haulage</span>
          <span>|</span>
          <span className="text-emerald-400 font-mono">600 Bags (30 Metric Tonnes) Per Trailer</span>
        </div>
      </footer>

      {/* Global Modals & Drawers */}
      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={(order) => {
          setReceiptOrder(order);
        }}
      />

      <ProductDetailModal
        product={viewSpecsProduct}
        onClose={() => setViewSpecsProduct(null)}
      />

      <CalculatorModal
        products={products}
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        onViewReceipt={(order) => setReceiptOrder(order)}
      />

      <OrderReceiptModal
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <StorefrontContent />
      </CartProvider>
    </AuthProvider>
  );
}
