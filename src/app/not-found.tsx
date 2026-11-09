import Link from "next/link";
import { PackageSearch } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-stone-50 px-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-stone-200/70 text-stone-600">
        <PackageSearch className="size-8" aria-hidden />
      </div>
      <h1 className="mt-4 text-2xl font-bold text-stone-900">Page not found</h1>
      <p className="mt-1 max-w-md text-sm text-stone-600">
        The product or page you are looking for may have been removed or is currently unavailable.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-stone-900 px-6 text-sm font-semibold text-white hover:bg-stone-800"
      >
        Back to storefront
      </Link>
    </div>
  );
}

