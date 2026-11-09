"use client";

import { createContext, use, useCallback, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { cartTotals, type CartAction, type CartItem } from "@/lib/cart";
import { dispatchCart, getCartSnapshot, getServerCartSnapshot, subscribeCart } from "@/lib/cart-store";

/** Current catalog data for a product, used to show live prices/availability in the cart. */
export type LiveProduct = { priceCents: number; name: string; imageUrl: string | null };

export type StoreInfo = {
  shopName: string;
  currencyCode: string;
  whatsappConfigured: boolean;
  isDemo: boolean;
};

export type DisplayCartItem = CartItem & {
  /** False when the product is no longer in the public catalog. */
  available: boolean;
};

type CartContextValue = {
  store: StoreInfo;
  items: DisplayCartItem[];
  itemCount: number;
  subtotalCents: number;
  totalCents: number;
  hasUnavailable: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  dispatch: (action: CartAction) => void;
  quantityOf: (productId: string) => number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  store,
  liveProducts,
  children,
}: {
  store: StoreInfo;
  liveProducts: Record<string, LiveProduct>;
  children: ReactNode;
}) {
  const cart = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo<CartContextValue>(() => {
    // Prefer the latest catalog price; the server re-checks again at checkout.
    const items: DisplayCartItem[] = cart.items.map((item) => {
      const live = liveProducts[item.productId];
      return live
        ? { ...item, name: live.name, priceCents: live.priceCents, imageUrl: live.imageUrl, available: true }
        : { ...item, available: false };
    });
    const orderable = items.filter((i) => i.available);
    const totals = cartTotals(orderable);
    return {
      store,
      items,
      itemCount: cartTotals(items).itemCount,
      subtotalCents: totals.subtotalCents,
      totalCents: totals.totalCents,
      hasUnavailable: orderable.length !== items.length,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      dispatch: dispatchCart,
      quantityOf: (id) => cart.items.find((i) => i.productId === id)?.quantity ?? 0,
    };
  }, [cart, liveProducts, store, isOpen]);

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const ctx = use(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

/** Convenience hook for add-to-cart buttons. */
export function useAddToCart() {
  const { dispatch, open } = useCart();
  return useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1, openCart = false) => {
      dispatch({ type: "add", item, quantity });
      if (openCart) open();
    },
    [dispatch, open],
  );
}

