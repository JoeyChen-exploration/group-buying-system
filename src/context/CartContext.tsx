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
  dealDayItemId?: string;
  dealDayId?: string;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  isAuthenticated: boolean | null;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (productId: string, variantId: string | undefined, delta: number, dealDayItemId?: string) => void;
  setQuantity: (productId: string, variantId: string | undefined, qty: number, dealDayItemId?: string) => void;
  removeItem: (productId: string, variantId: string | undefined, dealDayItemId?: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "yuwei_cart";

function itemKey(productId: string, variantId?: string, dealDayItemId?: string) {
  return dealDayItemId ? `deal::${dealDayItemId}` : `${productId}::${variantId ?? ""}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => {
      setIsAuthenticated(d.success === true);
    }).catch(() => setIsAuthenticated(false));
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((newItem: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((prev) => {
      const k = itemKey(newItem.productId, newItem.variantId, newItem.dealDayItemId);
      const idx = prev.findIndex((i) => itemKey(i.productId, i.variantId, i.dealDayItemId) === k);
      if (idx >= 0) {
        return prev.map((i, j) => j === idx ? { ...i, quantity: i.quantity + (newItem.quantity ?? 1) } : i);
      }
      return [...prev, { ...newItem, quantity: newItem.quantity ?? 1 }];
    });
  }, []);

  const setQuantity = useCallback((productId: string, variantId: string | undefined, qty: number, dealDayItemId?: string) => {
    const k = itemKey(productId, variantId, dealDayItemId);
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => itemKey(i.productId, i.variantId, i.dealDayItemId) !== k)
        : prev.map((i) => itemKey(i.productId, i.variantId, i.dealDayItemId) === k ? { ...i, quantity: qty } : i)
    );
  }, []);

  const updateQuantity = useCallback((productId: string, variantId: string | undefined, delta: number, dealDayItemId?: string) => {
    const k = itemKey(productId, variantId, dealDayItemId);
    setItems((prev) => {
      const item = prev.find((i) => itemKey(i.productId, i.variantId, i.dealDayItemId) === k);
      if (!item) return prev;
      const next = item.quantity + delta;
      if (next <= 0) return prev.filter((i) => itemKey(i.productId, i.variantId, i.dealDayItemId) !== k);
      return prev.map((i) => itemKey(i.productId, i.variantId, i.dealDayItemId) === k ? { ...i, quantity: next } : i);
    });
  }, []);

  const removeItem = useCallback((productId: string, variantId: string | undefined, dealDayItemId?: string) => {
    const k = itemKey(productId, variantId, dealDayItemId);
    setItems((prev) => prev.filter((i) => itemKey(i.productId, i.variantId, i.dealDayItemId) !== k));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, totalItems, subtotal, isAuthenticated, addItem, updateQuantity, setQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
