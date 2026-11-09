/**
 * WhatsApp ordering helpers: number validation, message building and the
 * wa.me URL. Kept pure so it can be unit-tested and reused on the server.
 */
import { formatMoney } from "./money";

/** E.164 without "+": country code + subscriber number, 8–15 digits, no leading 0. */
const WHATSAPP_NUMBER_RE = /^[1-9]\d{7,14}$/;

export function isValidWhatsAppNumber(value: string | null | undefined): value is string {
  return typeof value === "string" && WHATSAPP_NUMBER_RE.test(value);
}

/** Strip spaces, "+", dashes, brackets etc. Does not guess country codes. */
export function normalizeWhatsAppNumber(input: string): string {
  return input.replace(/\D/g, "");
}

export type OrderLine = {
  name: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
};

export type OrderMessageInput = {
  shopName: string;
  currencyCode: string;
  customerName: string;
  customerPhone?: string | null;
  note?: string | null;
  lines: OrderLine[];
  subtotalCents: number;
  totalCents: number;
};

/** Remove control characters (except newlines in notes) and trim. */
export function cleanText(value: string, { multiline = false } = {}): string {
  const withoutControls = multiline
    ? value.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "")
    : value.replace(/[\u0000-\u001F\u007F]/g, " ");
  return withoutControls.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function buildOrderMessage(input: OrderMessageInput): string {
  const money = (cents: number) => formatMoney(cents, input.currencyCode);
  const parts: string[] = [];

  parts.push(`*New order request — ${cleanText(input.shopName)}*`);
  parts.push("");
  parts.push(`Customer: ${cleanText(input.customerName)}`);
  const phone = input.customerPhone ? cleanText(input.customerPhone) : "";
  if (phone) parts.push(`Phone: ${phone}`);
  parts.push("");
  parts.push("*Items*");
  input.lines.forEach((line, index) => {
    parts.push(`${index + 1}. ${cleanText(line.name)}`);
    parts.push(`   ${line.quantity} × ${money(line.unitPriceCents)} = ${money(line.lineTotalCents)}`);
  });
  parts.push("");
  parts.push(`Subtotal: ${money(input.subtotalCents)}`);
  parts.push(`*Total: ${money(input.totalCents)}*`);

  const note = input.note ? cleanText(input.note, { multiline: true }) : "";
  if (note) {
    parts.push("");
    parts.push(`Note: ${note}`);
  }

  parts.push("");
  parts.push("Please confirm availability and the final total. Payment has not been made.");
  return parts.join("\n");
}

/** Build the wa.me link. Throws if the number is invalid — callers must check first. */
export function buildWhatsAppUrl(number: string, message: string): string {
  if (!isValidWhatsAppNumber(number)) {
    throw new Error("Invalid WhatsApp number");
  }
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

