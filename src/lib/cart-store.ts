"use client";

/**
 * Client-side cart store persisted to localStorage. Implemented as an external
 * store (useSyncExternalStore) so hydration is safe: the server snapshot is
 * always empty and the persisted cart appears right after hydration.
 */
import { cartReducer, emptyCart, sanitizeCartItems, type CartAction, type CartState } from "./cart";

const STORAGE_KEY = "shoplink-cart-v1";

let state: CartState | null = null;
const listeners = new Set<() => void>();

function load(): CartState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyCart;
    return { items: sanitizeCartItems(JSON.parse(raw)) };
  } catch {
    return emptyCart;
  }
}

function save(next: CartState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.items));
  } catch {
    // Storage may be full or disabled (private mode); the cart still works in memory.
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function getCartSnapshot(): CartState {
  if (state === null) state = load();
  return state;
}

export function getServerCartSnapshot(): CartState {
  return emptyCart;
}

export function subscribeCart(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      state = load();
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function dispatchCart(action: CartAction) {
  const next = cartReducer(getCartSnapshot(), action);
  if (next === state) return;
  state = next;
  save(next);
  emit();
}

