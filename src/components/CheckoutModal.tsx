import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  Building,
  CreditCard,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  ArrowRight,
  User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { apiOrders, apiReports, apiPayments } from '../services/api.ts';
import { CustomerAuthModal } from './CustomerAuthModal.tsx';
import type { BusinessSettings, Order } from '../types/index.ts';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { items, totalTrailers, totalBags, totalWeightTonnes, subtotalNGN, clearCart } = useCart();
  const { user } = useAuth();

  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState(user?.companyName || '');
  const [recipientName, setRecipientName] = useState(user?.fullName || '');
  const [recipientPhone, setRecipientPhone] = useState(user?.phone || '');
  const [fulfillmentType] = useState<'FACTORY_GATE_COLLECTION'>('FACTORY_GATE_COLLECTION');

  // Factory Gate collection details (Company does NOT handle delivery; customer provides transporter)
  const [plantDepotId, setPlantDepotId] = useState<string>('depot_kalambaina');
  const [transporterName, setTransporterName] = useState('Arewa Haulage Consortium');
  const [transporterPhone, setTransporterPhone] = useState(user?.phone || '');
  const [truckHeadReg, setTruckHeadReg] = useState('');
  const [trailerBedReg, setTrailerBedReg] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverLicenseNo, setDriverLicenseNo] = useState('');

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<
    'PAYSTACK_CARD' | 'BANK_TRANSFER' | 'CASH_AT_STORE' | 'POS_TERMINAL'
  >('BANK_TRANSFER');
  const [customerNotes, setCustomerNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Paystack Simulation State
  const [isPaystackProcessing, setIsPaystackProcessing] = useState(false);
  const [copiedBank, setCopiedBank] = useState(false);

  // Customer Auth modal inside checkout
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'register' | 'login'>('register');

  // Synchronize when user logs in or registers
  useEffect(() => {
    if (user) {
      if (user.companyName) setCompanyName(user.companyName);
      if (user.fullName) setRecipientName(user.fullName);
      if (user.phone) {
        setRecipientPhone(user.phone);
        if (!transporterPhone) setTransporterPhone(user.phone);
      }
    }
  }, [user]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await apiReports.getSettings();
        setSettings(res.settings);
        if (res.settings.depots?.length > 0) {
          setPlantDepotId(res.settings.depots[0].id);
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    }
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // The company does NOT handle delivery. Haulage & offloading fees are strictly ₦0.
  const haulageFee = 0;
  const offloadingFee = 0;
  const grandTotal = subtotalNGN;

  const handleCopyAccount = () => {
    if (settings?.bankAccount) {
      navigator.clipboard.writeText(settings.bankAccount.accountNumber);
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!user) {
      setErrorMessage('A registered customer account is required so plant loading gate passes can be issued. Please sign in or create an account.');
      setAuthModalTab('register');
      setIsAuthModalOpen(true);
      return;
    }

    if (totalTrailers < 1) {
      setErrorMessage('You must select at least 1 Trailer (600 bags / 30 tonnes).');
      return;
    }

    if (!termsAccepted) {
      setErrorMessage('Please accept the Ex-Factory sales, customer haulage responsibility, and plant clearance policy to proceed.');
      return;
    }

    if (!truckHeadReg || !trailerBedReg || !driverName) {
      setErrorMessage('Please provide the Truck Head Reg, Trailer Bed Reg, and Driver Name for Kalambaina plant security clearance.');
      return;
    }

    if (!recipientPhone || recipientPhone.trim().length < 10) {
      setErrorMessage('Please enter a valid telephone number for transporter dispatch coordination.');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderRes = await apiOrders.create({
        items: items.map((it) => ({
          productId: it.product.id,
          trailerCount: it.trailerCount,
        })),
        companyName,
        fulfillmentType: 'FACTORY_GATE_COLLECTION',
        collectionDetails: {
          plantDepotId,
          transporterName: transporterName || 'Customer Private Transporter',
          transporterPhone: transporterPhone || recipientPhone,
          truckHeadReg,
          trailerBedReg,
          driverName,
          driverLicenseNo,
        },
        paymentMethod,
        customerNotes,
      });

      let finalOrder = orderRes.order;

      if (paymentMethod === 'PAYSTACK_CARD') {
        setIsPaystackProcessing(true);
        const fakePaystackRef = 'pstk_skt_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
        const payRes = await apiPayments.verifyPaystack({
          orderId: finalOrder.id,
          reference: fakePaystackRef,
        });
        if (payRes.order) {
          finalOrder = payRes.order;
        }
      }

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      clearCart();
      onOrderSuccess(finalOrder);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to place trailer order. Please check terminal stock.');
    } finally {
      setIsSubmitting(false);
      setIsPaystackProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[95vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Compact Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
              Sokoto Cement Wholesale Checkout
            </span>
            <h2 className="text-base sm:text-lg font-bold text-white">Review &amp; Confirm Trailer Order</h2>
            <span className="text-xs text-slate-300 font-mono font-bold bg-slate-800 px-2.5 py-0.5 rounded-md border border-slate-700">
              {totalTrailers} {totalTrailers === 1 ? 'Trailer' : 'Trailers'} • {totalBags.toLocaleString()} Bags • {totalWeightTonnes}T
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden md:flex items-center gap-2 bg-blue-950/50 border border-blue-800/60 px-3 py-1 rounded-xl text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300 truncate max-w-[240px]">
                  <strong className="text-white">{user.fullName}</strong> {user.companyName ? `(${user.companyName})` : ''}
                </span>
                <span className="bg-emerald-950/90 border border-emerald-700/80 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                  Verified
                </span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmitOrder} className="p-4 sm:p-5 overflow-y-auto flex-1 text-slate-200 space-y-3">
          {/* Guest Checkout Prompt (only if not logged in) */}
          {!user && (
            <div className="p-3 bg-gradient-to-r from-blue-950/80 to-[#07173b] border border-blue-700/60 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <strong className="text-white font-bold">Guest Checkout Detected — </strong>
                  <span className="text-slate-300 text-[11px]">
                    Sign in or create an account to attach this wholesale order to your contractor profile.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab('login');
                    setIsAuthModalOpen(true);
                  }}
                  className="bg-[#0b214a] hover:bg-[#112d63] text-blue-200 border border-blue-600/50 px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab('register');
                    setIsAuthModalOpen(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded-lg text-xs shadow-md transition-all active:scale-95"
                >
                  Create Account
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 bg-rose-950/50 border border-rose-800 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Main 2-Column Grid to Fit Screen Height */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* LEFT COLUMN: Fulfillment, Contractor & Truck Clearance (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              {/* 1. Fulfillment Banner */}
              <div className="p-3 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/40 rounded-xl flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-xs font-bold text-white">1. Factory Gate Collection (Customer-Arranged Transporter)</h4>
                    <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                      Ex-Factory Policy
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 mt-0.5 leading-snug">
                    <strong>Notice:</strong> Sold strictly <strong>Ex-Factory / Kalambaina Plant Loading Bay</strong>. The company does <strong>NOT</strong> handle delivery; buyers dispatch their own trailers for loading by the issuing Agent.
                  </p>
                </div>
              </div>

              {/* Contractor & Company Details */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Contractor &amp; Company Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Company / Consortium Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Dan-Kano Estates"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Authorized Contact / Engineer</label>
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Alhaji Mukhtar"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Phone (WhatsApp / Dispatch)</label>
                    <input
                      type="tel"
                      required
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="e.g. 0802 999 8877"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Customer-Arranged Transporter Rig & Driver Details */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    Customer Transporter &amp; Truck Clearance (Kalambaina Plant Security)
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">Agent Gate Verification</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-slate-400 block mb-1">Plant Loading Terminal (Issuing Agent Location)</label>
                    <select
                      value={plantDepotId}
                      onChange={(e) => setPlantDepotId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium"
                    >
                      {settings?.depots?.map((depot) => (
                        <option key={depot.id} value={depot.id}>
                          {depot.name} — {depot.address}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Transporter / Haulage Company</label>
                    <input
                      type="text"
                      required
                      value={transporterName}
                      onChange={(e) => setTransporterName(e.target.value)}
                      placeholder="e.g. Arewa Haulage Consortium"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Transporter Dispatch Phone</label>
                    <input
                      type="tel"
                      required
                      value={transporterPhone}
                      onChange={(e) => setTransporterPhone(e.target.value)}
                      placeholder="e.g. 0803 456 7890"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Truck Tractor Head Reg (Arriving at Plant)</label>
                    <input
                      type="text"
                      required
                      value={truckHeadReg}
                      onChange={(e) => setTruckHeadReg(e.target.value)}
                      placeholder="e.g. SKK-782-XA"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Trailer Bed Reg (Flatbed 40ft / High Side)</label>
                    <input
                      type="text"
                      required
                      value={trailerBedReg}
                      onChange={(e) => setTrailerBedReg(e.target.value)}
                      placeholder="e.g. T-904-SOK (40ft)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Transporter Driver Full Name</label>
                    <input
                      type="text"
                      required
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="e.g. Ibrahim Gusau"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Driver License / National ID Number</label>
                    <input
                      type="text"
                      value={driverLicenseNo}
                      onChange={(e) => setDriverLicenseNo(e.target.value)}
                      placeholder="e.g. KBB-89104-AA"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Payment, Instructions, Summary & Submit (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              {/* 2. Payment Method Selection */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  2. Select Payment Settlement Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('BANK_TRANSFER')}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'bg-amber-600/15 border-amber-500 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-bold text-white block leading-tight">Corporate Bank Transfer</span>
                      <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">Zenith Bank plant wire</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('PAYSTACK_CARD')}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
                      paymentMethod === 'PAYSTACK_CARD'
                        ? 'bg-amber-600/15 border-amber-500 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-bold text-white block leading-tight">Paystack Online</span>
                      <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">Instant gateway checkout</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH_AT_STORE')}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
                      paymentMethod === 'CASH_AT_STORE'
                        ? 'bg-amber-600/15 border-amber-500 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <Building className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-bold text-white block leading-tight">Bank Draft / Treasury</span>
                      <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">Certified draft at Kalambaina Plant Management Desk</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('POS_TERMINAL')}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
                      paymentMethod === 'POS_TERMINAL'
                        ? 'bg-amber-600/15 border-amber-500 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-bold text-white block leading-tight">POS Corporate Terminal</span>
                      <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">Plant admin block POS</span>
                    </div>
                  </button>
                </div>

                {/* Zenith Bank Details */}
                {paymentMethod === 'BANK_TRANSFER' && settings?.bankAccount && (
                  <div className="bg-emerald-950/25 border border-emerald-800/40 p-2.5 rounded-xl space-y-1 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        Zenith Bank Corporate Account
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAccount}
                        className="text-[11px] text-emerald-400 hover:text-white flex items-center gap-1 font-mono"
                      >
                        {copiedBank ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedBank ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="text-xs font-bold text-white font-mono">
                      {settings.bankAccount.bankName} • {settings.bankAccount.accountNumber} ({settings.bankAccount.accountName})
                    </div>
                  </div>
                )}
              </div>


              {/* Price Breakdown */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px] border-b border-slate-800 pb-1.5 flex items-center justify-between">
                  <span>Ex-Factory Financial Summary</span>
                  <span className="text-[10px] text-amber-400 font-mono">₦10,850/Bag</span>
                </h4>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>{totalTrailers} Trailer(s) ({totalBags.toLocaleString()} bags / {totalWeightTonnes}T)</span>
                  <span className="font-mono font-bold text-white">₦{subtotalNGN.toLocaleString('en-NG')}</span>
                </div>
                <div className="flex justify-between text-xs font-black text-amber-400 border-t border-slate-800 pt-1.5">
                  <span>Total Payable (100% Upfront)</span>
                  <span className="text-sm font-black font-mono">₦{grandTotal.toLocaleString('en-NG')}</span>
                </div>
              </div>

              {/* Terms & Action Buttons */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-3">
                <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-300 leading-snug">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 text-amber-600 focus:ring-amber-500 bg-slate-950"
                  />
                  <span>
                    I accept that <strong>A.A. Master Nig. Limited does not handle delivery</strong>. Orders are sold strictly Ex-Factory at Kalambaina Plant for loading onto my dispatched trailer(s).
                  </span>
                </label>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Back to Cart
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || isPaystackProcessing}
                    className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 text-xs sm:text-sm transition-all active:scale-95"
                  >
                    {isSubmitting || isPaystackProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>
                          {isPaystackProcessing ? 'Verifying Paystack...' : 'Reserving Trailers...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>Confirm Order (₦{grandTotal.toLocaleString('en-NG')})</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Customer Auth Modal for Guest Checkouts */}
        <CustomerAuthModal
          isOpen={isAuthModalOpen}
          initialTab={authModalTab}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
    </div>
  );
};
