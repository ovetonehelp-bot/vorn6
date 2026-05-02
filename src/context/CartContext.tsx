import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface CartItem {
  variantId: number;
  productHandle: string;
  productTitle: string;
  variantTitle: string;
  image: string;
  price: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number, opts?: { openDrawer?: boolean; replace?: boolean }) => void;
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  clear: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "ovetone_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, hydrated]);

  const addItem: CartContextType["addItem"] = (item, qty = 1, opts) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (existing) {
        const nextQty = opts?.replace ? qty : existing.quantity + qty;
        return prev.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: nextQty, price: item.price } : i,
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
    if (opts?.openDrawer !== false) setOpen(true);
  };

  const removeItem = (variantId: number) =>
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));

  const updateQuantity = (variantId: number, quantity: number) => {
    if (quantity <= 0) return removeItem(variantId);
    setItems((prev) =>
      prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i)),
    );
  };

  const clear = () => setItems([]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clear, totalItems, totalPrice, isOpen, setOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}