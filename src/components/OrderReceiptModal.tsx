import React, { useRef, useEffect } from 'react';
import { X, Printer, ArrowLeft } from 'lucide-react';
import type { Order } from '../types/index.ts';

interface OrderReceiptModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({ order, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = order.paymentStatus === 'VERIFIED';
  const managerName = order.approvedByManagerName || 'Engr. Sanusi Kalambaina';
  const issuingAgentName =
    order.truckAllocations?.find((t) => t.issuedByAgentName)?.issuedByAgentName ||
    'Haruna Danladi';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm p-2 sm:p-4 md:p-6 flex justify-center items-start print:p-0 print:m-0 print:bg-white print:static print:overflow-visible print:inset-auto print:block"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-2 sm:my-6 flex flex-col print:border-none print:shadow-none print:bg-white print:text-black print:m-0 print:p-0 print:max-w-none print:w-full print:block">
        
        {/* Sticky Top Header Action Bar (Hidden in Print) */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-5 py-3 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md print:hidden shadow-md">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Return / Close Waybill"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Go Back</span>
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 truncate hidden sm:inline-block">
              Waybill &amp; Gate Pass
            </span>
            <span className="text-xs text-slate-400 font-mono font-semibold hidden md:inline-block">
              {order.orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-black px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF (A4)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Waybill"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Waybill & Gate Pass Body (Form-Fitted for Single A4 Page) */}
        <div
          ref={receiptRef}
          className="p-6 sm:p-8 space-y-4 print:space-y-2 bg-white text-slate-900 print:p-2 text-xs font-sans print-a4-fit"
        >
          {/* 1. Header with Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-3 print:pb-1.5 space-y-2 print:space-y-1">
            <div className="flex items-center justify-between gap-4">
              <div className="w-full max-w-xs sm:max-w-sm print:max-w-[210px]">
                <img
                  src="/assets/aistudio/image_8da756cd.png"
                  alt="A. A. MASTER NIG. LIMITED"
                  className="w-full h-auto max-h-16 print:max-h-11 object-contain object-left"
                />
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs sm:text-sm print:text-[11px] font-black uppercase text-blue-950 bg-blue-50 border border-blue-300 px-2.5 py-0.5 rounded block">
                  TRAILER WAYBILL &amp; GATE PASS
                </span>
                <span className="font-mono font-bold text-xs print:text-[10px] text-slate-900 block mt-0.5">
                  {order.orderNumber}
                </span>
                <span className="text-[10px] print:text-[8.5px] text-slate-500 block">
                  Date: {new Date(order.createdAt).toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>

            {/* Product & Plant Specification Strip */}
            <div className="flex flex-wrap items-center justify-between text-[10px] print:text-[8px] text-slate-700 bg-slate-50 print:bg-slate-100 px-2.5 py-1 print:py-0.5 rounded-lg border border-slate-200">
              <span>Sole Product: <strong>Sokoto Cement Kalambaina Plant Direct</strong></span>
              <span>Payload: <strong>600 Bags (30 Metric Tonnes) Per Truck</strong></span>
              <span>Office: <strong>080-36172280, 080-82111063</strong></span>
            </div>
          </div>

          {/* 2. Customer & Transporter Information Box (Compact 2-Column Grid in Print) */}
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-3 print:gap-2 bg-slate-50 p-3.5 print:p-2 rounded-xl border border-slate-200 text-xs print:text-[9px]">
            <div className="space-y-0.5">
              <span className="text-[10px] print:text-[8px] uppercase font-bold text-slate-500 block">
                Consignee (Customer / Contractor):
              </span>
              <p className="font-bold text-sm print:text-xs text-slate-900 leading-tight">{order.customerName}</p>
              {order.companyName && <p className="text-slate-800 font-semibold leading-tight">{order.companyName}</p>}
              <p className="text-slate-600 leading-tight">{order.customerPhone}</p>
              <p className="text-slate-600 leading-tight">{order.customerEmail}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] print:text-[8px] uppercase font-bold text-slate-500 block">
                Logistics: Ex-Factory Collection (Customer Transporter)
              </span>
              <p className="font-bold text-slate-900 leading-tight">
                {order.collectionDetails?.plantDepotLocation || 'Kalambaina Main Plant Loading Terminal'}
              </p>
              <p className="text-amber-800 font-mono font-bold text-xs print:text-[9.5px] leading-tight">
                Gate Clearance Passcode: {order.collectionDetails?.collectionPassCode || 'AAM-PASS-ACTIVE'}
              </p>
              <p className="text-slate-700 font-mono text-[11px] print:text-[8.5px] leading-tight">
                Truck Head: <strong>{order.collectionDetails?.truckHeadReg || 'CUSTOMER RIG'}</strong> | Bed: <strong>{order.collectionDetails?.trailerBedReg || 'FLATBED'}</strong>
              </p>
              <p className="text-slate-600 leading-tight text-[11px] print:text-[8.5px]">
                Transporter: {order.collectionDetails?.transporterName || 'Buyer Private Transporter'} {order.collectionDetails?.driverName ? `(Driver: ${order.collectionDetails.driverName})` : ''}
              </p>
              <p className="text-[9.5px] print:text-[7.5px] text-amber-900 italic leading-none">
                *Notice: The company does not handle delivery. All transport is customer-arranged.
              </p>
            </div>
          </div>

          {/* 3. Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs print:text-[9px]">
              <thead>
                <tr className="border-b-2 border-slate-300 text-[10px] print:text-[8px] font-black uppercase text-slate-600">
                  <th className="py-1.5 print:py-1">Item Description</th>
                  <th className="py-1.5 print:py-1 text-center">Trailers</th>
                  <th className="py-1.5 print:py-1 text-center">Bags Payload</th>
                  <th className="py-1.5 print:py-1 text-center">Net Weight</th>
                  <th className="py-1.5 print:py-1 text-right">Price / Trailer (₦)</th>
                  <th className="py-1.5 print:py-1 text-right">Total Amount (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-1.5 print:py-1 font-bold text-slate-900">
                      {item.productName}
                      <span className="block text-[9.5px] print:text-[7.5px] text-slate-500 font-mono">{item.sku}</span>
                    </td>
                    <td className="py-1.5 print:py-1 text-center font-bold text-slate-900">{item.trailerCount} Trailer(s)</td>
                    <td className="py-1.5 print:py-1 text-center font-mono">{item.totalBags.toLocaleString()} bags (50kg)</td>
                    <td className="py-1.5 print:py-1 text-center font-mono font-bold text-slate-900">{item.totalTonnes} Tonnes</td>
                    <td className="py-1.5 print:py-1 text-right font-mono">₦{item.unitPricePerTrailer.toLocaleString('en-NG')}</td>
                    <td className="py-1.5 print:py-1 text-right font-bold font-mono">₦{item.subtotal.toLocaleString('en-NG')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 4. Totals Breakdown */}
          <div className="flex justify-end pt-1 print:pt-0.5">
            <div className="w-72 print:w-64 space-y-1 print:space-y-0.5 text-xs print:text-[9px]">
              <div className="flex justify-between text-slate-600">
                <span>Total Trailers:</span>
                <span className="font-bold text-slate-900 font-mono">{order.totalTrailers} Articulated Trailer(s)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Net Total Bags:</span>
                <span className="font-mono text-slate-900">{order.totalBags.toLocaleString()} bags ({order.totalTonnes} Tonnes)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Trailers Subtotal:</span>
                <span className="font-mono text-slate-900">₦{order.subtotal.toLocaleString('en-NG')}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm print:text-[10px] font-black border-t-2 border-slate-900 pt-1 print:pt-0.5 text-slate-950">
                <span>Total Amount Paid (100%):</span>
                <span className="font-mono text-amber-800">₦{order.totalAmount.toLocaleString('en-NG')}</span>
              </div>
            </div>
          </div>

          {/* 5. Official Authorization & Signatures (Dual Manager & Agent Signoff) */}
          <div className="pt-2 print:pt-1 border-t border-slate-200 space-y-2 print:space-y-1">
            <div className="flex items-center justify-between text-[10px] print:text-[8px]">
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase text-slate-500">Payment Status:</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded font-bold uppercase text-[9px] print:text-[8px] ${
                    isPaid ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {order.paymentStatus} via {order.paymentMethod.replace('_', ' ')}
                </span>
                <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                  Lifecycle: <strong>{order.status}</strong>
                </span>
              </div>
              <div className="text-right text-slate-500 font-mono hidden sm:block print:block">
                Dual Endorsement Required for Gate Pass Release
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3 print:gap-2 pt-0.5">
              {/* Place 1: Authorized Sales & Issuing Agent */}
              <div className="bg-slate-50/90 p-2.5 print:p-2 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1 print:mb-0.5">
                    <span className="text-[10px] print:text-[8.5px] font-black uppercase text-amber-800 tracking-wider">
                      1. Sales &amp; Issuing Agent Signoff
                    </span>
                    <span className="text-[8.5px] print:text-[7.5px] px-1 py-0.2 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                      Loading &amp; Dispatch
                    </span>
                  </div>
                  <p className="text-[9.5px] print:text-[7.5px] text-slate-500 leading-tight">
                    Certified 600 bags (30T) payload per trailer loaded and verified.
                  </p>
                </div>

                <div className="mt-2.5 print:mt-1.5">
                  <div className="h-7 print:h-6 border-b-2 border-dashed border-slate-400 mb-1 flex items-end justify-between px-1">
                    <span className="text-[8.5px] print:text-[7px] font-mono text-slate-400 italic">Agent Signature &amp; Date</span>
                    <span className="text-[8.5px] print:text-[7px] font-mono font-bold text-amber-800">✓ TERMINAL ISSUED</span>
                  </div>
                  <div className="flex items-center justify-between text-[9.5px] print:text-[8px]">
                    <span className="font-bold text-slate-900">{issuingAgentName}</span>
                    <span className="text-slate-500 font-semibold">Sales &amp; Issuing Agent</span>
                  </div>
                </div>
              </div>

              {/* Place 2: General / Branch Manager Authorization */}
              <div className="bg-slate-50/90 p-2.5 print:p-2 rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1 print:mb-0.5">
                    <span className="text-[10px] print:text-[8.5px] font-black uppercase text-blue-950 tracking-wider">
                      2. General Manager Signoff
                    </span>
                    <span className="text-[8.5px] print:text-[7.5px] px-1 py-0.2 rounded bg-blue-100 text-blue-900 font-bold border border-blue-300">
                      Audit &amp; Finance Approved
                    </span>
                  </div>
                  <p className="text-[9.5px] print:text-[7.5px] text-slate-500 leading-tight">
                    100% full wire confirmed. Factory gate exit authorization granted.
                  </p>
                </div>

                <div className="mt-2.5 print:mt-1.5">
                  <div className="h-7 print:h-6 border-b-2 border-dashed border-slate-400 mb-1 flex items-end justify-between px-1">
                    <span className="text-[8.5px] print:text-[7px] font-mono text-slate-400 italic">Manager Signature / Stamp</span>
                    <span className="text-[8.5px] print:text-[7px] font-mono font-bold text-blue-800">✓ AUDIT AUTHORIZED</span>
                  </div>
                  <div className="flex items-center justify-between text-[9.5px] print:text-[8px]">
                    <span className="font-bold text-slate-900">{managerName}</span>
                    <span className="text-slate-500 font-semibold">General / Branch Manager</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 6. Legal Footer Note (Single Line in Print) */}
          <div className="text-[9px] print:text-[7.5px] text-slate-400 border-t border-slate-200 pt-2 print:pt-1 text-center leading-tight">
            Genuine Sokoto Cement manufactured under license at Kalambaina Works, Sokoto State. Standard 50kg bag valve packaging conforms strictly to Nigerian Industrial Standards (NIS 444-1:2018). Demurrage commences 24 hours after trailer arrival at customer site.
          </div>
        </div>

        {/* Sticky Bottom Action Bar (Hidden in Print) */}
        <div className="sticky bottom-0 z-30 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-3 shadow-2xl print:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Go Back / Close</span>
            </button>
            <span className="text-[11px] text-slate-400 hidden md:inline">
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">ESC</kbd> to return
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF (A4)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
