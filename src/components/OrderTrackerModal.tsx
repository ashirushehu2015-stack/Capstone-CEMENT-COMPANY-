import React, { useState } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Building,
  AlertCircle,
  FileText,
  Send,
  Loader2,
  Ban,
  ShieldCheck
} from 'lucide-react';
import { apiOrders, apiPayments } from '../services/api.ts';
import type { Order, OrderStatus } from '../types/index.ts';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewReceipt: (order: Order) => void;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  onViewReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bank Transfer Submission
  const [transferRef, setTransferRef] = useState('');
  const [payerName, setPayerName] = useState('');
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);

  // Cancellation
  const [isCancelling, setIsCancelling] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setClaimSuccess(null);
    try {
      const res = await apiOrders.getById(searchQuery.trim());
      setOrder(res.order);
    } catch (err: any) {
      setError(err.message || 'Trailer order reference not found');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitTransferClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !transferRef.trim() || !payerName.trim()) return;

    setIsSubmittingClaim(true);
    try {
      const res = await apiPayments.submitTransferClaim({
        orderId: order.id,
        bankTransferReference: transferRef.trim(),
        payerName: payerName.trim(),
      });
      setOrder(res.order);
      setClaimSuccess('Transfer reference submitted successfully! Our treasury desk will reconcile and issue the trailer loading pass.');
    } catch (err: any) {
      setError(err.message || 'Failed to submit claim');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm('Are you sure you want to cancel this trailer order? Reserved plant trailers will be released.')) return;

    setIsCancelling(true);
    try {
      const res = await apiOrders.cancel(order.id, 'Cancelled by customer via order tracking interface.');
      setOrder(res.order);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel trailer order');
    } finally {
      setIsCancelling(false);
    }
  };

  const steps: { label: string; key: OrderStatus; desc: string }[] = [
    { label: 'Order Placed', key: 'PENDING_PAYMENT', desc: 'Trailers reserved at plant' },
    { label: 'Payment Verified', key: 'PAID', desc: 'Treasury verified settlement' },
    { label: 'Loading & Staging', key: 'PROCESSING', desc: 'Articulated trailer loaded & strapped' },
    {
      label: order?.fulfillmentType === 'FACTORY_TRAILER_HAULAGE' ? 'Convoy Dispatched' : 'Gate Pass Ready',
      key: order?.fulfillmentType === 'FACTORY_TRAILER_HAULAGE' ? 'DISPATCHED' : 'READY_FOR_COLLECTION',
      desc: order?.fulfillmentType === 'FACTORY_TRAILER_HAULAGE' ? 'Truck on highway to site' : 'Staged at Kalambaina Gate',
    },
    { label: 'Delivered / Completed', key: 'COMPLETED', desc: 'Offloaded & signed off' },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING_PAYMENT':
      case 'PAYMENT_UNDER_VERIFICATION':
        return 0;
      case 'PAID':
        return 1;
      case 'CONFIRMED':
      case 'PROCESSING':
        return 2;
      case 'READY_FOR_COLLECTION':
      case 'DISPATCHED':
        return 3;
      case 'DELIVERED':
      case 'COMPLETED':
        return 4;
      default:
        return -1;
    }
  };

  const currentStep = order ? getStepIndex(order.status) : -1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Sokoto Cement Trailer Convoy Tracker</h2>
              <p className="text-xs text-slate-400">Track highway dispatch, trailer gate passes, and submit treasury payment proof</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Search Box */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Trailer Order Number (e.g. SKT-202610-1001)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-10 py-3 text-sm text-white font-mono placeholder:font-sans focus:outline-none focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-3 rounded-xl text-sm transition-all flex items-center gap-2 active:scale-95"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </form>

          {/* Quick Demo Pre-fill suggestions */}
          {!order && !isLoading && (
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Sample Seeded Trailer Orders for Quick Testing:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('SKT-202610-1001');
                    apiOrders.getById('SKT-202610-1001').then((res) => setOrder(res.order));
                  }}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono px-3 py-1.5 rounded-lg border border-slate-700"
                >
                  SKT-202610-1001 (2 Trailers - 1,200 Bags to Kano - Processing)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('SKT-202610-1002');
                    apiOrders.getById('SKT-202610-1002').then((res) => setOrder(res.order));
                  }}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-emerald-300 font-mono px-3 py-1.5 rounded-lg border border-slate-700"
                >
                  SKT-202610-1002 (1 Trailer - Gate Pickup - Pass Ready)
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-950/50 border border-rose-800 rounded-2xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {order && (
            <div className="space-y-6">
              {/* Top Banner */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-white font-mono">{order.orderNumber}</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                        order.status === 'COMPLETED' || order.status === 'DELIVERED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : order.status === 'CANCELLED'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Placed: {new Date(order.createdAt).toLocaleString()} • {order.customerName} {order.companyName && `(${order.companyName})`}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Total Payable</span>
                    <span className="text-lg font-black text-amber-400 font-mono">
                      ₦{order.totalAmount.toLocaleString('en-NG')}
                    </span>
                  </div>
                  <button
                    onClick={() => onViewReceipt(order)}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold p-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
                    title="View Official Waybill"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Waybill & Gate Pass</span>
                  </button>
                </div>
              </div>

              {/* Status Visual Tracker */}
              {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
                <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                    Trailer Fulfillment Progression
                  </h4>
                  <div className="relative">
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-800 -z-0" />
                    <div
                      className="absolute top-4 left-4 h-0.5 bg-amber-500 transition-all duration-500 -z-0"
                      style={{
                        width: `${Math.min(100, Math.max(0, (currentStep / (steps.length - 1)) * 100))}%`,
                      }}
                    />

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 relative z-10">
                      {steps.map((st, i) => {
                        const isDone = i <= currentStep;
                        const isCurrent = i === currentStep;
                        return (
                          <div key={i} className="flex flex-col items-center text-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                                isDone
                                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/50'
                                  : 'bg-slate-800 text-slate-500 border border-slate-700'
                              } ${isCurrent ? 'ring-4 ring-amber-500/20 animate-pulse' : ''}`}
                            >
                              {isDone ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                            </div>
                            <span
                              className={`text-xs font-bold mt-2 ${
                                isDone ? 'text-white' : 'text-slate-500'
                              }`}
                            >
                              {st.label}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">
                              {st.desc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Transfer Submission Form (If customer order is still pending payment) */}
              {order.status === 'PENDING_PAYMENT' && order.paymentMethod === 'BANK_TRANSFER' && (
                <div className="bg-emerald-950/20 border border-emerald-800/50 p-5 rounded-2xl space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                      <Send className="w-4 h-4" /> Submit Bank Transfer Payment Reference
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      Have you transferred ₦{order.totalAmount.toLocaleString('en-NG')} to Zenith Bank? Enter your transaction reference below so our Treasury team can clear your trailers for loading.
                    </p>
                  </div>

                  {claimSuccess && (
                    <div className="p-3 bg-emerald-900/40 border border-emerald-700 text-emerald-200 text-xs rounded-xl">
                      {claimSuccess}
                    </div>
                  )}

                  <form onSubmit={handleSubmitTransferClaim} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Bank Session Ref / NIP Reference</label>
                      <input
                        type="text"
                        required
                        value={transferRef}
                        onChange={(e) => setTransferRef(e.target.value)}
                        placeholder="e.g. ZEN-SOK-992144"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Payer Account Holder / Company Name</label>
                      <input
                        type="text"
                        required
                        value={payerName}
                        onChange={(e) => setPayerName(e.target.value)}
                        placeholder="e.g. Dan-Kano Commercial Construction Ltd"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        disabled={isSubmittingClaim}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors active:scale-95"
                      >
                        {isSubmittingClaim ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Payment Claim to Treasury'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Fulfillment & Logistics Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                    Ordered Trailer Loads
                  </h4>
                  {order.items.map((it) => (
                    <div key={it.id} className="flex justify-between items-center py-1 border-b border-slate-800/80">
                      <div>
                        <span className="font-bold text-white block">{it.productName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {it.trailerCount} Trailer(s) • {it.totalBags.toLocaleString()} bags ({it.totalTonnes}T)
                        </span>
                      </div>
                      <span className="font-bold text-amber-400 font-mono">
                        ₦{it.subtotal.toLocaleString('en-NG')}
                      </span>
                    </div>
                  ))}
                  <div className="pt-1 flex justify-between font-bold text-slate-300">
                    <span>Total Allocation:</span>
                    <span>{order.totalTrailers} Trailer(s) (~{order.totalTonnes} Tonnes)</span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                    {order.fulfillmentType === 'FACTORY_TRAILER_HAULAGE' ? 'Articulated Haulage Info' : 'Factory Gate Clearance'}
                  </h4>
                  {order.fulfillmentType === 'FACTORY_TRAILER_HAULAGE' && order.deliveryDetails ? (
                    <>
                      <p className="text-white font-semibold">{order.deliveryDetails.siteAddress}</p>
                      <p className="text-slate-400">Landmark: {order.deliveryDetails.landmark || 'N/A'}</p>
                      <p className="text-slate-400">Corridor: {order.deliveryDetails.deliveryZone}</p>
                      {order.deliveryDetails.truckTractorHeadReg && (
                        <div className="p-2 bg-slate-900 rounded-lg border border-slate-700 text-amber-300 font-mono">
                          Tractor: <strong>{order.deliveryDetails.truckTractorHeadReg}</strong> | Bed: {order.deliveryDetails.trailerBedReg}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-white font-semibold">{order.collectionDetails?.plantDepotLocation}</p>
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Kalambaina Security Gate Pass</span>
                        <span className="text-xl font-black text-amber-400 font-mono tracking-widest">
                          {order.collectionDetails?.collectionPassCode}
                        </span>
                      </div>
                      <p className="text-slate-400">
                        Truck: {order.collectionDetails?.truckHeadReg} (Driver: {order.collectionDetails?.driverName})
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Cancellation option */}
              {order.status === 'PENDING_PAYMENT' && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 p-2 rounded-lg hover:bg-rose-950/30 transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{isCancelling ? 'Cancelling trailer order...' : 'Cancel Order & Release Reserved Trailers'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
