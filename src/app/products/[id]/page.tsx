import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { getPublicCatalog, getPublicProductById } from "@/lib/data";
import { formatMoney } from "@/lib/money";
import { SafeImage } from "@/components/ui/safe-image";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { StoreShell } from "@/components/storefront/store-shell";

export async function generateStaticParams() {
  const catalog = await getPublicCatalog();
  if (catalog.products.length === 0) {
    return [{ id: "__placeholder__" }];
  }
  return catalog.products.slice(0, 20).map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[id]">): Promise<Metadata> {
  const { id } = await params;
  const { catalog, product } = await getPublicProductById(id);
  if (!product) {
    return { title: `Product not found · ${catalog.settings.shopName}` };
  }
  return {
    title: `${product.name} · ${catalog.settings.shopName}`,
    description: product.description || `Order ${product.name} from ${catalog.settings.shopName} on WhatsApp.`,
  };
}

export default function ProductDetailPage({ params }: PageProps<"/products/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="h-96 animate-pulse rounded-2xl bg-stone-200/70" />
        </div>
      }
    >
      <ProductDetailContent params={params} />
    </Suspense>
  );
}

async function ProductDetailContent({
  params,
}: {
  params: PageProps<"/products/[id]">["params"];
}) {
  const { id } = await params;
  const { catalog, product, category } = await getPublicProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <StoreShell catalog={catalog}>
      <div className="mb-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to catalog
        </Link>
      </div>

      <article className="grid gap-6 overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6 md:grid-cols-2 md:gap-8">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-stone-100">
          <SafeImage
            src={product.imageUrl}
            alt={product.name}
            sizes="(min-width: 768px) 45vw, 92vw"
            priority
          />
        </div>

        <div className="flex flex-col">
          {category && (
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-ink">
              {category.name}
            </p>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            {product.name}
          </h1>

          <p className="mt-3 text-2xl font-bold tabular-nums text-stone-900">
            {formatMoney(product.priceCents, catalog.settings.currencyCode)}
          </p>

          <div className="mt-3 flex items-center gap-1.5 text-sm">
            {product.isAvailable ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                <CheckCircle2 className="size-4" aria-hidden />
                Available to order
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 font-medium text-stone-500">
                <XCircle className="size-4" aria-hidden />
                Currently unavailable
              </span>
            )}
          </div>

          {product.description ? (
            <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-stone-700 sm:text-base">
              {product.description}
            </p>
          ) : (
            <p className="mt-5 text-sm italic text-stone-500">No additional description provided.</p>
          )}

          <div className="mt-auto pt-6">
            <AddToCartButton product={product} variant="detail" />
            <p className="mt-3 text-xs text-stone-500">
              Add items to your cart and send your order to {catalog.settings.shopName} via WhatsApp.
            </p>
          </div>
        </div>
      </article>
    </StoreShell>
  );
}

