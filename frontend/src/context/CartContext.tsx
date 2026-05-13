import { createContext, useContext, useState, ReactNode } from "react";
import type { Product } from "../api/services";

export interface CartItem extends Product {
  qty: number;
}

interface CartCtx {
  items: CartItem[];
  add: (p: Product) => void;
  remove: (id: number) => void;
  setQty: (id: number, qty: number) => void;
  clear: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = (p: Product) =>
    setItems((prev) => {
      const existing = prev.find((x) => x.id === p.id);
      if (existing) return prev.map((x) => x.id === p.id ? { ...x, qty: x.qty + 1 } : x);
      return [...prev, { ...p, qty: 1 }];
    });

  const remove = (id: number) => setItems((prev) => prev.filter((x) => x.id !== id));

  const setQty = (id: number, qty: number) =>
    setItems((prev) =>
      qty <= 0
        ? prev.filter((x) => x.id !== id)
        : prev.map((x) => x.id === id ? { ...x, qty } : x)
    );

  const clear = () => setItems([]);

  const total = items.reduce((s, x) => s + x.birim_fiyat * x.qty, 0);
  const count = items.reduce((s, x) => s + x.qty, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}