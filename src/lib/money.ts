/**
 * Money helpers. All arithmetic happens on integer minor units (cents).
 * The database stores `numeric(12,2)`; we convert at the boundary only.
 */

export const MAX_PRICE_CENTS = 99_999_999_99; // numeric(12,2) upper bound

/** Convert a database numeric value (number or string) to integer cents. */
export function toCents(value: number | string): number {
  const str = typeof value === "number" ? value.toFixed(2) : value.trim();
  const match = /^(-)?(\d+)(?:\.(\d{1,2})\d*)?$/.exec(str);
  if (!match) {
    throw new Error(`Invalid money value: ${String(value)}`);
  }
  const [, sign, whole, frac = ""] = match;
  const cents = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return sign ? -cents : cents;
}

/** Convert integer cents to a decimal string suitable for a numeric column. */
export function centsToDecimalString(cents: number): string {
  if (!Number.isSafeInteger(cents)) throw new Error("Cents must be a safe integer");
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/**
 * Parse a user-entered price like "12", "12.5" or "1,299.90" into cents.
 * Returns null for invalid input (negative, more than 2 decimals, NaN).
 */
export function parsePriceInput(input: string): number | null {
  const cleaned = input.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const cents = toCents(cleaned);
  return cents <= MAX_PRICE_CENTS ? cents : null;
}

export function multiplyCents(cents: number, quantity: number): number {
  return cents * quantity;
}

const formatterCache = new Map<string, Intl.NumberFormat>();

/** Format cents using the shop currency. Falls back gracefully for unknown codes. */
export function formatMoney(cents: number, currencyCode: string): string {
  const key = currencyCode.toUpperCase();
  let formatter = formatterCache.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat("en", {
        style: "currency",
        currency: key,
        currencyDisplay: "narrowSymbol",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } catch {
      formatter = new Intl.NumberFormat("en", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    formatterCache.set(key, formatter);
  }
  const formatted = formatter.format(cents / 100);
  // If the currency was invalid we used a plain formatter: prefix the code.
  return formatter.resolvedOptions().style === "currency" ? formatted : `${key} ${formatted}`;
}

