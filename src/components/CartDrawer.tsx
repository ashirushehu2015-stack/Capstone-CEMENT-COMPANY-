import React from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Truck,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    totalTrailers,
    totalBags,
    totalWeightTonnes,
    subtotalNGN,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  if (!isCartOpen) return null;

  const hasItems = items.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Sokoto Cement Trailer Cart</h2>
                <p className="text-xs text-slate-400">
                  {totalTrailers} {totalTrailers === 1 ? 'Trailer' : 'Trailers'} • {totalBags.toLocaleString()} Bags • {totalWeightTonnes}T
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!hasItems ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 mb-4">
                  <Truck className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-300">No trailers selected</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Order authentic Sokoto Cement trailer loads (600 bags / 30 tonnes).
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-6 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                >
                  Browse Trailer Catalog
                </button>
              </div>
            ) : (
              items.map(({ product, trailerCount }) => {
                const lineTotal = (product.pricePerTrailer || 6510000) * trailerCount;
                const lineBags = trailerCount * (product.bagsPerTrailer || 600);
                const lineTonnes = trailerCount * (product.trailerWeightTonnes || (product as any).tonnesPerTrailer || 30);
                return (
                  <div
                    key={product.id}
                    className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Sokoto Cement • 600 Bags / 30T
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1">{product.name}</h4>
                        <span className="text-xs text-emerald-400 font-mono font-semibold">
                          ₦{product.pricePerTrailer.toLocaleString('en-NG')} / Trailer
                        </span>
                      </div>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Remove product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <div className="flex items-center border border-slate-700 bg-slate-900 rounded-xl overflow-hidden">
                        <button
                          onClick={() => updateQuantity(product.id, trailerCount - 1)}
                          className="p-2 text-slate-400 hover:text-white"
                          title="Decrease 1 Trailer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-20 text-center font-bold text-xs text-white font-mono">
                          {trailerCount} {trailerCount === 1 ? 'Trailer' : 'Trailers'}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, trailerCount + 1)}
                          className="p-2 text-slate-400 hover:text-white"
                          title="Increase 1 Trailer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-amber-400 block font-mono">
                          ₦{lineTotal.toLocaleString('en-NG')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {lineBags.toLocaleString()} bags (~{lineTonnes}T)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Footer */}
          {hasItems && (
            <div className="p-6 border-t border-slate-800 bg-slate-900/90 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Total Trailer Allocation</span>
                  <span className="font-bold text-white">{totalTrailers} {totalTrailers === 1 ? 'Trailer' : 'Trailers'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Bag Quantity</span>
                  <span className="font-bold text-white">{totalBags.toLocaleString()} Bags (50kg each)</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Gross Net Weight</span>
                  <span className="font-bold text-white">{totalWeightTonnes} Metric Tonnes</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800">
                  <span>Trailers Subtotal</span>
                  <span className="font-extrabold text-amber-400 text-base font-mono">
                    ₦{subtotalNGN.toLocaleString('en-NG')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={clearCart}
                  className="px-3 py-3 border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-xl transition-colors text-xs font-semibold"
                  title="Empty cart"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    onProceedToCheckout();
                  }}
                  className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 text-sm transition-all active:scale-95"
                >
                  <span>Proceed to Wholesale Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
