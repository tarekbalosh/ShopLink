"use client";

import { Minus, Plus } from "lucide-react";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/cart";

type Props = {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  label: string;
  size?: "sm" | "md";
};

export function QuantityStepper({ quantity, onIncrement, onDecrement, label, size = "md" }: Props) {
  const btn =
    size === "sm"
      ? "flex size-8 items-center justify-center rounded-full"
      : "flex size-10 items-center justify-center rounded-full";
  return (
    <div
      role="group"
      aria-label={`Quantity for ${label}`}
      className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white p-0.5"
    >
      <button
        type="button"
        onClick={onDecrement}
        className={`${btn} text-stone-700 hover:bg-stone-100`}
        aria-label={quantity === 1 ? `Remove ${label} from cart` : `Decrease quantity of ${label}`}
      >
        <Minus className="size-4" aria-hidden />
      </button>
      <span className="min-w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        disabled={quantity >= MAX_QUANTITY_PER_ITEM}
        className={`${btn} text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40`}
        aria-label={`Increase quantity of ${label}`}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
}

