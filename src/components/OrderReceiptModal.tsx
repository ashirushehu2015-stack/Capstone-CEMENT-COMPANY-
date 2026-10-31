import React, { useRef, useEffect } from 'react';
import { X, Printer, ArrowLeft, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';
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
  const managerName = order.approvedByManagerName || 'Uwaisu Musa';
  const issuingAgentName =
    order.truckAllocations?.find((t) => t.issuedByAgentName)?.issuedByAgentName ||
    'Isiyaka Sulaiman';
  const waybillNumber = `WB-${order.orderNumber.replace(/^(ORD-|AAM-)/, '')}`;
  const issueDateFormatted = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm p-2 sm:p-4 md:p-6 flex justify-center items-start print:p-0 print:m-0 print:bg-white print:static print:overflow-visible print:inset-auto print:block"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-2 sm:my-6 flex flex-col print:border-none print:shadow-none print:bg-white print:text-black print:m-0 print:p-0 print:max-w-none print:w-full print:block">
        
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
              Waybill &amp; Gate Pass (2 Pages)
            </span>
            <span className="text-xs text-slate-400 font-mono font-semibold hidden md:inline-block">
              {order.orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-black px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print 2-Page Waybill (A4)</span>
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

        {/* Printable Official Waybill & Gate Pass Document Body */}
        <div id="printable-waybill" ref={receiptRef} className="p-4 sm:p-8 space-y-8 print:space-y-0 bg-slate-100 print:bg-white text-slate-900 print:p-0">
          
          {/* ============================================================== */}
          {/* PAGE 1: COMMERCIAL WAYBILL & HAULAGE MANIFEST                   */}
          {/* ============================================================== */}
          <div className="print-page-1 bg-white p-6 sm:p-8 rounded-xl shadow-md print:shadow-none print:p-0 print:rounded-none flex flex-col justify-between border border-slate-200 print:border-none min-h-[720px] print:min-h-[268mm]">
            <div className="space-y-3.5 print:space-y-2.5">
              
              {/* 1. Official Corporate Letterhead */}
              <div className="border-b-2 border-slate-900 pb-2.5 space-y-1.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="w-full max-w-xs sm:max-w-sm print:max-w-[210px]">
                    <img
                      src="/assets/aistudio/image_8da756cd.png"
                      alt="A. A. MASTER NIG. LIMITED"
                      className="w-full h-auto max-h-16 print:max-h-12 object-contain object-left"
                    />
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm print:text-[11px] font-black uppercase text-blue-950 bg-blue-50 border border-blue-300 px-2.5 py-0.5 rounded inline-block">
                      TRAILER WAYBILL &amp; MANIFEST
                    </span>
                    <span className="text-[10px] print:text-[8px] font-bold uppercase text-slate-500 block mt-0.5">
                      PAGE 1 OF 2 (COMMERCIAL COPY)
                    </span>
                    <span className="font-mono font-bold text-xs print:text-[10px] text-slate-900 block mt-0.5">
                      {waybillNumber} / {order.orderNumber}
                    </span>
                    <span className="text-[10px] print:text-[8.5px] text-slate-600 block">
                      Issued: {issueDateFormatted}
                    </span>
                  </div>
                </div>

                {/* Product & Plant Specification Strip */}
                <div className="flex flex-wrap items-center justify-between text-[10px] print:text-[8px] text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                  <span>Product: <strong>Sokoto Cement Kalambaina Plant Direct</strong></span>
                  <span>Payload: <strong>600 Bags (30 Metric Tonnes) Per Trailer</strong></span>
                  <span>Contact: <strong>080-36172280, 080-82111063</strong></span>
                </div>
              </div>

              {/* 2. Consignee & Dispatch Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs print:text-[9px]">
                <div className="space-y-0.5">
                  <span className="text-[10px] print:text-[8px] uppercase font-bold text-slate-500 block">
                    Consignee (Customer / Contractor):
                  </span>
                  <p className="font-bold text-sm print:text-xs text-slate-900 leading-tight">{order.customerName}</p>
                  {order.companyName && <p className="text-slate-800 font-semibold leading-tight">{order.companyName}</p>}
                  <p className="text-slate-600 leading-tight">{order.customerPhone}</p>
                  <p className="text-slate-600 leading-tight">{order.customerEmail}</p>
                  <p className="text-slate-500 text-[10.5px] print:text-[8px] pt-0.5">
                    Destination: {order.deliveryDetails?.siteAddress || 'Customer Site / Designated Offloading Bay'}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] print:text-[8px] uppercase font-bold text-slate-500 block">
                    Logistics: Ex-Factory Collection (Customer Haulage)
                  </span>
                  <p className="font-bold text-slate-900 leading-tight">
                    {order.collectionDetails?.plantDepotLocation || 'Kalambaina Main Plant Loading Terminal'}
                  </p>
                  <p className="text-amber-800 font-mono font-bold text-xs print:text-[9.5px] leading-tight">
                    Gate Clearance Passcode: {order.collectionDetails?.collectionPassCode || 'AAM-PASS-ACTIVE'}
                  </p>
                  <p className="text-slate-700 font-mono text-[11px] print:text-[8.5px] leading-tight">
                    Tractor Head: <strong>{order.collectionDetails?.truckHeadReg || 'CUSTOMER RIG'}</strong> | Bed: <strong>{order.collectionDetails?.trailerBedReg || 'FLATBED'}</strong>
                  </p>
                  <p className="text-slate-600 leading-tight text-[11px] print:text-[8.5px]">
                    Transporter: {order.collectionDetails?.transporterName || 'Buyer Private Transporter'} {order.collectionDetails?.driverName ? `(Driver: ${order.collectionDetails.driverName})` : ''}
                  </p>
                  <p className="text-[9.5px] print:text-[7.5px] text-amber-900 italic leading-none pt-0.5">
                    *Ex-Factory Terms: All transit and offloading logistics are customer-arranged.
                  </p>
                </div>
              </div>

              {/* 3. Articulated Trailer Cargo Manifest Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs print:text-[9px]">
                  <thead>
                    <tr className="border-b-2 border-slate-300 text-[10px] print:text-[8px] font-black uppercase text-slate-600 bg-slate-50">
                      <th className="py-2 print:py-1 px-1.5">Cargo Description &amp; Grade</th>
                      <th className="py-2 print:py-1 text-center px-1">Trailers</th>
                      <th className="py-2 print:py-1 text-center px-1">Bags Payload</th>
                      <th className="py-2 print:py-1 text-center px-1">Net Weight</th>
                      <th className="py-2 print:py-1 text-right px-1">Price / Trailer</th>
                      <th className="py-2 print:py-1 text-right px-1.5">Total Amount (₦)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2 print:py-1 px-1.5 font-bold text-slate-900">
                          {item.productName}
                          <span className="block text-[9.5px] print:text-[7.5px] text-slate-500 font-mono">{item.sku}</span>
                        </td>
                        <td className="py-2 print:py-1 text-center font-bold text-slate-900 px-1">{item.trailerCount} Trailer(s)</td>
                        <td className="py-2 print:py-1 text-center font-mono px-1">{item.totalBags.toLocaleString()} bags (50kg)</td>
                        <td className="py-2 print:py-1 text-center font-mono font-bold text-slate-900 px-1">{item.totalTonnes} Tonnes</td>
                        <td className="py-2 print:py-1 text-right font-mono px-1">₦{item.unitPricePerTrailer.toLocaleString('en-NG')}</td>
                        <td className="py-2 print:py-1 text-right font-bold font-mono px-1.5">₦{item.subtotal.toLocaleString('en-NG')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4. Commercial Totals & Financial Settlement */}
              <div className="flex justify-end pt-1">
                <div className="w-72 print:w-64 space-y-1 text-xs print:text-[9px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Articulated Trailers Count:</span>
                    <span className="font-bold text-slate-900 font-mono">{order.totalTrailers} Trailer(s)</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Cumulative Bag Count:</span>
                    <span className="font-mono text-slate-900">{order.totalBags.toLocaleString()} bags ({order.totalTonnes} MT)</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Ex-Factory Subtotal:</span>
                    <span className="font-mono text-slate-900">₦{order.subtotal.toLocaleString('en-NG')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Terminal Handling / Loading:</span>
                    <span className="font-mono text-emerald-700 font-semibold">INCLUDED</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm print:text-[10px] font-black border-t-2 border-slate-900 pt-1.5 text-slate-950">
                    <span>Total Commercial Settlement:</span>
                    <span className="font-mono text-amber-800">₦{order.totalAmount.toLocaleString('en-NG')}</span>
                  </div>
                </div>
              </div>

              {/* 5. Payment Audit Verification Strip */}
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs print:text-[8.5px]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-800">Payment Status:</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded font-bold uppercase text-[9px] print:text-[8px] ${
                      isPaid ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {order.paymentStatus} (100% ADVANCE SETTLEMENT)
                  </span>
                  <span className="text-slate-600">via {order.paymentMethod.replace('_', ' ')}</span>
                </div>
                <div className="font-mono text-slate-500 font-semibold">
                  AUDIT ID: {order.orderNumber}-FIN-OK
                </div>
              </div>
            </div>

            {/* Page 1 Bottom Handover Notice */}
            <div className="border-t-2 border-slate-300 pt-2 text-center space-y-1">
              <div className="flex items-center justify-between text-[9.5px] print:text-[8px] text-slate-600 font-mono font-semibold">
                <span>A. A. MASTER NIG. LTD — HAULAGE MANIFEST</span>
                <span className="text-blue-900 font-bold uppercase">PAGE 1 OF 2 — SEE PAGE 2 FOR GATE PASS &amp; SIGNATURES</span>
                <span>PRINTED: {new Date().toLocaleDateString('en-GB')}</span>
              </div>
              <p className="text-[9px] print:text-[7.5px] text-slate-400">
                Official Commercial Document. Valid only with Page 2 Factory Gate Pass &amp; Dual Signatures attached.
              </p>
            </div>
          </div>

          {/* Screen Divider between Page 1 and Page 2 (Hidden in Print) */}
          <div className="py-2 flex items-center justify-center gap-3 print:hidden">
            <div className="h-px bg-slate-700 flex-1" />
            <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 rounded-full border border-slate-700 text-xs font-bold text-slate-300">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>PAGE 2: KALAMBAINA FACTORY GATE PASS &amp; DUAL SIGNOFF (BELOW)</span>
            </div>
            <div className="h-px bg-slate-700 flex-1" />
          </div>

          {/* ============================================================== */}
          {/* PAGE 2: FACTORY GATE PASS & DUAL AUTHORIZATION SIGNATURES       */}
          {/* ============================================================== */}
          <div className="print-page-2 bg-white p-6 sm:p-8 rounded-xl shadow-md print:shadow-none print:p-0 print:rounded-none flex flex-col justify-between border border-slate-200 print:border-none min-h-[720px] print:min-h-[268mm]">
            <div className="space-y-3 print:space-y-2">
              
              {/* 1. Official Corporate Letterhead */}
              <div className="border-b-2 border-slate-900 pb-2.5 space-y-1.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="w-full max-w-xs sm:max-w-sm print:max-w-[210px]">
                    <img
                      src="/assets/aistudio/image_8da756cd.png"
                      alt="A. A. MASTER NIG. LIMITED"
                      className="w-full h-auto max-h-16 print:max-h-12 object-contain object-left"
                    />
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm print:text-[11px] font-black uppercase text-amber-900 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded inline-block">
                      FACTORY GATE PASS &amp; CLEARANCE
                    </span>
                    <span className="text-[10px] print:text-[8px] font-bold uppercase text-slate-500 block mt-0.5">
                      PAGE 2 OF 2 (SECURITY &amp; AUDIT COPY)
                    </span>
                    <span className="font-mono font-bold text-xs print:text-[10px] text-slate-900 block mt-0.5">
                      REF: {order.orderNumber}
                    </span>
                    <span className="text-[10px] print:text-[8.5px] text-slate-600 block">
                      Works: Kalambaina Plant, Sokoto State
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[10px] print:text-[8px] text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                  <span>Exit Post: <strong>Main Works North Gate 2</strong></span>
                  <span>Weighbridge Station: <strong>WB-04 Automated Scale</strong></span>
                  <span>Security Dispatch: <strong>24/7 Operations Duty Room</strong></span>
                </div>
              </div>

              {/* 2. Weighbridge & Vehicle Dispatch Record */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs print:text-[9px]">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                  <span className="font-black uppercase text-slate-700 text-[10px] print:text-[8.5px]">
                    Kalambaina Weighbridge Gross / Tare Weight Certification
                  </span>
                  <span className="font-mono font-bold text-slate-600 text-[9.5px] print:text-[8px]">
                    Passcode: {order.collectionDetails?.collectionPassCode || 'AAM-PASS-ACTIVE'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-2 pt-0.5 font-mono">
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[9px] print:text-[7.5px] text-slate-500 block">Tractor Head / Bed</span>
                    <span className="font-bold text-slate-900 text-xs print:text-[9px]">{order.collectionDetails?.truckHeadReg || 'CUSTOMER RIG'}</span>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[9px] print:text-[7.5px] text-slate-500 block">Gross Weight (Laden)</span>
                    <span className="font-bold text-slate-900 text-xs print:text-[9px]">{((order.totalTonnes || 30) + 22.4).toFixed(2)} MT</span>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200">
                    <span className="text-[9px] print:text-[7.5px] text-slate-500 block">Tare Weight (Truck)</span>
                    <span className="font-bold text-slate-900 text-xs print:text-[9px]">22.40 MT</span>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-emerald-300 bg-emerald-50/50">
                    <span className="text-[9px] print:text-[7.5px] text-emerald-800 block font-bold">Net Cement Payload</span>
                    <span className="font-black text-emerald-900 text-xs print:text-[9px]">{order.totalTonnes || 30}.00 MT ({order.totalBags} Bags)</span>
                  </div>
                </div>
              </div>

              {/* 3. Physical Dispatch & Safety Verification Checklist */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 text-xs print:text-[9px]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-900" />
                  <span className="font-black uppercase text-slate-700 text-[10px] print:text-[8.5px]">
                    Terminal Loading &amp; Physical Safety Clearance Checklist
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-1.5 pt-0.5 text-[10px] print:text-[8px] text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold font-mono">☑</span>
                    <span>Standard 50kg valve bags intact; zero burst/leakage</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold font-mono">☑</span>
                    <span>Dual heavy-duty waterproof tarpaulins battened &amp; lashed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold font-mono">☑</span>
                    <span>Axle load balanced per Federal Highway safety specs</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-600 font-bold font-mono">☑</span>
                    <span>Transporter identity &amp; driver waybill receipt confirmed</span>
                  </div>
                </div>
              </div>

              {/* 4. Dual Endorsement Signatures (Requested by User: Place 1 = Agent, Place 2 = Manager) */}
              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-300 pb-1">
                  <span className="font-black uppercase text-slate-900 text-[11px] print:text-[9px]">
                    Statutory Dual Endorsement &amp; Gate Exit Authorization
                  </span>
                  <span className="text-[9.5px] print:text-[8px] text-slate-500 italic">
                    Both official stamps &amp; signatures mandatory before gate barrier release
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-3">
                  
                  {/* PLACE 1: Authorized Sales & Issuing Agent */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-300 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10.5px] print:text-[8.5px] font-black uppercase text-amber-900 tracking-wider">
                          1. Sales &amp; Issuing Agent
                        </span>
                        <span className="text-[8.5px] print:text-[7px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                          LOADING CLEARED
                        </span>
                      </div>
                      <p className="text-[9.5px] print:text-[7.5px] text-slate-600 leading-tight">
                        Certified that 600 bags (30 Tonnes) payload per trailer were physically inspected, loaded, and dispatched.
                      </p>
                    </div>

                    <div className="mt-4 print:mt-3">
                      <div className="h-8 print:h-7 border-b-2 border-dashed border-slate-400 mb-1 flex items-end justify-between px-1">
                        <span className="text-[8.5px] print:text-[7px] font-mono text-slate-400 italic">Signature &amp; Date Stamp</span>
                        <span className="text-[8.5px] print:text-[7px] font-mono font-bold text-amber-800">✓ TERMINAL VERIFIED</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] print:text-[8px]">
                        <div>
                          <span className="font-bold text-slate-900 block leading-tight">{issuingAgentName}</span>
                          <span className="text-slate-500 font-semibold block leading-tight">Sales &amp; Dispatch Agent</span>
                        </div>
                        <span className="font-mono text-slate-400 text-[9px] print:text-[7.5px]">{issueDateFormatted}</span>
                      </div>
                    </div>
                  </div>

                  {/* PLACE 2: General / Branch Manager */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-300 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10.5px] print:text-[8.5px] font-black uppercase text-blue-950 tracking-wider">
                          2. General Manager Signoff
                        </span>
                        <span className="text-[8.5px] print:text-[7px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-950 font-bold border border-blue-300">
                          EXECUTIVE RELEASE
                        </span>
                      </div>
                      <p className="text-[9.5px] print:text-[7.5px] text-slate-600 leading-tight">
                        100% full wire confirmed. Approved for immediate ex-factory exit from Kalambaina Works.
                      </p>
                    </div>

                    <div className="mt-4 print:mt-3">
                      <div className="h-8 print:h-7 border-b-2 border-dashed border-slate-400 mb-1 flex items-end justify-between px-1">
                        <span className="text-[8.5px] print:text-[7px] font-mono text-slate-400 italic">Executive Signature / Seal</span>
                        <span className="text-[8.5px] print:text-[7px] font-mono font-bold text-blue-900">✓ AUDIT AUTHORIZED</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] print:text-[8px]">
                        <div>
                          <span className="font-bold text-slate-900 block leading-tight">{managerName}</span>
                          <span className="text-slate-500 font-semibold block leading-tight">General / Branch Manager</span>
                        </div>
                        <span className="font-mono text-slate-400 text-[9px] print:text-[7.5px]">{issueDateFormatted}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Security Gate Exit Clearance Line */}
              <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-300 text-xs print:text-[8.5px] flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 uppercase block text-[9.5px] print:text-[8px]">
                    3. Security Gate Barrier Release (Exit Sentry):
                  </span>
                  <span className="text-slate-600 text-[9px] print:text-[7.5px] block">
                    Inspect physical truck number plate and driver waybill before barrier lift.
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[9.5px] print:text-[8px] font-mono">
                  <div className="border-b border-dashed border-slate-500 pb-0.5 min-w-[130px] text-center">
                    <span className="text-slate-400">Security Officer Signature</span>
                  </div>
                  <div className="border-b border-dashed border-slate-500 pb-0.5 min-w-[80px] text-center">
                    <span className="text-slate-400">Time Out: ____:____</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Statutory Terms & Conditions Footer on Page 2 */}
            <div className="border-t-2 border-slate-300 pt-2 text-center space-y-1">
              <div className="text-[8.5px] print:text-[7px] text-slate-500 leading-tight">
                <strong>Statutory Conditions of Carriage &amp; Ex-Factory Release:</strong> All cement is manufactured strictly in conformity with Nigerian Industrial Standards (NIS 444-1:2018). Once the transporter traverses the Kalambaina Works security boundary, title, transit insurance, and physical risk transfer exclusively to the consignee. Free discharge duration is strictly 24 hours from arrival at consignee site; standard daily demurrage charges apply thereafter.
              </div>
              <div className="flex items-center justify-between text-[8.5px] print:text-[7px] text-slate-400 font-mono">
                <span>KALAMBAINA WORKS GATE PASS</span>
                <span className="font-bold text-slate-600 uppercase">PAGE 2 OF 2 — SECURITY ARCHIVE COPY</span>
                <span>ORIGINAL COPY</span>
              </div>
            </div>
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
              <span>Print 2-Page Waybill (A4)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
