import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product } from '../types/index.ts';

export interface CartItem {
  product: Product;
  trailerCount: number; // In full Trailers (600 bags / 30 tonnes per trailer)
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, trailers?: number) => void;
  setSingleItem: (product: Product, trailers?: number) => void;
  updateQuantity: (productId: string, trailers: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  totalTrailers: number;
  totalBags: number;
  totalWeightTonnes: number;
  subtotalNGN: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CART_STORAGE_KEY = 'sokoto_cement_trailer_cart';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (it) =>
          it &&
          it.product &&
          typeof it.product.id === 'string' &&
          typeof it.product.pricePerTrailer === 'number' &&
          typeof it.trailerCount === 'number' &&
          it.trailerCount > 0
      );
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to persist cart', e);
    }
  }, [items]);

  const setSingleItem = (product: Product, trailers = 1) => {
    if (!product || !product.id) return;
    const validTrailers = Math.max(1, trailers);
    setItems([{ product, trailerCount: validTrailers }]);
  };

  const addItem = (product: Product, trailers = 1) => {
    if (!product || !product.id) return;
    const validTrailers = Math.max(1, trailers);
    setItems((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        return prev.map((it) =>
          it.product.id === product.id
            ? { ...it, trailerCount: it.trailerCount + validTrailers }
            : it
        );
      }
      return [...prev, { product, trailerCount: validTrailers }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, trailers: number) => {
    if (trailers <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((it) => (it.product.id === productId ? { ...it, trailerCount: trailers } : it))
    );
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((it) => it.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalTrailers = items.reduce((acc, it) => acc + (it?.trailerCount || 0), 0);
  const totalBags = items.reduce(
    (acc, it) => acc + (it?.trailerCount || 0) * (it?.product?.bagsPerTrailer || 600),
    0
  );
  const totalWeightTonnes = totalTrailers * 30; // 30 Metric Tonnes per trailer
  const subtotalNGN = items.reduce(
    (acc, it) => acc + (it?.product?.pricePerTrailer || 6510000) * (it?.trailerCount || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        setSingleItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalTrailers,
        totalBags,
        totalWeightTonnes,
        subtotalNGN,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
