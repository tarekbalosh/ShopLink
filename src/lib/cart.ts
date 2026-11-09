/**
 * Pure cart logic. The cart stores a display snapshot of each product; the
 * server re-validates prices and availability before building the order.
 */

export const MAX_QUANTITY_PER_ITEM = 99;
export const MAX_CART_LINES = 50;

export type CartItem = {
  productId: string;
  name: string;
  /** Unit price (cents) as last seen by the customer. */
  priceCents: number;
  imageUrl: string | null;
  quantity: number;
};

export type CartState = { items: CartItem[] };

export type CartAction =
  | { type: "add"; item: Omit<CartItem, "quantity">; quantity?: number }
  | { type: "setQuantity"; productId: string; quantity: number }
  | { type: "increment"; productId: string }
  | { type: "decrement"; productId: string }
  | { type: "remove"; productId: string }
  | { type: "replace"; items: CartItem[] }
  | { type: "clear" };

export const emptyCart: CartState = { items: [] };

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_QUANTITY_PER_ITEM, Math.max(1, Math.floor(quantity)));
}

export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add": {
      const qty = clampQuantity(action.quantity ?? 1);
      const existing = state.items.find((i) => i.productId === action.item.productId);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === action.item.productId
              ? { ...i, ...action.item, quantity: clampQuantity(i.quantity + qty) }
              : i,
          ),
        };
      }
      if (state.items.length >= MAX_CART_LINES) return state;
      return { items: [...state.items, { ...action.item, quantity: qty }] };
    }
    case "setQuantity":
      if (action.quantity <= 0) {
        return { items: state.items.filter((i) => i.productId !== action.productId) };
      }
      return {
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, quantity: clampQuantity(action.quantity) } : i,
        ),
      };
    case "increment":
      return {
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, quantity: clampQuantity(i.quantity + 1) } : i,
        ),
      };
    case "decrement":
      return {
        items: state.items
          .map((i) => (i.productId === action.productId ? { ...i, quantity: i.quantity - 1 } : i))
          .filter((i) => i.quantity > 0),
      };
    case "remove":
      return { items: state.items.filter((i) => i.productId !== action.productId) };
    case "replace":
      return { items: sanitizeCartItems(action.items) };
    case "clear":
      return emptyCart;
  }
}

export function lineTotalCents(item: Pick<CartItem, "priceCents" | "quantity">): number {
  return item.priceCents * item.quantity;
}

export function cartTotals(items: CartItem[]): { itemCount: number; subtotalCents: number; totalCents: number } {
  let itemCount = 0;
  let subtotalCents = 0;
  for (const item of items) {
    itemCount += item.quantity;
    subtotalCents += lineTotalCents(item);
  }
  // No delivery fees or discounts in v1, so total equals subtotal.
  return { itemCount, subtotalCents, totalCents: subtotalCents };
}

/** Validate untrusted data (e.g. from localStorage) into well-formed cart items. */
export function sanitizeCartItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const items: CartItem[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Record<string, unknown>;
    if (
      typeof e.productId !== "string" ||
      e.productId.length === 0 ||
      e.productId.length > 64 ||
      typeof e.name !== "string" ||
      typeof e.priceCents !== "number" ||
      !Number.isSafeInteger(e.priceCents) ||
      e.priceCents < 0 ||
      typeof e.quantity !== "number" ||
      seen.has(e.productId)
    ) {
      continue;
    }
    seen.add(e.productId);
    items.push({
      productId: e.productId,
      name: e.name.slice(0, 200),
      priceCents: e.priceCents,
      imageUrl: typeof e.imageUrl === "string" ? e.imageUrl : null,
      quantity: clampQuantity(e.quantity),
    });
    if (items.length >= MAX_CART_LINES) break;
  }
  return items;
}

