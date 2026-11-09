import { describe, expect, it } from "vitest";
import {
  cartReducer,
  cartTotals,
  emptyCart,
  lineTotalCents,
  sanitizeCartItems,
} from "@/lib/cart";
import { accentPalette, contrastRatio } from "@/lib/color";
import {
  centsToDecimalString,
  formatMoney,
  parsePriceInput,
  toCents,
} from "@/lib/money";
import {
  buildOrderMessage,
  buildWhatsAppUrl,
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber,
} from "@/lib/whatsapp";
import { prepareWhatsAppOrder } from "@/app/actions/checkout";
import { normalizePasswordDigits, verifyAdminPassword } from "@/lib/auth";
import { demoCatalog } from "@/lib/demo-data";

describe("Money decimal handling", () => {
  it("converts decimal strings and numbers to integer cents without float drift", () => {
    expect(toCents("19.99")).toBe(1999);
    expect(toCents("0.10")).toBe(10);
    expect(toCents("0.20")).toBe(20);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(centsToDecimalString(1999)).toBe("19.99");
    expect(centsToDecimalString(5)).toBe("0.05");
  });

  it("validates user-entered prices strictly", () => {
    expect(parsePriceInput("12")).toBe(1200);
    expect(parsePriceInput("12.5")).toBe(1250);
    expect(parsePriceInput("1,299.95")).toBe(129995);
    expect(parsePriceInput("-5")).toBeNull();
    expect(parsePriceInput("12.999")).toBeNull();
    expect(parsePriceInput("abc")).toBeNull();
  });

  it("formats currency with ISO code", () => {
    expect(formatMoney(1800, "MYR")).toContain("18.00");
    expect(formatMoney(2550, "USD")).toContain("25.50");
  });
});

describe("Cart reducer and totals", () => {
  const sampleItem = {
    productId: "prod-1",
    name: "Country Sourdough Loaf",
    priceCents: 1800,
    imageUrl: "/demo/sourdough-loaf.jpg",
  };

  it("adds items, increments, decrements, removes, and computes exact totals", () => {
    let state = cartReducer(emptyCart, { type: "add", item: sampleItem, quantity: 2 });
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(2);

    state = cartReducer(state, { type: "increment", productId: "prod-1" });
    expect(state.items[0].quantity).toBe(3);
    expect(lineTotalCents(state.items[0])).toBe(5400);

    const secondItem = {
      productId: "prod-2",
      name: "Butter Croissant",
      priceCents: 1100,
      imageUrl: null,
    };
    state = cartReducer(state, { type: "add", item: secondItem, quantity: 1 });

    const totals = cartTotals(state.items);
    expect(totals.itemCount).toBe(4);
    expect(totals.subtotalCents).toBe(6500);
    expect(totals.totalCents).toBe(6500);

    // Decrement to zero removes the item
    state = cartReducer(state, { type: "decrement", productId: "prod-2" });
    expect(state.items).toHaveLength(1);

    state = cartReducer(state, { type: "remove", productId: "prod-1" });
    expect(state.items).toHaveLength(0);
  });

  it("sanitizes untrusted localStorage cart payloads", () => {
    const cleaned = sanitizeCartItems([
      { productId: "p1", name: "Bread", priceCents: 1000, imageUrl: null, quantity: 2 },
      { productId: "p1", name: "Duplicate", priceCents: 1000, imageUrl: null, quantity: 1 },
      { productId: "", name: "Bad ID", priceCents: 1000, quantity: 1 },
      { productId: "p2", name: "Negative price", priceCents: -100, quantity: 1 },
    ]);
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0].productId).toBe("p1");
  });
});

describe("WhatsApp ordering and URL encoding", () => {
  it("validates international digits-only WhatsApp numbers", () => {
    expect(isValidWhatsAppNumber("60123456789")).toBe(true);
    expect(isValidWhatsAppNumber("966501234567")).toBe(true);
    expect(isValidWhatsAppNumber("+60123456789")).toBe(false);
    expect(isValidWhatsAppNumber("0123456789")).toBe(false);
    expect(isValidWhatsAppNumber("12345")).toBe(false);
    expect(isValidWhatsAppNumber(null)).toBe(false);
    expect(normalizeWhatsAppNumber("+60 12-345 6789")).toBe("60123456789");
  });

  it("builds a complete order message and safely encodes the wa.me URL", () => {
    const message = buildOrderMessage({
      shopName: "Harmoni Bakery",
      currencyCode: "MYR",
      customerName: "Amina & Co.",
      customerPhone: "+60 12-345 6789",
      note: "Please slice the sourdough loaf.",
      lines: [
        {
          name: "Country Sourdough Loaf",
          quantity: 2,
          unitPriceCents: 1800,
          lineTotalCents: 3600,
        },
      ],
      subtotalCents: 3600,
      totalCents: 3600,
    });

    expect(message).toContain("Harmoni Bakery");
    expect(message).toContain("Customer: Amina & Co.");
    expect(message).toContain("Phone: +60 12-345 6789");
    expect(message).toContain("1. Country Sourdough Loaf");
    expect(message).toContain("2 ×");
    expect(message).toContain("Note: Please slice the sourdough loaf.");
    expect(message).toContain("Payment has not been made.");

    const url = buildWhatsAppUrl("60123456789", message);
    expect(url.startsWith("https://wa.me/60123456789?text=")).toBe(true);
    expect(decodeURIComponent(url.split("?text=")[1])).toBe(message);
  });

  it("refuses to build a broken URL when the WhatsApp number is missing or invalid", () => {
    expect(() => buildWhatsAppUrl("", "Hello")).toThrow();
    expect(() => buildWhatsAppUrl("+60123", "Hello")).toThrow();
  });
});

describe("Server-side checkout verification (prepareWhatsAppOrder)", () => {
  it("rejects unavailable products and recalculates prices from the catalog", async () => {
    const availableProduct = demoCatalog.products.find((p) => p.isAvailable)!;
    const unavailableProduct = demoCatalog.products.find((p) => !p.isAvailable)!;

    const rejected = await prepareWhatsAppOrder({
      customerName: "Test Customer",
      items: [
        {
          productId: unavailableProduct.id,
          quantity: 1,
          seenPriceCents: unavailableProduct.priceCents,
        },
      ],
    });
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) {
      expect(rejected.unavailableIds).toContain(unavailableProduct.id);
    }

    const accepted = await prepareWhatsAppOrder({
      customerName: "Test Customer",
      customerPhone: "60123456789",
      note: "Morning pickup",
      items: [
        {
          productId: availableProduct.id,
          quantity: 2,
          seenPriceCents: 100, // stale client price to verify server price wins
        },
      ],
    });

    expect(accepted.ok).toBe(true);
    if (accepted.ok) {
      expect(accepted.priceChanged).toBe(true);
      expect(accepted.totalCents).toBe(availableProduct.priceCents * 2);
      expect(accepted.message).toContain(availableProduct.name);
      expect(accepted.whatsappConfigured).toBe(true);
      expect(accepted.whatsappUrl?.startsWith("https://wa.me/601169397149?text=")).toBe(true);
    }
  });
});

describe("Accent color accessibility", () => {
  it("computes readable foreground and ink colors for both light and dark accents", () => {
    for (const hex of ["#0f766e", "#facc15", "#ffffff", "#111827", "#c2410c"]) {
      const palette = accentPalette(hex);
      expect(contrastRatio(palette.accent, palette.accentForeground)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(palette.accentInk, "#ffffff")).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("Admin password verification (123 / ١٢٣)", () => {
  it("accepts both ASCII 123 and Arabic-Indic ١٢٣ and rejects wrong passwords", () => {
    expect(normalizePasswordDigits("١٢٣")).toBe("123");
    expect(verifyAdminPassword("123")).toBe(true);
    expect(verifyAdminPassword("١٢٣")).toBe(true);
    expect(verifyAdminPassword("999")).toBe(false);
  });
});

