import React, { useState } from 'react';
import { X, CheckCircle, Shield, Award, Layers, Plus, Minus, Truck, Building2 } from 'lucide-react';
import type { Product } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { addItem } = useCart();
  const [trailers, setTrailers] = useState(1);

  if (!product) return null;

  const subtotal = trailers * (product.pricePerTrailer || 6510000);
  const totalBags = trailers * (product.bagsPerTrailer || 600);
  const totalTonnes = trailers * (product.trailerWeightTonnes || (product as any).tonnesPerTrailer || 30);

  const handleAdd = () => {
    addItem(product, trailers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
                Sokoto Cement • Kalambaina Plant
              </span>
              <span className="text-xs font-mono text-slate-400">{product.sku}</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{product.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* Top Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">Specification</span>
              <span className="text-lg font-black text-amber-400">NIS 444-1</span>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">Trailer Payload</span>
              <span className="text-lg font-black text-white">600 Bags (30T)</span>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">Trailer Price</span>
              <span className="text-lg font-black text-emerald-400">₦{(product.pricePerTrailer || 6510000).toLocaleString('en-NG')}</span>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block">Plant Yard Stock</span>
              <span className="text-lg font-black text-cyan-400">{product.availableTrailers} Trailers</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" /> Plant Technical Profile
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              {product.description}
            </p>
          </div>

          {/* Recommended Applications */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-400" /> Wholesale Structural Applications
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(product.applications || []).map((app, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/50 text-xs text-slate-200">
                  <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{app}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key Product Features */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" /> Factory Standards & Logistics Guarantees
            </h4>
            <div className="space-y-1.5">
              {(
                (product as any).features || [
                  product.certification || 'SON Mandatory Conformity Assessment Programme (MANCAP) — NIS 444-1:2014 Certified',
                  '600 Standard 50kg Valve Bags (30 Metric Tonnes) per Articulated Trailer',
                  'Ex-Factory Kalambaina Plant Loading Bay Direct Issuance',
                ]
              ).map((feat: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Wholesale Policy Notice */}
          <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-2xl space-y-1">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Wholesale Trailer Sales Policy
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              This terminal operates exclusively in full trailer units (600 standard 50kg bags / 30 Metric Tonnes per trailer). Single retail bags are not handled. Haulage can be scheduled direct from Kalambaina Plant or collected at factory gate with certified articulated flatbed trucks.
            </p>
          </div>
        </div>

        {/* Footer with Trailer Quantity Selector */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-bold">Trailers:</span>
            <div className="flex items-center border border-slate-700 bg-slate-950 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setTrailers((prev) => Math.max(1, prev - 1))}
                className="p-2 text-slate-400 hover:text-white"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-20 text-center font-bold text-white text-xs font-mono">
                {trailers} {trailers === 1 ? 'Trailer' : 'Trailers'}
              </span>
              <button
                type="button"
                onClick={() => setTrailers((prev) => Math.min(product.availableTrailers, prev + 1))}
                className="p-2 text-slate-400 hover:text-white"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs font-mono text-slate-400">
              ({totalBags.toLocaleString()} Bags • {totalTonnes}T)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Trailer Cost</span>
              <span className="text-lg font-black text-amber-400 font-mono">₦{subtotal.toLocaleString('en-NG')}</span>
            </div>
            <button
              onClick={handleAdd}
              className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-lg shadow-amber-950/30 flex items-center gap-2 text-xs transition-all active:scale-95"
            >
              <Truck className="w-4 h-4" /> Add {trailers} Trailer(s) to Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
