"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface CartItem {
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  image?: string;
  unitPrice: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (productId: string, variantId: string | undefined, delta: number) => void;
  setQuantity: (productId: string, variantId: string | undefined, qty: number) => void;
  removeItem: (productId: string, variantId: string | undefined) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "yuwei_cart";

function itemKey(productId: string, variantId?: string) {
  return `${productId}::${variantId ?? ""}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const k = itemKey(newItem.productId, newItem.variantId);
      const idx = prev.findIndex((i) => itemKey(i.productId, i.variantId) === k);
      if (idx >= 0) {
        return prev.map((i, j) => j === idx ? { ...i, quantity: i.quantity + (newItem.quantity ?? 1) } : i);
      }
      return [...prev, { ...newItem, quantity: newItem.quantity ?? 1 }];
    });
  }, []);

  const setQuantity = useCallback((productId: string, variantId: string | undefined, qty: number) => {
    const k = itemKey(productId, variantId);
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => itemKey(i.productId, i.variantId) !== k)
        : prev.map((i) => itemKey(i.productId, i.variantId) === k ? { ...i, quantity: qty } : i)
    );
  }, []);

  const updateQuantity = useCallback((productId: string, variantId: string | undefined, delta: number) => {
    const k = itemKey(productId, variantId);
    setItems((prev) => {
      const item = prev.find((i) => itemKey(i.productId, i.variantId) === k);
      if (!item) return prev;
      const next = item.quantity + delta;
      if (next <= 0) return prev.filter((i) => itemKey(i.productId, i.variantId) !== k);
      return prev.map((i) => itemKey(i.productId, i.variantId) === k ? { ...i, quantity: next } : i);
    });
  }, []);

  const removeItem = useCallback((productId: string, variantId: string | undefined) => {
    const k = itemKey(productId, variantId);
    setItems((prev) => prev.filter((i) => itemKey(i.productId, i.variantId) !== k));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, totalItems, subtotal, addItem, updateQuantity, setQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
