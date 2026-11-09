"use client";

import { useState, useTransition } from "react";
import { Check, Copy, ExternalLink, Info, MessageCircle, TriangleAlert } from "lucide-react";
import { prepareWhatsAppOrder, type PrepareWhatsAppOrderResult } from "@/app/actions/checkout";
import { formatMoney } from "@/lib/money";
import { useCart } from "./cart-provider";

export function CheckoutForm() {
  const cart = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<Extract<PrepareWhatsAppOrderResult, { ok: true }> | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const orderableItems = cart.items.filter((i) => i.available);
  const money = (cents: number) => formatMoney(cents, cart.store.currencyCode);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (orderableItems.length === 0) {
      setError("Your cart has no available items.");
      return;
    }

    startTransition(async () => {
      const result = await prepareWhatsAppOrder({
        customerName,
        customerPhone,
        note,
        items: orderableItems.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          seenPriceCents: i.priceCents,
        })),
      });

      if (!result.ok) {
        setError(result.error);
        setPrepared(null);
        return;
      }

      cart.dispatch({ type: "replace", items: result.updatedItems });
      setPrepared(result);

      // Automatically open WhatsApp when a valid number is configured and prices haven't changed unexpectedly.
      if (result.whatsappUrl && !result.priceChanged) {
        window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
      }
    });
  }

  async function copyMessage(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be permitted; ignore silently.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex-1 space-y-4 px-4 py-4">
        {!cart.store.whatsappConfigured && (
          <div
            role="status"
            className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden />
            <div>
              <p className="font-semibold">WhatsApp number not configured yet</p>
              <p className="mt-0.5 text-amber-800">
                The shop owner has not set a valid WhatsApp number in Shop Settings. You can still preview and copy your order message below.
              </p>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="checkout-name" className="block text-sm font-medium text-stone-900">
            Your name <span className="text-red-600">*</span>
          </label>
          <input
            id="checkout-name"
            name="customerName"
            type="text"
            required
            maxLength={120}
            value={customerName}
            onChange={(e) => {
              setCustomerName(e.target.value);
              setPrepared(null);
            }}
            placeholder="e.g. Amina Rahman"
            className="mt-1 h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="checkout-phone" className="block text-sm font-medium text-stone-900">
            Phone number <span className="text-xs font-normal text-stone-500">(optional)</span>
          </label>
          <input
            id="checkout-phone"
            name="customerPhone"
            type="tel"
            maxLength={40}
            value={customerPhone}
            onChange={(e) => {
              setCustomerPhone(e.target.value);
              setPrepared(null);
            }}
            placeholder="e.g. +60 12-345 6789"
            className="mt-1 h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="checkout-note" className="block text-sm font-medium text-stone-900">
            Order note <span className="text-xs font-normal text-stone-500">(optional)</span>
          </label>
          <textarea
            id="checkout-note"
            name="note"
            rows={3}
            maxLength={600}
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setPrepared(null);
            }}
            placeholder="Pickup time, slicing preference, or special requests…"
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none"
          />
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Order summary</p>
          <ul className="mt-2 divide-y divide-stone-200/70 text-sm">
            {orderableItems.map((item) => (
              <li key={item.productId} className="flex items-center justify-between gap-2 py-1.5">
                <span className="truncate text-stone-800">
                  {item.quantity} × {item.name}
                </span>
                <span className="shrink-0 font-medium tabular-nums text-stone-900">
                  {money(item.priceCents * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between border-t border-stone-200 pt-2 text-sm font-bold text-stone-900">
            <span>Total</span>
            <span className="tabular-nums">{money(cart.totalCents)}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl bg-stone-100 p-3 text-xs text-stone-700">
          <Info className="mt-0.5 size-4 shrink-0 text-stone-500" aria-hidden />
          <p>
            <strong>Important:</strong> Clicking the button below does not confirm or pay for your order. It opens WhatsApp with a pre-filled message — you must send the message and wait for the shop to confirm availability.
          </p>
        </div>

        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {prepared && (
          <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-sm">
            {prepared.priceChanged && (
              <p role="alert" className="rounded-lg bg-amber-100 p-2 text-xs font-medium text-amber-900">
                One or more product prices were updated since you added them. Please review the updated total below before sending on WhatsApp.
              </p>
            )}

            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-700">
                Ready WhatsApp message
              </p>
              <button
                type="button"
                onClick={() => copyMessage(prepared.message)}
                className="inline-flex items-center gap-1 rounded-full border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50"
              >
                {copied ? <Check className="size-3.5 text-emerald-700" /> : <Copy className="size-3.5" />}
                {copied ? "Copied" : "Copy text"}
              </button>
            </div>

            <pre className="max-h-44 overflow-y-auto whitespace-pre-wrap rounded-lg border border-stone-200 bg-white p-2.5 font-mono text-xs text-stone-800">
              {prepared.message}
            </pre>

            {prepared.whatsappUrl ? (
              <a
                href={prepared.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#15803d] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#166534]"
              >
                <MessageCircle className="size-4" aria-hidden />
                Open WhatsApp Conversation
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            ) : (
              <p role="status" className="text-xs font-medium text-amber-900">
                WhatsApp link unavailable because the shop has not configured a valid international WhatsApp number yet. Copy the message above to send it manually.
              </p>
            )}
          </div>
        )}
      </div>

      <footer className="border-t border-stone-200 bg-stone-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="submit"
          disabled={isPending || cart.hasUnavailable || orderableItems.length === 0}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-5 text-base font-semibold text-accent-fg shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MessageCircle className="size-5" aria-hidden />
          {isPending
            ? "Checking availability…"
            : cart.store.whatsappConfigured
              ? "Order via WhatsApp"
              : "Prepare Order Message"}
        </button>
      </footer>
    </form>
  );
}

