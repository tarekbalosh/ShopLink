import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { Product } from "@/lib/types";
import { SafeImage } from "@/components/ui/safe-image";
import { AddToCartButton } from "./add-to-cart-button";

type Props = {
  product: Product;
  categoryName: string | null;
  currencyCode: string;
  priority?: boolean;
};

export function ProductCard({ product, categoryName, currencyCode, priority }: Props) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition hover:shadow-md">
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-square overflow-hidden bg-stone-100"
        aria-label={`View details for ${product.name}`}
      >
        <SafeImage
          src={product.imageUrl}
          alt={product.name}
          sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 50vw"
          priority={priority}
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        {!product.isAvailable && (
          <span className="absolute left-2 top-2 rounded-full bg-stone-900/80 px-2.5 py-1 text-xs font-medium text-white">
            Unavailable
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        {categoryName && (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-ink">{categoryName}</p>
        )}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900 sm:text-base">
          <Link href={`/products/${product.id}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        {product.description && (
          <p className="line-clamp-2 hidden text-sm text-stone-600 sm:block">{product.description}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          <div>
            <p className="text-base font-bold tabular-nums text-stone-900">
              {formatMoney(product.priceCents, currencyCode)}
            </p>
            <p className={`text-xs ${product.isAvailable ? "text-emerald-700" : "text-stone-500"}`}>
              {product.isAvailable ? "Available" : "Not available"}
            </p>
          </div>
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}

