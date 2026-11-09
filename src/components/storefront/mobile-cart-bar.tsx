"use client";

import { ShoppingBag } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { useCart } from "./cart-provider";

/** Sticky bottom bar on small screens so the cart is always one tap away. */
export function MobileCartBar() {
  const { itemCount, totalCents, store, open, isOpen } = useCart();
  if (itemCount === 0 || isOpen) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
      <button
        type="button"
        onClick={open}
        className="flex h-12 w-full items-center justify-between rounded-full bg-accent px-5 text-accent-fg shadow-md"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <ShoppingBag className="size-5" aria-hidden />
          View cart · {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
        <span className="text-sm font-bold tabular-nums">{formatMoney(totalCents, store.currencyCode)}</span>
      </button>
    </div>
  );
}

