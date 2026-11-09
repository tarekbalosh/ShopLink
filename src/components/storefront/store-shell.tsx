import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Store, TriangleAlert } from "lucide-react";
import { accentPalette } from "@/lib/color";
import type { Catalog } from "@/lib/types";
import { isValidWhatsAppNumber } from "@/lib/whatsapp";
import { SafeImage } from "@/components/ui/safe-image";
import { CartButton } from "./cart-button";
import { CartDrawer } from "./cart-drawer";
import { CartProvider, type LiveProduct } from "./cart-provider";
import { MobileCartBar } from "./mobile-cart-bar";

type Props = {
  catalog: Catalog;
  children: ReactNode;
};

export function StoreShell({ catalog, children }: Props) {
  const { settings, products, source, error } = catalog;
  const palette = accentPalette(settings.accentColor);

  const liveProducts: Record<string, LiveProduct> = {};
  for (const product of products) {
    if (product.isAvailable) {
      liveProducts[product.id] = {
        priceCents: product.priceCents,
        name: product.name,
        imageUrl: product.imageUrl,
      };
    }
  }

  const themeStyle = {
    "--accent": palette.accent,
    "--accent-fg": palette.accentForeground,
    "--accent-ink": palette.accentInk,
  } as CSSProperties;

  return (
    <CartProvider
      store={{
        shopName: settings.shopName,
        currencyCode: settings.currencyCode,
        whatsappConfigured: isValidWhatsAppNumber(settings.whatsappNumber),
        isDemo: source === "demo",
      }}
      liveProducts={liveProducts}
    >
      <div style={themeStyle} className="flex min-h-dvh flex-col bg-stone-50 text-stone-900">
        {source === "demo" && (
          <div
            role="region"
            aria-label="Demo mode notice"
            className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900"
          >
            <strong>Demo Catalog:</strong> Showing sample bakery items because Supabase environment variables are not configured yet.{" "}
            <Link href="/admin" className="font-semibold underline hover:text-amber-950">
              Open Admin Setup
            </Link>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="border-b border-red-200 bg-red-50 px-4 py-2.5 text-center text-xs text-red-900"
          >
            <TriangleAlert className="mr-1.5 inline size-4 align-text-bottom" aria-hidden />
            {error}
          </div>
        )}

        <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              {settings.logoUrl ? (
                <div className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                  <SafeImage src={settings.logoUrl} alt={`${settings.shopName} logo`} sizes="44px" />
                </div>
              ) : (
                <div
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-fg shadow-sm"
                  aria-hidden
                >
                  <Store className="size-5" />
                </div>
              )}
              <div className="min-w-0">
                <span className="block truncate text-base font-bold tracking-tight text-stone-900 sm:text-lg">
                  {settings.shopName}
                </span>
                <span className="block truncate text-xs text-stone-500">
                  Order via WhatsApp · {settings.currencyCode}
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <CartButton />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 sm:px-6 sm:pb-16">
          {children}
        </main>

        <footer className="border-t border-stone-200 bg-white py-6 text-xs text-stone-500">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6">
            <p>
              © {settings.shopName} · Powered by <strong className="font-semibold text-stone-700">ShopLink</strong>
            </p>
            <div className="flex items-center gap-4">
              <span>Orders are sent via WhatsApp and confirmed by the shop.</span>
              <Link href="/admin" className="font-medium text-stone-600 hover:text-stone-900 hover:underline">
                Shop Admin
              </Link>
            </div>
          </div>
        </footer>

        <MobileCartBar />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}

