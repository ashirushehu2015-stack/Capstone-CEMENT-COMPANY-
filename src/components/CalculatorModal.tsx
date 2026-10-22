import React, { useState } from 'react';
import { X, Calculator, Truck, Layers, Building, ArrowRight, ShieldCheck } from 'lucide-react';
import type { Product } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';

interface CalculatorModalProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorModal: React.FC<CalculatorModalProps> = ({ products, isOpen, onClose }) => {
  const { addItem } = useCart();
  const [calcMode, setCalcMode] = useState<'concrete' | 'blocks' | 'estate'>('concrete');

  // Concrete Inputs (m)
  const [lengthM, setLengthM] = useState<number>(30);
  const [widthM, setWidthM] = useState<number>(20);
  const [thicknessM, setThicknessM] = useState<number>(0.20); // 200mm commercial slab

  // Blocks Inputs (commercial block industry)
  const [blockCount, setBlockCount] = useState<number>(42000);
  const [blockSize, setBlockSize] = useState<'9_inch' | '6_inch'>('9_inch');

  // Estate Project Inputs
  const [housingUnits, setHousingUnits] = useState<number>(10); // 10 units estate

  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || 'prod_sokoto_425r'
  );

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  let rawBags = 0;
  let explanation = '';

  if (calcMode === 'concrete') {
    const volumeM3 = lengthM * widthM * thicknessM;
    rawBags = Math.ceil(volumeM3 * 6.5);
    explanation = `${volumeM3.toFixed(1)} m³ of commercial concrete at 6.5 bags/m³ standard structural 1:2:4 ratio.`;
  } else if (calcMode === 'blocks') {
    const yieldPerBag = blockSize === '9_inch' ? 35 : 48;
    rawBags = Math.ceil(blockCount / yieldPerBag);
    explanation = `${blockCount.toLocaleString()} ${blockSize === '9_inch' ? '9-inch' : '6-inch'} blocks at ${yieldPerBag} blocks per 50kg bag yield.`;
  } else {
    // Estate: avg 3-bedroom duplex requires ~600 bags (1 full trailer per duplex)
    rawBags = housingUnits * 600;
    explanation = `${housingUnits} estate residential duplex units at standard average 600 bags (1 Trailer) per unit structure.`;
  }

  // Calculate required full trailers (600 bags each, minimum 1 trailer)
  const bagsPerTrailer = selectedProduct?.bagsPerTrailer || 600;
  const recommendedTrailers = Math.max(1, Math.ceil(rawBags / bagsPerTrailer));
  const totalBagsSupplied = recommendedTrailers * bagsPerTrailer;
  const totalTonnes = recommendedTrailers * 30;
  const estimatedCost = recommendedTrailers * (selectedProduct?.pricePerTrailer || 6510000);

  const handleApplyToCart = () => {
    if (selectedProduct) {
      addItem(selectedProduct, recommendedTrailers);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Sokoto Cement Trailer Load Estimator</h2>
              <p className="text-xs text-slate-400">Calculate 30-Ton Articulated Trailer Loads (600 bags each) for projects</p>
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
          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              onClick={() => setCalcMode('concrete')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                calcMode === 'concrete'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5" /> Heavy Concrete
            </button>
            <button
              onClick={() => setCalcMode('blocks')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                calcMode === 'blocks'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Block Factory
            </button>
            <button
              onClick={() => setCalcMode('estate')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                calcMode === 'estate'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5" /> Mega Estate
            </button>
          </div>

          {/* Concrete Inputs */}
          {calcMode === 'concrete' && (
            <div className="space-y-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Heavy Slab, Raft Foundation & Columns Dimensions (Meters)
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Length (m)</label>
                  <input
                    type="number"
                    step="1"
                    value={lengthM}
                    onChange={(e) => setLengthM(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Width (m)</label>
                  <input
                    type="number"
                    step="1"
                    value={widthM}
                    onChange={(e) => setWidthM(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Thickness (m)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={thicknessM}
                    onChange={(e) => setThicknessM(Math.max(0.05, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Block Moulding Inputs */}
          {calcMode === 'blocks' && (
            <div className="space-y-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Commercial Block Factory Batch Target
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Block Type</label>
                  <select
                    value={blockSize}
                    onChange={(e) => setBlockSize(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold"
                  >
                    <option value="9_inch">9-inch Sandcrete Blocks (35/bag)</option>
                    <option value="6_inch">6-inch Sandcrete Blocks (48/bag)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Total Blocks to Mould</label>
                  <input
                    type="number"
                    step="1000"
                    value={blockCount}
                    onChange={(e) => setBlockCount(Math.max(1000, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Estate Inputs */}
          {calcMode === 'estate' && (
            <div className="space-y-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Estate Construction Units
              </h4>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Number of Duplexes / Buildings</label>
                <input
                  type="number"
                  step="1"
                  value={housingUnits}
                  onChange={(e) => setHousingUnits(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Rule of thumb: 1 full 30-ton trailer (600 bags) per standard 3-bedroom duplex carcass structure.
                </span>
              </div>
            </div>
          )}

          {/* Grade Selector */}
          <div>
            <label className="text-xs text-slate-400 block mb-1 font-semibold">Select Sokoto Cement Grade</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-medium"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ₦{p.pricePerTrailer.toLocaleString('en-NG')} / Trailer (600 Bags)
                </option>
              ))}
            </select>
          </div>

          {/* Result Calculation Card */}
          <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
                  Wholesale Trailer Allocation
                </span>
                <span className="text-3xl font-black text-white font-['Plus_Jakarta_Sans']">
                  {recommendedTrailers} {recommendedTrailers === 1 ? 'Trailer' : 'Trailers'}
                </span>
                <span className="text-xs text-slate-400 ml-2 block sm:inline">
                  ({totalBagsSupplied.toLocaleString()} Bags • {totalTonnes} Metric Tonnes)
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Trailer Cost</span>
                <span className="text-2xl font-black text-amber-400 font-mono">
                  ₦{estimatedCost.toLocaleString('en-NG')}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 border-t border-slate-800/80 pt-2">
              <strong>Calculation Basis:</strong> {explanation} (Requires {rawBags.toLocaleString()} bags, rounded to {recommendedTrailers} full 600-bag articulated trailers).
            </p>

            <div className="flex items-center gap-2 text-xs text-amber-200/90 bg-amber-950/40 p-2.5 rounded-xl border border-amber-900/40">
              <Truck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Dispatched via {recommendedTrailers} Articulated 30-Ton Multi-Axle Trailer(s) direct from Kalambaina Plant.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyToCart}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-amber-950/30 flex items-center gap-2 text-sm transition-all active:scale-95"
          >
            Add {recommendedTrailers} Trailer(s) to Order <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
