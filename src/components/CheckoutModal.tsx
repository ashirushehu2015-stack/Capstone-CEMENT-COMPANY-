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
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { apiOrders, apiReports, apiPayments } from '../services/api.ts';
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
  const [fulfillmentType, setFulfillmentType] = useState<'FACTORY_TRAILER_HAULAGE' | 'FACTORY_GATE_COLLECTION'>('FACTORY_TRAILER_HAULAGE');

  // Delivery details
  const [deliveryZoneId, setDeliveryZoneId] = useState<string>('zone_kano_katsina');
  const [siteAddress, setSiteAddress] = useState(user?.address || '');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState(user?.city || 'Kano');
  const [state, setState] = useState(user?.state || 'Kano');

  // Factory Gate collection details
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

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await apiReports.getSettings();
        setSettings(res.settings);
        if (res.settings.interstateHaulageZones?.length > 0) {
          setDeliveryZoneId(res.settings.interstateHaulageZones[0].id);
        }
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

  // Selected Zone calculation for trailers
  const selectedZone = settings?.interstateHaulageZones?.find((z) => z.id === deliveryZoneId);
  const haulageFee =
    fulfillmentType === 'FACTORY_TRAILER_HAULAGE' && selectedZone
      ? selectedZone.haulageFeePerTrailer * totalTrailers
      : 0;

  const offloadingFee =
    fulfillmentType === 'FACTORY_TRAILER_HAULAGE' && settings
      ? totalTrailers * settings.offloadingFeePerTrailer
      : 0;

  const grandTotal = subtotalNGN + haulageFee + offloadingFee;

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

    if (totalTrailers < 1) {
      setErrorMessage('You must select at least 1 Trailer (600 bags / 30 tonnes).');
      return;
    }

    if (!termsAccepted) {
      setErrorMessage('Please accept the wholesale trailer delivery and demurrage terms to proceed.');
      return;
    }

    if (fulfillmentType === 'FACTORY_TRAILER_HAULAGE') {
      if (!siteAddress || siteAddress.trim().length < 5) {
        setErrorMessage('Please enter the exact site or warehouse delivery address for articulated trailer access.');
        return;
      }
      if (!recipientPhone || recipientPhone.trim().length < 10) {
        setErrorMessage('Please enter a valid receiving phone number for haulage driver coordination.');
        return;
      }
    } else {
      if (!truckHeadReg || !trailerBedReg || !driverName) {
        setErrorMessage('Please provide the Truck Head Reg, Trailer Bed Reg, and Driver Name for plant security gate clearance.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const orderRes = await apiOrders.create({
        items: items.map((it) => ({
          productId: it.product.id,
          trailerCount: it.trailerCount,
        })),
        companyName,
        fulfillmentType,
        deliveryDetails:
          fulfillmentType === 'FACTORY_TRAILER_HAULAGE'
            ? {
                recipientName,
                recipientPhone,
                siteAddress,
                landmark,
                city,
                state,
                deliveryZoneId,
              }
            : undefined,
        collectionDetails:
          fulfillmentType === 'FACTORY_GATE_COLLECTION'
            ? {
                plantDepotId,
                transporterName,
                transporterPhone,
                truckHeadReg,
                trailerBedReg,
                driverName,
                driverLicenseNo,
              }
            : undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-8 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                Sokoto Cement Wholesale Checkout
              </span>
              <span className="text-xs text-slate-300 font-mono font-bold">
                {totalTrailers} {totalTrailers === 1 ? 'Trailer' : 'Trailers'} • {totalBags.toLocaleString()} Bags • {totalWeightTonnes}T
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Review & Confirm Trailer Order</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmitOrder} className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {errorMessage && (
            <div className="p-4 bg-rose-950/50 border border-rose-800 rounded-2xl flex items-start gap-3 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Fulfillment Selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              1. Fulfillment & Logistics Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFulfillmentType('FACTORY_TRAILER_HAULAGE')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  fulfillmentType === 'FACTORY_TRAILER_HAULAGE'
                    ? 'bg-amber-600/15 border-amber-500 text-white shadow-md'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <div
                  className={`p-2 rounded-xl ${
                    fulfillmentType === 'FACTORY_TRAILER_HAULAGE' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Factory Direct Trailer Haulage</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Full 30-Ton articulated multi-axle trailer dispatched from Kalambaina Plant directly to your project site.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentType('FACTORY_GATE_COLLECTION')}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  fulfillmentType === 'FACTORY_GATE_COLLECTION'
                    ? 'bg-amber-600/15 border-amber-500 text-white shadow-md'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <div
                  className={`p-2 rounded-xl ${
                    fulfillmentType === 'FACTORY_GATE_COLLECTION' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Factory Gate Self-Collection (FREE)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Load directly onto your own transporter's articulated trailer at Kalambaina Plant gates with Gate Pass.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Customer & Transporter Information */}
          <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Contractor & Company Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Company / Consortium Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Dan-Kano Mega Estates Ltd"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Authorized Contact / Engineer</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Alhaji Mukhtar Dan-Kano"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-slate-400 block mb-1">Phone Number (WhatsApp for Driver Coordination)</label>
                <input
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="e.g. 0802 999 8877"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
              </div>
            </div>
          </div>

          {/* Fulfillment Details Sub-Forms */}
          {fulfillmentType === 'FACTORY_TRAILER_HAULAGE' ? (
            <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Interstate Haulage Destination
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 block mb-1">Select Interstate Haulage Corridor</label>
                  <select
                    value={deliveryZoneId}
                    onChange={(e) => setDeliveryZoneId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium"
                  >
                    {settings?.interstateHaulageZones?.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name} — ₦{zone.haulageFeePerTrailer.toLocaleString()}/Trailer ({zone.estimatedDeliveryDays})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 block mb-1">Site Delivery Address (Articulated Truck Access Required)</label>
                  <input
                    type="text"
                    required
                    value={siteAddress}
                    onChange={(e) => setSiteAddress(e.target.value)}
                    placeholder="e.g. Plot 45, Western Bypass Commercial Estate, Kano"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Prominent Landmark for Driver</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Opposite TotalEnergies Mega Station"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Destination State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Transporter Truck Clearance (Kalambaina Plant Security)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-400 block mb-1">Plant Loading Terminal</label>
                  <select
                    value={plantDepotId}
                    onChange={(e) => setPlantDepotId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium"
                  >
                    {settings?.depots?.map((depot) => (
                      <option key={depot.id} value={depot.id}>
                        {depot.name} — {depot.address}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Truck Tractor Head Reg</label>
                  <input
                    type="text"
                    required
                    value={truckHeadReg}
                    onChange={(e) => setTruckHeadReg(e.target.value)}
                    placeholder="e.g. SKK-782-XA (Mack/DAF)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Trailer Bed Reg</label>
                  <input
                    type="text"
                    required
                    value={trailerBedReg}
                    onChange={(e) => setTrailerBedReg(e.target.value)}
                    placeholder="e.g. T-904-SOK (Flatbed 40ft)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Transporter Driver Full Name</label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. Ibrahim Gusau"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Driver License / ID Number</label>
                  <input
                    type="text"
                    value={driverLicenseNo}
                    onChange={(e) => setDriverLicenseNo(e.target.value)}
                    placeholder="e.g. KBB-89104-AA"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              2. Select Payment Settlement Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'bg-amber-600/15 border-amber-500 text-white shadow-md'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-white block">Corporate Bank Transfer (Zenith Bank)</span>
                  <span className="text-[11px] text-slate-400">Direct wire to plant account with instant treasury reconciliation</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('PAYSTACK_CARD')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  paymentMethod === 'PAYSTACK_CARD'
                    ? 'bg-amber-600/15 border-amber-500 text-white shadow-md'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <CreditCard className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-white block">Paystack Online Payment</span>
                  <span className="text-[11px] text-slate-400">Instant gateway checkout with automated clearance</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH_AT_STORE')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  paymentMethod === 'CASH_AT_STORE'
                    ? 'bg-amber-600/15 border-amber-500 text-white shadow-md'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <Building className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-white block">Bank Draft / Cash at Plant Treasury</span>
                  <span className="text-[11px] text-slate-400">Pay certified bank draft at Kalambaina Cashier</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('POS_TERMINAL')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  paymentMethod === 'POS_TERMINAL'
                    ? 'bg-amber-600/15 border-amber-500 text-white shadow-md'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <CreditCard className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-white block">POS Corporate Terminal</span>
                  <span className="text-[11px] text-slate-400">Terminal payment at plant administrative block</span>
                </div>
              </button>
            </div>
          </div>

          {/* Zenith Bank Details */}
          {paymentMethod === 'BANK_TRANSFER' && settings?.bankAccount && (
            <div className="bg-emerald-950/20 border border-emerald-800/40 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Zenith Bank Corporate Account (Plant Wire)
                </span>
                <button
                  type="button"
                  onClick={handleCopyAccount}
                  className="text-xs text-emerald-400 hover:text-white flex items-center gap-1 font-mono"
                >
                  {copiedBank ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedBank ? 'Copied' : 'Copy Number'}
                </button>
              </div>
              <div className="text-sm font-bold text-white font-mono">
                {settings.bankAccount.bankName} • {settings.bankAccount.accountNumber}
              </div>
              <p className="text-xs text-slate-300">
                Account Name: <strong>{settings.bankAccount.accountName}</strong>
              </p>
              <p className="text-[11px] text-slate-400">
                {settings.bankAccount.instructions}
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs text-slate-400 block mb-1">Convoy & Site Offloading Instructions</label>
            <input
              type="text"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="e.g. Please ensure waterproof tarpaulin is strapped; site cranes available for offloading."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
            />
          </div>

          {/* Price Breakdown */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs border-b border-slate-800 pb-2">
              Authoritative Wholesale Financial Summary
            </h4>
            <div className="flex justify-between text-slate-400">
              <span>{totalTrailers} Trailer(s) ({totalBags.toLocaleString()} bags / {totalWeightTonnes}T)</span>
              <span className="font-mono font-bold text-white">₦{subtotalNGN.toLocaleString('en-NG')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Interstate Trailer Haulage</span>
              <span className="font-mono font-bold text-white">
                {fulfillmentType === 'FACTORY_TRAILER_HAULAGE' ? `₦${haulageFee.toLocaleString('en-NG')}` : '₦0 (Self-Collection)'}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Porter Crew Offloading (per trailer)</span>
              <span className="font-mono font-bold text-white">
                {fulfillmentType === 'FACTORY_TRAILER_HAULAGE' ? `₦${offloadingFee.toLocaleString('en-NG')}` : '₦0'}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-amber-400 border-t border-slate-800 pt-2">
              <span>Total Payable Amount</span>
              <span className="text-base font-black font-mono">₦{grandTotal.toLocaleString('en-NG')}</span>
            </div>
          </div>

          {/* Terms */}
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-amber-600 focus:ring-amber-500 bg-slate-950"
            />
            <span>
              I accept the Sokoto Cement wholesale trailer sales, haulage demurrage (max 24 hours offloading at site), and plant collection clearance policy.
            </span>
          </label>

          {/* Footer Actions */}
          <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs font-semibold text-slate-400 hover:text-white"
            >
              Back to Cart
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isPaystackProcessing}
              className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white font-extrabold py-3 px-6 rounded-xl shadow-lg shadow-amber-950/40 flex items-center gap-2 text-sm transition-all active:scale-95"
            >
              {isSubmitting || isPaystackProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {isPaystackProcessing ? 'Verifying Paystack Gateway...' : 'Reserving Plant Trailers...'}
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
        </form>
      </div>
    </div>
  );
};
