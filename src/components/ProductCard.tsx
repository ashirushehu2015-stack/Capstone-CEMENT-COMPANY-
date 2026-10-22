import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  Plus,
  Minus,
  Truck,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import type { Product } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';

interface ProductCardProps {
  product: Product;
  onViewSpecs: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onViewSpecs }) => {
  const { addItem } = useCart();
  const [selectedTrailers, setSelectedTrailers] = useState<number>(1); // Minimum 1 Trailer

  const isLowStock = product.availableTrailers <= product.reorderLevelTrailers;
  const isOutOfStock = product.availableTrailers <= 0;

  const handleIncrement = (amount = 1) => {
    setSelectedTrailers((prev) => Math.min(product.availableTrailers, prev + amount));
  };

  const handleDecrement = (amount = 1) => {
    setSelectedTrailers((prev) => Math.max(1, prev - amount));
  };

  const handleAddToCart = () => {
    if (selectedTrailers > 0 && selectedTrailers <= product.availableTrailers) {
      addItem(product, selectedTrailers);
    }
  };

  const calculatedSubtotal = selectedTrailers * product.pricePerTrailer;
  const calculatedBags = selectedTrailers * product.bagsPerTrailer;
  const calculatedTonnes = selectedTrailers * product.tonnesPerTrailer;

  return (
    <div className="bg-slate-900/90 rounded-3xl border border-slate-800 hover:border-amber-500/50 transition-all shadow-xl hover:shadow-2xl hover:shadow-amber-950/20 flex flex-col justify-between overflow-hidden group">
      {/* Product Image & Badges */}
      <div className="relative h-60 w-full overflow-hidden bg-slate-800">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="bg-slate-950/90 backdrop-blur-md text-amber-400 border border-amber-500/30 text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Sokoto Cement
          </span>
          <span className="bg-amber-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg shadow-sm">
            Grade {product.grade}
          </span>
        </div>

        {/* Live Authoritative Trailer Stock Badge */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div>
            {isOutOfStock ? (
              <span className="bg-rose-950/90 text-rose-300 border border-rose-800 text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Terminal Empty (0 Trailers)
              </span>
            ) : isLowStock ? (
              <span className="bg-amber-950/90 text-amber-300 border border-amber-700 text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Low Supply ({product.availableTrailers} Trailers left)
              </span>
            ) : (
              <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {product.availableTrailers} Trailers in Plant Yard ({(product.availableTrailers * product.bagsPerTrailer).toLocaleString()} Bags)
              </span>
            )}
          </div>
          <span className="text-[11px] text-amber-300 bg-slate-950/90 px-2 py-0.5 rounded font-mono font-bold">
            600 Bags / 30T
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-mono text-slate-400">{product.sku}</span>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                {product.name}
              </h3>
            </div>
            <button
              onClick={() => onViewSpecs(product)}
              className="text-slate-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="View Plant Technical Specifications"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Applications list */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.applications.slice(0, 2).map((app, i) => (
              <span
                key={i}
                className="text-[11px] bg-slate-800/80 text-slate-300 border border-slate-700/60 px-2 py-0.5 rounded"
              >
                {app}
              </span>
            ))}
          </div>

          {/* Trailer Price Tag */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-amber-400 font-['Plus_Jakarta_Sans']">
                ₦{product.pricePerTrailer.toLocaleString('en-NG')}
              </span>
              <span className="text-xs text-slate-400 ml-1">/ Trailer (600 Bags)</span>
            </div>
            <span className="text-xs text-emerald-400 font-mono font-bold">
              ₦{product.pricePerBagEquivalent.toLocaleString('en-NG')} / bag eq.
            </span>
          </div>
        </div>

        {/* Quantity Controls & Add to Cart (TRAILERS ONLY) */}
        <div className="pt-2 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Select Trailer Quantity:</span>
            <div className="flex items-center gap-1 font-mono">
              <button
                type="button"
                onClick={() => setSelectedTrailers(1)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
              >
                1 TRL (30T)
              </button>
              <button
                type="button"
                onClick={() => setSelectedTrailers(2)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
              >
                2 TRL (60T)
              </button>
              <button
                type="button"
                onClick={() => setSelectedTrailers(5)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
              >
                5 TRL (150T)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-slate-700 bg-slate-950 rounded-xl overflow-hidden">
              <button
                onClick={() => handleDecrement(1)}
                disabled={selectedTrailers <= 1 || isOutOfStock}
                className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent"
                title="Decrease trailer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="px-3 py-1 text-center font-black text-sm text-white font-mono">
                {selectedTrailers} {selectedTrailers === 1 ? 'Trailer' : 'Trailers'}
              </div>
              <button
                onClick={() => handleIncrement(1)}
                disabled={selectedTrailers >= product.availableTrailers || isOutOfStock}
                className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent"
                title="Increase trailer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/30 text-xs active:scale-95"
            >
              <Truck className="w-4 h-4" />
              <span>Add to Order (₦{calculatedSubtotal.toLocaleString('en-NG')})</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Payload: {calculatedBags.toLocaleString()} Bags (~{calculatedTonnes}T)</span>
            <span className="text-amber-400/90 font-sans font-semibold">Wholesale Trailers Only</span>
          </div>
        </div>
      </div>
    </div>
  );
};
