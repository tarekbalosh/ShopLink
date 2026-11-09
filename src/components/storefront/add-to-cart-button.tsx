"use client";

import { ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/types";
import { useAddToCart, useCart } from "./cart-provider";
import { QuantityStepper } from "./quantity-stepper";

type Props = {
  product: Pick<Product, "id" | "name" | "priceCents" | "imageUrl" | "isAvailable">;
  variant?: "card" | "detail";
};

/** Add-to-cart button that turns into a quantity stepper once the item is in the cart. */
export function AddToCartButton({ product, variant = "card" }: Props) {
  const { quantityOf, dispatch } = useCart();
  const add = useAddToCart();
  const quantity = quantityOf(product.id);

  if (!product.isAvailable) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-full bg-stone-100 px-4 text-sm font-medium text-stone-500"
      >
        Unavailable
      </button>
    );
  }

  if (quantity > 0) {
    return (
      <QuantityStepper
        quantity={quantity}
        label={product.name}
        size={variant === "detail" ? "md" : "sm"}
        onIncrement={() => dispatch({ type: "increment", productId: product.id })}
        onDecrement={() => dispatch({ type: "decrement", productId: product.id })}
      />
    );
  }

  const base =
    "inline-flex items-center justify-center gap-2 rounded-full bg-accent font-semibold text-accent-fg shadow-sm transition hover:brightness-95 active:brightness-90";
  const sizing = variant === "detail" ? "h-12 px-6 text-base w-full sm:w-auto" : "h-9 px-4 text-sm";

  return (
    <button
      type="button"
      className={`${base} ${sizing}`}
      onClick={() =>
        add({
          productId: product.id,
          name: product.name,
          priceCents: product.priceCents,
          imageUrl: product.imageUrl,
        })
      }
      aria-label={`Add ${product.name} to cart`}
    >
      <ShoppingBag className="size-4" aria-hidden />
      Add
      {variant === "detail" && " to cart"}
    </button>
  );
}

