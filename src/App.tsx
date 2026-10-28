import React, { useState, useEffect } from 'react';
import {
  Building2,
  Truck,
  ShieldCheck,
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
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { OrderReceiptModal } from './components/OrderReceiptModal.tsx';
import { OrderTrackerModal } from './components/OrderTrackerModal.tsx';
import { StaffDashboard } from './components/StaffDashboard.tsx';
import { StaffAuthModal } from './components/StaffAuthModal.tsx';
import { CustomerPortal } from './components/CustomerPortal.tsx';
import { apiProducts, apiReports } from './services/api.ts';
import type { Product, Order, BusinessSettings, UserRole } from './types/index.ts';

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'prod_sokoto_425r',
    sku: 'AAM-SKT-600',
    name: 'Sokoto Cement (Full Truck - 600 Bags)',
    brand: 'Sokoto Cement',
    grade: '42.5R',
    bagWeightKg: 50,
    bagsPerTrailer: 600,
    tonnesPerTrailer: 30,
    trailerWeightTonnes: 30,
    pricePerBag: 10850,
    pricePerTrailer: 6510000,
    pricePerBagEquivalent: 10850,
    costPerBagBasis: 9500,
    costPerTrailerBasis: 5700000,
    physicalStockBags: 30000,
    reservedStockBags: 1800,
    stockOnHoldBags: 0,
    availableStockBags: 28200,
    availableTrailers: 47,
    reservedTrailers: 3,
    reorderLevelTrailers: 10,
    reorderThresholdTrailers: 10,

    minOrderTrailers: 1,
    minimumOrderTrailers: 1,
    maxOrderTrailers: 100,
    description:
      'Direct factory trailer load of authentic Sokoto Cement (Kalambaina Plant). Standard high-strength formulation engineered for multi-story structural casting, foundations, highway works, and general commercial construction. Supplied in full 30-tonne (600-bag) articulated factory trailer loads.',
    applications: [
      'High-Rise Structural Columns & Beams',
      'Reinforced Concrete Decking & Slabs',
      'Bridge & Highway Culvert Construction',
      'Heavy Pre-cast Concrete & Block Molding',
    ],
    features: [
      'Direct from Kalambaina Plant Kiln Line',
      '30 Metric Tonnes net payload (600 standard 50kg bags)',
      '28-day target compressive strength exceeds 42.5 MPa',
      'Official NIS 444-1:2018 Certified with SON Quality Mark',
    ],
    certification: 'SON Mandatory Conformity Assessment Programme (MANCAP) — NIS 444-1:2014 Certified',
    imageUrl: '/assets/aistudio/image_8da756cd.png',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function StorefrontContent() {
  const { user, login, register, logout, switchUserRoleDemo, isStaff } = useAuth();
  const { addItem, setSingleItem, totalTrailers, setIsCartOpen } = useCart();

  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [orderRefreshKey, setOrderRefreshKey] = useState(0);

  // Modals
  const [viewSpecsProduct, setViewSpecsProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isStaffAuthModalOpen, setIsStaffAuthModalOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // View state: 'landing' (single unscrollable), 'customer_portal' (full buyer experience), or 'dashboard' (staff logistics)
  const [activeView, setActiveView] = useState<'landing' | 'customer_portal' | 'dashboard'>('landing');

  // Landing Card Portal & Auth state
  const [customerAuthMode, setCustomerAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Customer Registration Form State
  const [regFullName, setRegFullName] = useState('');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('Sokoto');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

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
      if (prodRes?.products && prodRes.products.length > 0) {
        setProducts(prodRes.products);
      }
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

  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
      setActiveView('customer_portal');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid customer credentials. Please try again.';
      setLoginError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (regPassword.length < 6) {
      setLoginError('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setLoginError('Passwords do not match.');
      return;
    }
    if (regPhone.trim().length < 10) {
      setLoginError('Please enter a valid Nigerian telephone number (min 10 digits).');
      return;
    }
    setIsSubmitting(true);
    try {
      await register({
        fullName: regFullName.trim(),
        companyName: regCompanyName.trim() || undefined,
        email: regEmail.trim(),
        phone: regPhone.trim(),
        city: regCity.trim() || undefined,
        state: regState.trim() || undefined,
        address: regAddress.trim() || undefined,
        password: regPassword,
      });
      setActiveView('customer_portal');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please check your details.';
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
      setSingleItem(primaryProduct, 1);
      setIsCheckoutOpen(true);
    }
  };

  const handleOpenCustomerPortal = () => {
    setActiveView('customer_portal');
  };

  return (
    <div className={`w-screen ${activeView === 'landing' ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-[#040914] text-slate-100 font-sans flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950`}>
      
      {/* 1. TOP STATUS & NAVIGATION BAR (Only on Landing Screen so Customer Portal & Staff Dashboard have no duplicate header) */}
      {activeView === 'landing' && (
        <header className="bg-[#060e1d] border-b border-blue-900/40 text-xs py-2 px-4 sm:px-6 shrink-0 z-30 print:hidden">
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

              <div className="text-slate-300 font-mono text-xs flex items-center gap-1 pl-1 border-l border-slate-700/60">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentTime}</span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* RENDER VIEW: STAFF LOGISTICS PORTAL, CUSTOMER FACING PORTAL, OR SPLIT LANDING PAGE */}
      <div className="flex-1 min-h-0 flex flex-col print:hidden">
      {activeView === 'dashboard' && isStaff ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <StaffDashboard
            onClose={() => setActiveView('landing')}
            onViewOrderReceipt={(order) => setReceiptOrder(order)}
          />
        </div>
      ) : activeView === 'customer_portal' ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <CustomerPortal
            products={products}
            settings={settings}
            orderRefreshKey={orderRefreshKey}
            onOpenCheckout={() => setIsCheckoutOpen(true)}
            onOpenTracker={() => setIsTrackerOpen(true)}
            onViewOrderReceipt={(order) => setReceiptOrder(order)}
            onViewSpecs={(product) => setViewSpecsProduct(product)}
            onReturnToLanding={() => setActiveView('landing')}
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
                Exclusive Authorized Merchant for authentic <strong className="text-white">Sokoto Cement (Kalambaina Plant)</strong> trailers (600 standard 50kg bags / 30 metric tonnes). Orders placed via the <strong className="text-amber-400">Customer Facing Portal</strong>, checked by the <strong className="text-white">Assistant Manager</strong>, authorized & payment-verified by the <strong className="text-white">Manager</strong>, and physically issued at the production site by the <strong className="text-white">Issuing Agent</strong>.
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
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> 100% Upfront Wire / Settlement
                </span>
                <span className="bg-[#0d2857]/80 text-blue-200 border border-blue-600/40 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" /> Asst. Mgr: Queue Verification
                </span>
                <span className="bg-[#0d2857]/80 text-blue-200 border border-blue-600/40 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Manager: Approval & Verification
                </span>
                <span className="bg-[#0d2857]/80 text-blue-200 border border-blue-600/40 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-teal-400" /> Agent: Production Site Issuance
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Light Background with Centered Auth Card    */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 bg-[#eef3f9] p-3 sm:p-4 lg:p-6 flex items-center justify-center overflow-y-auto">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col justify-between max-h-[calc(100vh-120px)]">
              
              {/* Card Header (Deep Blue with live badge) */}
              <div className="bg-[#0b224d] text-white p-3.5 sm:p-4">
                <div className="flex items-center justify-between text-[11px] text-blue-200 font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-amber-400 uppercase tracking-wider font-bold">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    WHOLESALE BUYER ACCESS
                  </span>
                  <span className="font-mono text-slate-300 flex items-center gap-1 text-[10px]">
                    <Clock className="w-3.5 h-3.5 text-blue-300" /> {currentTime}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  Wholesale Customer Portal
                </h2>
                <p className="text-[11px] text-blue-200/80 mt-0.5">
                  A.A. Master Nig. Limited • Authorized Contractor &amp; Buyer Sign In
                </p>
              </div>

              {/* Sub-tabs: Customer Login vs Register (when not logged in as customer) */}
              {!(user && user.role === 'CUSTOMER') && (
                <div className="grid grid-cols-2 p-1.5 bg-[#071738] text-xs font-bold border-b border-blue-900/40">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerAuthMode('login');
                      setLoginError('');
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 ${
                      customerAuthMode === 'login'
                        ? 'bg-amber-500 text-slate-950 font-black shadow'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Customer Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerAuthMode('register');
                      setLoginError('');
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 ${
                      customerAuthMode === 'register'
                        ? 'bg-amber-500 text-slate-950 font-black shadow'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Create Account</span>
                  </button>
                </div>
              )}

              {/* Card Content Form Area */}
              <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
                
                {loginError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* If Logged In as CUSTOMER: Show Active Session */}
                {user && user.role === 'CUSTOMER' ? (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded font-mono">
                          Verified Wholesale Buyer
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
                        </span>
                      </div>
                      <div>
                        <strong className="text-sm text-slate-900 block font-bold">{user.fullName}</strong>
                        {user.companyName && (
                          <span className="text-xs text-blue-800 font-medium block">{user.companyName}</span>
                        )}
                        <span className="text-xs text-slate-600 font-mono">{user.email}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={() => setActiveView('customer_portal')}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs sm:text-sm transition-all active:scale-95"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Enter Customer Facing Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleQuickOrderDirect}
                        className="w-full bg-[#0b224d] hover:bg-[#122e61] text-amber-300 border border-blue-600/50 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                      >
                        <Truck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Order 1 Trailer Directly (₦6,510,000)</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={async () => {
                          await logout();
                          setCustomerAuthMode('login');
                        }}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                      <button
                        onClick={() => setActiveView('customer_portal')}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        Open Catalog &rarr;
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ================= CUSTOMER PORTAL AUTH ================= */
                  <div className="space-y-3">
                    {customerAuthMode === 'register' ? (
                      /* CUSTOMER REGISTRATION */
                      <form onSubmit={handleCustomerRegister} className="space-y-2.5">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Full Name / Contractor <span className="text-amber-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={regFullName}
                            onChange={(e) => setRegFullName(e.target.value)}
                            placeholder="Alhaji Mukhtar Dan-Kano"
                            required
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">
                              Email Address <span className="text-amber-500">*</span>
                            </label>
                            <input
                              type="email"
                              value={regEmail}
                              onChange={(e) => setRegEmail(e.target.value)}
                              placeholder="buyer@domain.ng"
                              required
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">
                              Phone Number <span className="text-amber-500">*</span>
                            </label>
                            <input
                              type="tel"
                              value={regPhone}
                              onChange={(e) => setRegPhone(e.target.value)}
                              placeholder="0803 123 4567"
                              required
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Address / Location</label>
                          <input
                            type="text"
                            value={regAddress}
                            onChange={(e) => setRegAddress(e.target.value)}
                            placeholder="e.g. Canteen Area, Gusau"
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">
                              Password (min 6 chars) <span className="text-amber-500">*</span>
                            </label>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="••••••"
                              required
                              minLength={6}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-700 block mb-1">
                              Confirm Password <span className="text-amber-500">*</span>
                            </label>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={regConfirmPassword}
                              onChange={(e) => setRegConfirmPassword(e.target.value)}
                              placeholder="••••••"
                              required
                              minLength={6}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 mt-1"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{isSubmitting ? 'Registering...' : 'Create Customer Account'}</span>
                        </button>
                      </form>
                    ) : (
                      /* CUSTOMER LOGIN */
                      <form onSubmit={handleCustomerLogin} className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">
                            Contractor Email / Username <span className="text-amber-500">*</span>
                          </label>
                          <input
                            type="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="buyer@domain.ng"
                            required
                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-slate-700">
                              Password <span className="text-amber-500">*</span>
                            </label>
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
                            className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                        >
                          <Lock className="w-4 h-4" />
                          <span>{isSubmitting ? 'Authenticating...' : 'Sign In as Customer'}</span>
                        </button>
                      </form>
                    )}
                  </div>
                )}

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

            </div>

      {/* 3. SUB-FOOTER BAR & BOTTOM FOOTER (Only on Landing Screen) */}
      {activeView === 'landing' && (
        <div className="print:hidden">
        <>
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

          <footer className="bg-[#03060d] text-[10px] text-slate-400 py-2 px-4 sm:px-6 shrink-0 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2">
            <span>&copy; {new Date().getFullYear()} A. A. MASTER NIG. LIMITED - All rights reserved.</span>
            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-bold">Wholesale Sokoto Cement Haulage</span>
              <span>|</span>
              <span className="text-emerald-400 font-mono">600 Bags (30 Metric Tonnes) Per Trailer</span>
              <span>|</span>
              {isStaff && (
                <>
                  <button
                    onClick={() => setActiveView('dashboard')}
                    className="bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700/80 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                    title="Open Operations Dashboard"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Operations Portal ({user?.role}) &rarr;</span>
                  </button>
                  <span>|</span>
                </>
              )}
              <button
                onClick={() => setIsStaffAuthModalOpen(true)}
                className="hover:text-amber-400 text-slate-400 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Authorized Staff &amp; Plant Operations Terminal"
              >
                <Lock className="w-3 h-3 text-amber-500" />
                <span>Staff &amp; Officer Login</span>
              </button>
            </div>
          </footer>
        </>
        </div>
      )}

      {/* Global Modals & Drawers */}
      <div className="print:hidden">
        <CartDrawer
          onProceedToCheckout={() => setIsCheckoutOpen(true)}
        />

        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderSuccess={(order) => {
            setReceiptOrder(order);
            setOrderRefreshKey((k) => k + 1);
          }}
        />

        <ProductDetailModal
          product={viewSpecsProduct}
          onClose={() => setViewSpecsProduct(null)}
        />

        <OrderTrackerModal
          isOpen={isTrackerOpen}
          onClose={() => setIsTrackerOpen(false)}
          onViewReceipt={(order) => setReceiptOrder(order)}
        />

        <StaffAuthModal
          isOpen={isStaffAuthModalOpen}
          onClose={() => setIsStaffAuthModalOpen(false)}
          onSuccess={() => setActiveView('dashboard')}
        />
      </div>

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
