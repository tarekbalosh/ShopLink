"use server";

import { z } from "zod";
import { MAX_CART_LINES, MAX_QUANTITY_PER_ITEM } from "@/lib/cart";
import { getFreshPublicCatalog } from "@/lib/data";
import { multiplyCents } from "@/lib/money";
import {
  buildOrderMessage,
  buildWhatsAppUrl,
  cleanText,
  isValidWhatsAppNumber,
  type OrderLine,
} from "@/lib/whatsapp";

const checkoutInputSchema = z.object({
  customerName: z
    .string()
    .transform((s) => cleanText(s))
    .pipe(z.string().min(1, "Please enter your name.").max(120, "Name is too long.")),
  customerPhone: z
    .string()
    .optional()
    .transform((s) => (s ? cleanText(s) : ""))
    .pipe(z.string().max(40, "Phone number is too long.")),
  note: z
    .string()
    .optional()
    .transform((s) => (s ? cleanText(s, { multiline: true }) : ""))
    .pipe(z.string().max(600, "Order note must be 600 characters or fewer.")),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
        seenPriceCents: z.number().int().min(0),
      }),
    )
    .min(1, "Your cart is empty.")
    .max(MAX_CART_LINES),
});

export type PrepareWhatsAppOrderInput = z.input<typeof checkoutInputSchema>;

export type PrepareWhatsAppOrderResult =
  | {
      ok: true;
      whatsappUrl: string | null;
      whatsappConfigured: boolean;
      message: string;
      priceChanged: boolean;
      subtotalCents: number;
      totalCents: number;
      currencyCode: string;
      updatedItems: Array<{
        productId: string;
        name: string;
        priceCents: number;
        imageUrl: string | null;
        quantity: number;
      }>;
    }
  | {
      ok: false;
      error: string;
      unavailableIds?: string[];
    };

/**
 * Re-validates every cart item against the current public catalog on the server
 * before building the WhatsApp message and URL.
 */
export async function prepareWhatsAppOrder(
  rawInput: PrepareWhatsAppOrderInput,
): Promise<PrepareWhatsAppOrderResult> {
  const parsed = checkoutInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return {
      ok: false,
      error: firstIssue?.message ?? "Please check your order details and try again.",
    };
  }

  const { customerName, customerPhone, note, items } = parsed.data;

  try {
    const catalog = await getFreshPublicCatalog();
    const productMap = new Map(catalog.products.map((p) => [p.id, p]));

    const unavailableIds: string[] = [];
    const lines: OrderLine[] = [];
    const updatedItems: Array<{
      productId: string;
      name: string;
      priceCents: number;
      imageUrl: string | null;
      quantity: number;
    }> = [];
    let subtotalCents = 0;
    let priceChanged = false;

    for (const item of items) {
      const live = productMap.get(item.productId);
      if (!live || !live.isAvailable) {
        unavailableIds.push(item.productId);
        continue;
      }

      if (live.priceCents !== item.seenPriceCents) {
        priceChanged = true;
      }

      const lineTotalCents = multiplyCents(live.priceCents, item.quantity);
      subtotalCents += lineTotalCents;

      lines.push({
        name: live.name,
        quantity: item.quantity,
        unitPriceCents: live.priceCents,
        lineTotalCents,
      });

      updatedItems.push({
        productId: live.id,
        name: live.name,
        priceCents: live.priceCents,
        imageUrl: live.imageUrl,
        quantity: item.quantity,
      });
    }

    if (unavailableIds.length > 0) {
      return {
        ok: false,
        error:
          "One or more items in your cart are no longer available. Please remove them and review your cart.",
        unavailableIds,
      };
    }

    const totalCents = subtotalCents;
    const message = buildOrderMessage({
      shopName: catalog.settings.shopName,
      currencyCode: catalog.settings.currencyCode,
      customerName,
      customerPhone: customerPhone || null,
      note: note || null,
      lines,
      subtotalCents,
      totalCents,
    });

    const number = catalog.settings.whatsappNumber;
    const whatsappConfigured = isValidWhatsAppNumber(number);
    const whatsappUrl = whatsappConfigured ? buildWhatsAppUrl(number, message) : null;

    return {
      ok: true,
      whatsappUrl,
      whatsappConfigured,
      message,
      priceChanged,
      subtotalCents,
      totalCents,
      currencyCode: catalog.settings.currencyCode,
      updatedItems,
    };
  } catch {
    return {
      ok: false,
      error: "Could not verify product availability right now. Please try again.",
    };
  }
}

