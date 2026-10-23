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
  LogOut,
  AlertCircle,
  FileCheck2,
  DollarSign,
  Download,
  ExternalLink,
  ChevronRight,
  Receipt,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { apiOrders } from '../services/api.ts';
import { CustomerAuthModal } from './CustomerAuthModal.tsx';
import type { Product, Order, BusinessSettings } from '../types/index.ts';

interface CustomerPortalProps {
  products: Product[];
  settings: BusinessSettings | null;
  onOpenCheckout: () => void;
  onOpenCalculator: () => void;
  onOpenTracker: () => void;
  onViewOrderReceipt: (order: Order) => void;
  onViewSpecs: (product: Product) => void;
  onReturnToLanding: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  products,
  settings,
  onOpenCheckout,
  onOpenCalculator,
  onOpenTracker,
  onViewOrderReceipt,
  onViewSpecs,
  onReturnToLanding,
}) => {
  const { user, logout } = useAuth();
  const { addItem, totalTrailers, totalBags, totalWeightTonnes, subtotalNGN, setIsCartOpen } = useCart();

  const [activeTab, setActiveTab] = useState<'catalogue' | 'my_orders' | 'how_it_works' | 'bank_details'>('catalogue');
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [claimOrderId, setClaimOrderId] = useState<string | null>(null);
  const [bankRefInput, setBankRefInput] = useState('');
  const [payerNameInput, setPayerNameInput] = useState('');
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [selectedGradeId, setSelectedGradeId] = useState<string>(products[0]?.id || '');

  // Independent Customer Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'register' | 'login'>('register');

  const activeProduct = products.find((p) => p.id === selectedGradeId) || products[0];
  const loadOrders = async () => {
    if (!user) {
      setCustomerOrders([]);
      setIsLoadingOrders(false);
      return;
    }
    setIsLoadingOrders(true);
    try {
      const res = await apiOrders.getAll();
      setCustomerOrders(res.orders || []);
    } catch (err) {
      console.error('Failed to load customer orders', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my_orders' || user) {
      loadOrders();
    }
  }, [activeTab, user]);

  const handleOrderQuickTrailers = (product: Product, trailersCount: number) => {
    addItem(product, trailersCount);
    onOpenCheckout();
  };

  const handleClaimBankTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimOrderId || !bankRefInput.trim() || !payerNameInput.trim()) return;
    setClaimSubmitting(true);
    setClaimSuccess(null);
    try {
      await apiOrders.updateStatus(claimOrderId, {
        status: 'PAYMENT_UNDER_VERIFICATION',
        notes: `Customer submitted payment reference: ${bankRefInput} (Payer: ${payerNameInput})`,
      });
      setClaimSuccess(`Payment proof submitted for order. Cashier will reconcile shortly.`);
      setClaimOrderId(null);
      setBankRefInput('');
      setPayerNameInput('');
      loadOrders();
    } catch (err: any) {
      alert(err.message || 'Failed to submit payment claim');
    } finally {
      setClaimSubmitting(false);
    }
  };

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    PENDING_APPROVAL: { bg: 'bg-amber-950/80 border-amber-800 text-amber-300', text: 'text-amber-400', label: '1. Awaiting Manager Approval' },
    REJECTED_BY_MANAGER: { bg: 'bg-rose-950/80 border-rose-800 text-rose-300', text: 'text-rose-400', label: 'Rejected by Manager' },
    APPROVED_AWAITING_PAYMENT: { bg: 'bg-blue-950/80 border-blue-800 text-blue-300', text: 'text-blue-400', label: '2. Approved — Awaiting 100% Payment' },
    PENDING_PAYMENT: { bg: 'bg-blue-950/80 border-blue-800 text-blue-300', text: 'text-blue-400', label: '2. Approved — Awaiting 100% Payment' },
    PAYMENT_UNDER_VERIFICATION: { bg: 'bg-purple-950/80 border-purple-800 text-purple-300', text: 'text-purple-400', label: '3. Payment Under Cashier Verification' },
    PAID: { bg: 'bg-emerald-950/80 border-emerald-800 text-emerald-300', text: 'text-emerald-400', label: '4. 100% Paid — Ready for Agent Issuance' },
    CONFIRMED: { bg: 'bg-emerald-950/80 border-emerald-800 text-emerald-300', text: 'text-emerald-400', label: '4. 100% Paid — Processing' },
    PARTIALLY_ISSUED: { bg: 'bg-teal-950/80 border-teal-800 text-teal-300', text: 'text-teal-400', label: '5. Partially Issued by Agent' },
    FULLY_ISSUED: { bg: 'bg-teal-950/80 border-teal-800 text-teal-300', text: 'text-teal-400', label: '5. Fully Issued (Gate Pass Active)' },
    READY_FOR_COLLECTION: { bg: 'bg-indigo-950/80 border-indigo-800 text-indigo-300', text: 'text-indigo-400', label: 'Gate Clearance Issued' },
    DISPATCHED: { bg: 'bg-cyan-950/80 border-cyan-800 text-cyan-300', text: 'text-cyan-400', label: '6. In Transit (Trailer Convoy Dispatched)' },
    DELIVERED: { bg: 'bg-emerald-950/80 border-emerald-800 text-emerald-300', text: 'text-emerald-400', label: 'Delivered & Offloaded at Site' },
    COMPLETED: { bg: 'bg-slate-800 border-slate-700 text-slate-300', text: 'text-slate-400', label: 'Completed Order' },
    CANCELLED: { bg: 'bg-rose-950/80 border-rose-800 text-rose-300', text: 'text-rose-400', label: 'Cancelled & Stock Released' },
  };

  return (
    <div className="min-h-screen bg-[#040914] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* 1. TOP PORTAL HEADER */}
      <header className="sticky top-0 z-40 bg-[#060e1d]/95 backdrop-blur-md border-b border-blue-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
            
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('catalogue')}>
              <div className="w-11 h-11 rounded-full border-2 border-amber-400 bg-white p-1 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src="/assets/aistudio/image_8da756cd.png"
                  alt="A.A. Master Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black tracking-tight text-white uppercase font-['Plus_Jakarta_Sans']">
                    A.A. MASTER <span className="text-amber-400">NIG. LTD</span>
                  </span>
                  <span className="hidden sm:inline-block bg-blue-900/60 border border-blue-700/60 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    CUSTOMER PORTAL
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Authorized Sokoto Cement Merchant • 600 Bags / 30-Ton Trailers
                </p>
              </div>
            </div>

            {/* Middle Nav Tabs */}
            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('catalogue')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'catalogue' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Cement Catalogue
              </button>
              <button
                onClick={() => setActiveTab('my_orders')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'my_orders' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>My Orders</span>
                {customerOrders.length > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {customerOrders.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('how_it_works')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'how_it_works' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Ordering Workflow
              </button>
              <button
                onClick={() => setActiveTab('bank_details')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  activeTab === 'bank_details' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Bank Accounts
              </button>
            </nav>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={onOpenTracker}
                className="hidden lg:flex items-center gap-1.5 bg-[#0b1f3f] hover:bg-[#122e5a] text-blue-200 border border-blue-700/50 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span>Track Waybill</span>
              </button>

              <button
                onClick={onOpenCalculator}
                className="hidden lg:flex items-center gap-1.5 bg-[#0b1f3f] hover:bg-[#122e5a] text-blue-200 border border-blue-700/50 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors"
              >
                <Calculator className="w-3.5 h-3.5 text-amber-400" />
                <span>Trailer Estimator</span>
              </button>

              {/* Cart Drawer Trigger */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <ShoppingBag className="w-4 h-4 text-slate-950" />
                <span>{totalTrailers} {totalTrailers === 1 ? 'Trailer' : 'Trailers'}</span>
                {totalTrailers > 0 && (
                  <span className="hidden sm:inline font-mono font-bold">
                    (₦{subtotalNGN.toLocaleString('en-NG')})
                  </span>
                )}
              </button>

              {/* Customer Account Identity & Auth Controls */}
              {user ? (
                <div className="flex items-center gap-2 bg-[#081b3d] border border-blue-700/60 px-2.5 py-1 sm:py-1.5 rounded-xl text-xs">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs uppercase">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="leading-tight text-left hidden sm:block">
                    <span className="font-bold text-white block text-xs truncate max-w-[130px]">{user.fullName}</span>
                    <span className="text-[10px] text-blue-300 block truncate max-w-[130px]">
                      {user.companyName || user.email}
                    </span>
                  </div>
                  <button
                    onClick={() => logout()}
                    title="Sign Out of Customer Account"
                    className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition-colors ml-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setAuthModalTab('login');
                      setIsAuthModalOpen(true);
                    }}
                    className="bg-[#0b1f3f] hover:bg-[#122e5a] text-blue-200 border border-blue-700/50 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => {
                      setAuthModalTab('register');
                      setIsAuthModalOpen(true);
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-1"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Create Account</span>
                  </button>
                </div>
              )}

              {/* Staff Terminal or Back to Landing */}
              <button
                onClick={onReturnToLanding}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl font-semibold transition-colors flex items-center gap-1"
                title="Return to Main Landing & Staff Terminal"
              >
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Staff Terminal</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. SUB-BAR NOTIFICATION */}
      <div className="bg-[#0b1e3d] border-b border-blue-900/30 text-xs py-2 px-4 text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white">Kalambaina Loading Terminal Active:</span>
            <span>Fixed Factory Price ₦10,850/Bag (₦6,510,000 per 600-Bag Trailer). Minimum 1 Trailer.</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-amber-300">
            <span>Direct Kiln Line Dispatch</span>
            <span>•</span>
            <span>100% Upfront Settlement</span>
          </div>
        </div>
      </div>

      {/* 3. MAIN PORTAL BODY */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        
        {/* TAB 1: PRODUCT CATALOGUE */}
        {activeTab === 'catalogue' && (
          <div className="space-y-8">
            
            {/* Hero Banner Card */}
            <div className="relative rounded-3xl overflow-hidden border border-blue-800/40 bg-gradient-to-r from-[#071738] via-[#0b2454] to-[#08183a] p-6 sm:p-10 shadow-2xl">
              <div className="relative z-10 max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  AUTHENTIC SOKOTO CEMENT • 100% FACTORY DIRECT
                </div>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-['Plus_Jakarta_Sans']">
                  Wholesale Trailer Cement Haulage
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                  Order articulated trailer loads (600 standard 50kg bags / 30 metric tonnes) direct from the Sokoto Cement Kalambaina Plant. Strict factory pricing of <strong className="text-amber-400">₦10,850 per bag</strong> (<strong>₦6,510,000 per trailer</strong>). Certified by the Standards Organisation of Nigeria (NIS 444-1).
                </p>

                {/* 3 Value Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="bg-[#081a3d]/80 border border-blue-600/40 rounded-2xl p-3 flex items-center gap-3">
                    <Truck className="w-8 h-8 text-amber-400 shrink-0" />
                    <div>
                      <strong className="text-xs text-white block font-bold">600 Bags / 30 Tonnes</strong>
                      <span className="text-[10px] text-slate-400">Strict full-truck multiples</span>
                    </div>
                  </div>

                  <div className="bg-[#081a3d]/80 border border-blue-600/40 rounded-2xl p-3 flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-emerald-400 shrink-0" />
                    <div>
                      <strong className="text-xs text-white block font-bold">₦6,510,000 per Truck</strong>
                      <span className="text-[10px] text-slate-400">100% upfront settlement</span>
                    </div>
                  </div>

                  <div className="bg-[#081a3d]/80 border border-blue-600/40 rounded-2xl p-3 flex items-center gap-3">
                    <Award className="w-8 h-8 text-blue-400 shrink-0" />
                    <div>
                      <strong className="text-xs text-white block font-bold">Kalambaina Gate Pass</strong>
                      <span className="text-[10px] text-slate-400">Issued by verified Agent</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Bar */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      if (products[0]) handleOrderQuickTrailers(products[0], 1);
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-3 rounded-xl text-sm shadow-xl flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Truck className="w-4 h-4 text-slate-950" />
                    <span>Order 1 Trailer (₦6,510,000)</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </button>

                  <button
                    onClick={() => {
                      if (products[0]) handleOrderQuickTrailers(products[0], 2);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-3 rounded-xl text-sm shadow-lg flex items-center gap-2 transition-all active:scale-95"
                  >
                    <span>Order 2 Trailers (₦13,020,000)</span>
                  </button>

                  <button
                    onClick={onOpenCalculator}
                    className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors"
                  >
                    <Calculator className="w-4 h-4 text-amber-400" />
                    <span>Estimate Custom Convoys</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Authoritative Wholesale Trailer Procurement & Pricing Schedule */}
            <div className="bg-[#071329] rounded-3xl border border-blue-900/40 p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-blue-950 pb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                    <Receipt className="w-6 h-6 text-amber-400" />
                    <span>Authoritative Wholesale Trailer Pricing Schedule</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Fixed factory price: <strong className="text-emerald-400">₦10,850 per bag</strong> (<strong>₦6,510,000 per 600-bag trailer load / 30 metric tonnes</strong>). 100% upfront settlement required.
                  </p>
                </div>

                {/* Grade Selection Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  {products.map((p) => {
                    const isSelected = (selectedGradeId || products[0]?.id) === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedGradeId(p.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-1 ring-amber-400'
                            : 'bg-[#091d3f] text-slate-300 border-blue-800/60 hover:bg-[#0d2754] hover:text-white'
                        }`}
                      >
                        <ShieldCheck className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-amber-400'}`} />
                        <span>Grade {p.grade}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          isSelected ? 'bg-slate-950 text-amber-300' : 'bg-blue-950 text-slate-400'
                        }`}>
                          {p.availableTrailers} Trucks
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Selected Grade Summary Box */}
              {activeProduct && (
                <div className="bg-[#050f24] border border-blue-900/60 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-400 text-[11px] font-bold">Grade {activeProduct.grade}</span>
                      <span className="text-slate-500">•</span>
                      <strong className="text-white text-sm font-bold">{activeProduct.name}</strong>
                    </div>
                    <p className="text-slate-400 text-[11px] max-w-xl">
                      {activeProduct.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                        Plant Inventory Available
                      </span>
                      <strong className="text-emerald-400 text-sm font-mono font-bold block">
                        {activeProduct.availableTrailers} Full Trucks ({(activeProduct.availableTrailers * 600).toLocaleString()} Bags)
                      </strong>
                    </div>
                    <button
                      onClick={() => handleOrderQuickTrailers(activeProduct, 1)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Order 1 Truck Now</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Pricing Schedule Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b214a] text-blue-200 font-bold border-b border-blue-800">
                    <tr>
                      <th className="py-3 px-4">Trailer Quantity</th>
                      <th className="py-3 px-4">Selected Grade</th>
                      <th className="py-3 px-4">Standard 50kg Bags</th>
                      <th className="py-3 px-4">Metric Weight</th>
                      <th className="py-3 px-4">Price Per Bag</th>
                      <th className="py-3 px-4">Total Cement Cost</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-950/80 font-mono text-slate-300">
                    {[1, 2, 3, 4, 5, 10].map((truckCount) => {
                      const bags = truckCount * 600;
                      const tonnes = truckCount * 30;
                      const totalNGN = truckCount * 6510000;
                      return (
                        <tr key={truckCount} className="hover:bg-blue-950/40 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-white flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-amber-400" />
                            <span>{truckCount} {truckCount === 1 ? 'Trailer' : 'Trailers'}</span>
                          </td>
                          <td className="py-3.5 px-4 text-amber-300 font-sans font-semibold">
                            Grade {activeProduct?.grade || '42.5R'}
                          </td>
                          <td className="py-3.5 px-4">{bags.toLocaleString()} Bags</td>
                          <td className="py-3.5 px-4">{tonnes} Tonnes</td>
                          <td className="py-3.5 px-4 text-emerald-400">₦10,850</td>
                          <td className="py-3.5 px-4 font-black text-amber-300">₦{totalNGN.toLocaleString('en-NG')}</td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                if (activeProduct) handleOrderQuickTrailers(activeProduct, truckCount);
                              }}
                              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-[11px] shadow transition-all active:scale-95"
                            >
                              Order Now &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MY ORDERS & WAYBILLS */}
        {activeTab === 'my_orders' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                  <ShoppingBag className="w-6 h-6 text-emerald-400" />
                  <span>My Trailer Orders &amp; Waybill Receipts</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time status tracking from Manager approval to Agent issuance at Kalambaina Plant.
                </p>
              </div>

              <button
                onClick={loadOrders}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-700 font-semibold"
              >
                Refresh Orders
              </button>
            </div>

            {claimSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-2xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{claimSuccess}</span>
              </div>
            )}

            {/* Modal for Submitting Bank Transfer Reference */}
            {claimOrderId && (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#0b1f42] border border-blue-700 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      <span>Submit Bank Transfer Proof</span>
                    </h3>
                    <button onClick={() => setClaimOrderId(null)} className="text-slate-400 hover:text-white">
                      &times;
                    </button>
                  </div>
                  <p className="text-xs text-slate-300">
                    Enter the bank payment transaction reference/teller number so our Cashier can reconcile and mark your order as PAID.
                  </p>
                  <form onSubmit={handleClaimBankTransfer} className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Bank Transfer Reference / Session ID / Slip No.
                      </label>
                      <input
                        type="text"
                        value={bankRefInput}
                        onChange={(e) => setBankRefInput(e.target.value)}
                        placeholder="e.g. ZEN-982104829103 or TRF-48291"
                        required
                        className="w-full bg-[#061226] border border-blue-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 block mb-1">
                        Bank Account Holder / Payer Name
                      </label>
                      <input
                        type="text"
                        value={payerNameInput}
                        onChange={(e) => setPayerNameInput(e.target.value)}
                        placeholder="e.g. Alhaji Mukhtar Dan-Kano"
                        required
                        className="w-full bg-[#061226] border border-blue-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={claimSubmitting}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
                      >
                        {claimSubmitting ? 'Submitting...' : 'Submit Proof to Cashier'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setClaimOrderId(null)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2.5 px-4 rounded-xl text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {!user ? (
              <div className="bg-[#071329] rounded-3xl border border-blue-900/40 p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto shadow-2xl">
                <div className="w-14 h-14 rounded-full bg-blue-900/40 border border-blue-600/50 flex items-center justify-center mx-auto text-amber-400">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white">Wholesale Customer Account Required</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Sign in or create your independent contractor account to access your live trailer order queue, 100% upfront payment status, and Kalambaina plant security gate passes.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setAuthModalTab('register');
                      setIsAuthModalOpen(true);
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <User className="w-4 h-4" />
                    <span>Create Customer Account</span>
                  </button>
                  <button
                    onClick={() => {
                      setAuthModalTab('login');
                      setIsAuthModalOpen(true);
                    }}
                    className="bg-[#0b214a] hover:bg-[#112d63] text-blue-200 border border-blue-700/60 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Customer Sign In</span>
                  </button>
                </div>
              </div>
            ) : isLoadingOrders ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                Loading wholesale orders...
              </div>
            ) : customerOrders.length === 0 ? (
              <div className="bg-[#071329] rounded-3xl border border-blue-900/40 p-12 text-center space-y-4">
                <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">No Wholesale Trailer Orders Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {user.companyName ? `No orders placed yet for ${user.companyName}.` : 'You have not placed any orders under this buyer account.'} Explore our cement grades and place your first 600-bag trailer order.
                </p>
                <button
                  onClick={() => setActiveTab('catalogue')}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-colors inline-flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Browse Cement Catalogue</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {customerOrders.map((order) => {
                  const statusInfo = statusColors[order.status] || {
                    bg: 'bg-slate-800 text-slate-300 border-slate-700',
                    text: 'text-slate-300',
                    label: order.status,
                  };

                  return (
                    <div
                      key={order.id}
                      className="bg-[#071329] rounded-3xl border border-blue-900/40 p-5 sm:p-6 space-y-4 hover:border-blue-700/60 transition-all shadow-lg"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-950 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-white text-base sm:text-lg">
                              {order.orderNumber}
                            </span>
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusInfo.bg}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Placed on {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onViewOrderReceipt(order)}
                            className="bg-[#0b214a] hover:bg-[#112d63] text-blue-200 border border-blue-700/50 text-xs px-3 py-1.5 rounded-xl font-medium transition-colors flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-400" />
                            <span>View Waybill Receipt</span>
                          </button>

                          {(order.status === 'APPROVED_AWAITING_PAYMENT' || order.status === 'PENDING_PAYMENT') && (
                            <button
                              onClick={() => setClaimOrderId(order.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-md flex items-center gap-1"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Submit Payment Reference</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Items & Logistics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="space-y-1 bg-[#050c1c] p-3 rounded-2xl border border-blue-950">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                            Order Quantity
                          </span>
                          <strong className="text-sm text-white font-bold block">
                            {order.totalTrailers} {order.totalTrailers === 1 ? 'Trailer' : 'Trailers'} ({order.totalBags.toLocaleString()} Bags / {order.totalTonnes}T)
                          </strong>
                          <span className="text-slate-400 block">
                            {order.items.map((i) => `${i.productName} (${i.trailerCount} truck)`).join(', ')}
                          </span>
                        </div>

                        <div className="space-y-1 bg-[#050c1c] p-3 rounded-2xl border border-blue-950">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                            Fulfillment Mode
                          </span>
                          <strong className="text-sm text-amber-400 font-bold block">
                            {order.fulfillmentType === 'FACTORY_TRAILER_HAULAGE' ? 'Factory Trailer Haulage' : 'Factory Gate Collection'}
                          </strong>
                          <span className="text-slate-400 block truncate">
                            {order.deliveryDetails
                              ? `${order.deliveryDetails.siteAddress}, ${order.deliveryDetails.city}, ${order.deliveryDetails.state}`
                              : order.collectionDetails?.plantDepotLocation || 'Kalambaina Loading Bay'}
                          </span>
                        </div>

                        <div className="space-y-1 bg-[#050c1c] p-3 rounded-2xl border border-blue-950">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                            Financial Total (100% Upfront)
                          </span>
                          <strong className="text-sm text-emerald-400 font-bold font-mono block">
                            ₦{order.totalAmount.toLocaleString('en-NG')}
                          </strong>
                          <span className="text-slate-400 block font-mono">
                            Subtotal: ₦{order.subtotal.toLocaleString('en-NG')}
                            {order.haulageFee > 0 && ` + Haulage: ₦${order.haulageFee.toLocaleString('en-NG')}`}
                          </span>
                        </div>
                      </div>

                      {/* Truck Allocations Breakdown */}
                      {order.truckAllocations && order.truckAllocations.length > 0 && (
                        <div className="pt-2 border-t border-blue-950/60 space-y-2">
                          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-amber-400" />
                            <span>Individual 600-Bag Truck Allocations ({order.issuedTrucksCount || 0} of {order.totalTrailers} Issued by Agent):</span>
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {order.truckAllocations.map((alloc) => (
                              <div
                                key={alloc.id}
                                className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                                  alloc.status === 'ISSUED'
                                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                                    : 'bg-[#081738] border-blue-900/60 text-slate-300'
                                }`}
                              >
                                <div>
                                  <strong className="font-bold block">{alloc.truckLabel}</strong>
                                  <span className="text-[10px] text-slate-400">
                                    {alloc.status === 'ISSUED'
                                      ? `Rig: ${alloc.truckHeadReg} / ${alloc.trailerBedReg}`
                                      : 'Awaiting Agent physical clearance'}
                                  </span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  alloc.status === 'ISSUED' ? 'bg-emerald-800 text-white' : 'bg-amber-900/60 text-amber-300'
                                }`}>
                                  {alloc.status === 'ISSUED' ? 'ISSUED' : 'PENDING'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ORDERING WORKFLOW EXPLAINER */}
        {activeTab === 'how_it_works' && (
          <div className="bg-[#071329] rounded-3xl border border-blue-900/40 p-6 sm:p-10 space-y-8">
            <div className="max-w-2xl space-y-2">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                TRANSPARENT OPERATIONAL PROTOCOL
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-['Plus_Jakarta_Sans']">
                How Sokoto Cement Trailer Ordering Works
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                A.A. Master Nig. Limited operates under strict separation of duties to protect contractor funds, guarantee factory-sealed quality, and prevent dispatch delays.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Step 1 */}
              <div className="bg-[#081d45] border border-blue-700/40 rounded-2xl p-4 space-y-2 relative">
                <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  1
                </span>
                <strong className="text-xs text-white block font-bold">Buyer Placement</strong>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Contractor registers account and selects trailer quantities (minimum 1 full truck = 600 bags).
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-[#081d45] border border-blue-700/40 rounded-2xl p-4 space-y-2 relative">
                <span className="w-7 h-7 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                  2
                </span>
                <strong className="text-xs text-white block font-bold">Manager Approval</strong>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Engr. Sanusi Kalambaina verifies plant capacity and approves reservation in terminal inventory.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-[#081d45] border border-blue-700/40 rounded-2xl p-4 space-y-2 relative">
                <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                  3
                </span>
                <strong className="text-xs text-white block font-bold">Cashier Verification</strong>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Abubakar Garba verifies 100% upfront settlement into official company accounts. No credit sales.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-[#081d45] border border-blue-700/40 rounded-2xl p-4 space-y-2 relative">
                <span className="w-7 h-7 rounded-full bg-teal-600 text-white font-black text-xs flex items-center justify-center">
                  4
                </span>
                <strong className="text-xs text-white block font-bold">Agent Issuance</strong>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Haruna Danladi physically inspects trailer rig at Kalambaina site, confirms driver, and deducts 600 bags.
                </p>
              </div>

              {/* Step 5 */}
              <div className="bg-[#081d45] border border-blue-700/40 rounded-2xl p-4 space-y-2 relative">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                  5
                </span>
                <strong className="text-xs text-white block font-bold">Gate Clearance Pass</strong>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Driver receives security gate pass and official delivery waybill for direct haulage to buyer site.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-300 block">Strict Compliance Policy:</strong>
                <span>Under no circumstances will cement be physically released without 100% full payment confirmation and verified Manager authorization.</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: OFFICIAL CORPORATE BANK DETAILS */}
        {activeTab === 'bank_details' && (
          <div className="bg-[#071329] rounded-3xl border border-blue-900/40 p-6 sm:p-10 space-y-6">
            <div className="max-w-2xl space-y-2">
              <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">
                SETTLEMENT ACCOUNTS
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-['Plus_Jakarta_Sans']">
                Official Corporate Banking Details
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Make 100% upfront wire transfers exclusively to verified A.A. Master Nig. Limited corporate accounts. Never transfer funds to personal staff accounts.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account 1 */}
              <div className="bg-[#081d45] border border-blue-700/60 rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                    PRIMARY SETTLEMENT ACCOUNT
                  </span>
                  <span className="bg-emerald-900/80 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                    ZENITH BANK PLC
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Account Name:</span>
                  <strong className="text-base text-white block font-bold font-mono">
                    A.A. MASTER NIG. LIMITED
                  </strong>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Account Number:</span>
                  <div className="flex items-center justify-between bg-[#040d21] border border-blue-800 rounded-xl p-3">
                    <span className="text-xl font-black text-amber-400 font-mono tracking-wider">
                      1018492049
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('1018492049');
                        alert('Zenith Bank Account copied: 1018492049');
                      }}
                      className="text-xs text-blue-300 hover:text-white font-bold"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Account 2 */}
              <div className="bg-[#081d45] border border-blue-700/60 rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                    SECONDARY SETTLEMENT ACCOUNT
                  </span>
                  <span className="bg-blue-900/80 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded">
                    FIRST BANK OF NIGERIA
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Account Name:</span>
                  <strong className="text-base text-white block font-bold font-mono">
                    A.A. MASTER NIG. LIMITED
                  </strong>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400">Account Number:</span>
                  <div className="flex items-center justify-between bg-[#040d21] border border-blue-800 rounded-xl p-3">
                    <span className="text-xl font-black text-amber-400 font-mono tracking-wider">
                      2038192847
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('2038192847');
                        alert('First Bank Account copied: 2038192847');
                      }}
                      className="text-xs text-blue-300 hover:text-white font-bold"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/60 border border-blue-900 text-xs text-slate-300 space-y-1">
              <strong className="text-white block font-bold">Important Instructions for Bank Transfers:</strong>
              <p>
                1. Always include your <strong>Order Number (e.g. AAM-202610-XXXX)</strong> as the transaction description or payment reference.
              </p>
              <p>
                2. After completing your transfer, navigate to <strong className="text-white">"My Orders"</strong> and click <strong className="text-emerald-400">"Submit Payment Reference"</strong> so Abubakar Garba (Cashier) can immediately verify and reconcile your funds.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 4. FOOTER */}
      <footer className="bg-[#030712] border-t border-blue-950 text-slate-400 text-xs py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="font-bold text-white uppercase text-xs block">
              A.A. MASTER NIG. LIMITED
            </span>
            <p className="text-[11px] text-slate-400">
              P. O. Box 746, Canteen Area, Gusau, Zamfara State • Sokoto Cement Kalambaina Plant Direct
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-emerald-400 flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5" /> 080-36172280
            </span>
            <span>•</span>
            <span>080-82111063</span>
            <span>•</span>
            <span>080-68806113</span>
          </div>

          <div className="text-[10px] text-slate-400">
            &copy; {new Date().getFullYear()} A.A. Master Nig. Limited. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Customer Registration and Login Modal */}
      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        initialTab={authModalTab}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => loadOrders()}
      />
    </div>
  );
};
