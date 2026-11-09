"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ShoppingBag, Trash2, TriangleAlert, X } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { lineTotalCents } from "@/lib/cart";
import { SafeImage } from "@/components/ui/safe-image";
import { useCart } from "./cart-provider";
import { QuantityStepper } from "./quantity-stepper";
import { CheckoutForm } from "./checkout-form";

/**
 * Slide-over cart. Uses a native <dialog> for focus trapping, Escape-to-close
 * and correct screen-reader semantics. Full-screen on mobile.
 */
export function CartDrawer() {
  const cart = useCart();
  const { isOpen, close, items, store } = cart;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [view, setView] = useState<"cart" | "checkout">("cart");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const money = (cents: number) => formatMoney(cents, store.currencyCode);
  const showCheckout = view === "checkout" && items.length > 0;

  return (
    <dialog
      ref={dialogRef}
      onClose={() => {
        close();
        setView("cart");
      }}
      onClick={(e) => {
        // Close when clicking the backdrop (outside the panel).
        if (e.target === e.currentTarget) close();
      }}
      aria-labelledby="cart-title"
      className="fixed inset-0 m-0 ml-auto h-dvh max-h-none w-full max-w-none bg-transparent p-0 sm:max-w-md"
    >
      <div className="flex h-full flex-col bg-white shadow-2xl">
        <header className="flex items-center gap-2 border-b border-stone-200 px-4 py-3">
          {showCheckout && (
            <button
              type="button"
              onClick={() => setView("cart")}
              className="flex size-10 items-center justify-center rounded-full hover:bg-stone-100"
              aria-label="Back to cart"
            >
              <ArrowLeft className="size-5" aria-hidden />
            </button>
          )}
          <h2 id="cart-title" className="flex-1 text-lg font-semibold text-stone-900">
            {showCheckout ? "Your details" : `Your cart${cart.itemCount ? ` (${cart.itemCount})` : ""}`}
          </h2>
          <button
            type="button"
            onClick={close}
            className="flex size-10 items-center justify-center rounded-full hover:bg-stone-100"
            aria-label="Close cart"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-stone-100">
              <ShoppingBag className="size-7 text-stone-400" aria-hidden />
            </div>
            <p className="mt-4 text-base font-semibold text-stone-900">Your cart is empty</p>
            <p className="mt-1 text-sm text-stone-600">Browse the catalog and add products to start an order.</p>
            <button
              type="button"
              onClick={close}
              className="mt-6 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-fg"
            >
              Continue shopping
            </button>
          </div>
        ) : showCheckout ? (
          <CheckoutForm />
        ) : (
          <>
            <ul className="flex-1 divide-y divide-stone-100 overflow-y-auto px-4">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-3 py-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-stone-100">
                    <SafeImage src={item.imageUrl} alt={item.name} sizes="80px" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-semibold text-stone-900">{item.name}</p>
                      <button
                        type="button"
                        onClick={() => cart.dispatch({ type: "remove", productId: item.productId })}
                        className="-mr-2 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-red-700"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                    {item.available ? (
                      <p className="text-sm text-stone-600 tabular-nums">{money(item.priceCents)} each</p>
                    ) : (
                      <p className="flex items-center gap-1 text-sm font-medium text-amber-700">
                        <TriangleAlert className="size-4" aria-hidden /> No longer available
                      </p>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      {item.available ? (
                        <QuantityStepper
                          size="sm"
                          quantity={item.quantity}
                          label={item.name}
                          onIncrement={() => cart.dispatch({ type: "increment", productId: item.productId })}
                          onDecrement={() => cart.dispatch({ type: "decrement", productId: item.productId })}
                        />
                      ) : (
                        <span className="text-xs text-stone-500">Please remove this item</span>
                      )}
                      {item.available && (
                        <p className="text-sm font-semibold tabular-nums text-stone-900">{money(lineTotalCents(item))}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-stone-200 bg-stone-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between text-stone-600">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{money(cart.subtotalCents)}</dd>
                </div>
                <div className="flex justify-between text-base font-bold text-stone-900">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{money(cart.totalCents)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-stone-500">No payment is taken on this website. The shop confirms your order on WhatsApp.</p>
              {cart.hasUnavailable && (
                <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  Some items are no longer available. Remove them to continue.
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => cart.dispatch({ type: "clear" })}
                  className="h-12 rounded-full border border-stone-300 px-4 text-sm font-medium text-stone-700 hover:bg-white"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setView("checkout")}
                  disabled={cart.hasUnavailable}
                  className="h-12 flex-1 rounded-full bg-accent text-base font-semibold text-accent-fg shadow-sm hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue to order
                </button>
              </div>
            </footer>
          </>
        )}
      </div>
    </dialog>
  );
}

