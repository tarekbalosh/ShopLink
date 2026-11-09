"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "./cart-provider";

export function CartButton() {
  const { itemCount, open } = useCart();
  return (
    <button
      type="button"
      onClick={open}
      className="relative inline-flex h-11 items-center gap-2 rounded-full border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-800 shadow-sm hover:bg-stone-50 sm:px-4"
      aria-label={`Open cart, ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
    >
      <ShoppingBag className="size-5" aria-hidden />
      <span className="hidden sm:inline">Cart</span>
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold leading-5 text-accent-fg tabular-nums sm:static sm:min-w-6">
          {itemCount}
        </span>
      )}
    </button>
  );
}

