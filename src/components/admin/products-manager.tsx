"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  deleteProductAction,
  saveProductAction,
  toggleProductAvailabilityAction,
} from "@/app/actions/admin";
import { centsToDecimalString, formatMoney } from "@/lib/money";
import type { Category, Product } from "@/lib/types";
import { SafeImage } from "@/components/ui/safe-image";

type Props = {
  products: Product[];
  categories: Category[];
  currencyCode: string;
};

const ALL_CATEGORIES = "__all__";
const UNCATEGORIZED = "__uncategorized__";

export function ProductsManager({ products, categories, currencyCode }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);
  const [editing, setEditing] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter === UNCATEGORIZED && p.categoryId !== null) return false;
      if (
        categoryFilter !== ALL_CATEGORIES &&
        categoryFilter !== UNCATEGORIZED &&
        p.categoryId !== categoryFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [products, search, categoryFilter]);

  function openCreateForm() {
    setEditing(null);
    setIsCreating(true);
    setPreviewUrl(null);
    setRemoveImage(false);
    setFeedback(null);
  }

  function openEditForm(product: Product) {
    setIsCreating(false);
    setEditing(product);
    setPreviewUrl(product.imageUrl);
    setRemoveImage(false);
    setFeedback(null);
  }

  function closeForm() {
    setIsCreating(false);
    setEditing(null);
    setPreviewUrl(null);
    setRemoveImage(false);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setRemoveImage(false);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    const formData = new FormData(event.currentTarget);
    if (removeImage) {
      formData.set("removeImage", "true");
    }

    startTransition(async () => {
      const result = await saveProductAction(formData);
      if (!result.ok) {
        setFeedback({ type: "error", text: result.error ?? "Failed to save product." });
        return;
      }
      setFeedback({ type: "success", text: result.message ?? "Product saved." });
      closeForm();
      router.refresh();
    });
  }

  function handleToggleAvailability(product: Product) {
    setFeedback(null);
    startTransition(async () => {
      const result = await toggleProductAvailabilityAction(product.id, !product.isAvailable);
      if (!result.ok) {
        setFeedback({ type: "error", text: result.error ?? "Could not update availability." });
        return;
      }
      setFeedback({ type: "success", text: result.message ?? "Availability updated." });
      router.refresh();
    });
  }

  function handleDelete(productId: string) {
    setFeedback(null);
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      setConfirmDeleteId(null);
      if (!result.ok) {
        setFeedback({ type: "error", text: result.error ?? "Could not delete product." });
        return;
      }
      setFeedback({ type: "success", text: result.message ?? "Product deleted." });
      router.refresh();
    });
  }

  const formOpen = isCreating || editing !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Products</h1>
          <p className="mt-0.5 text-sm text-stone-600">
            Create, edit, publish/unpublish, and manage product images.
          </p>
        </div>
        {!formOpen && (
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-stone-900 px-4 text-xs font-semibold text-white hover:bg-stone-800"
          >
            <Plus className="size-4" aria-hidden />
            New Product
          </button>
        )}
      </div>

      {feedback && (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          className={`flex items-center justify-between gap-2 rounded-2xl border p-3.5 text-sm ${
            feedback.type === "error"
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          <span className="flex items-center gap-2 font-medium">
            {feedback.type === "success" && <CheckCircle2 className="size-4 text-emerald-700" />}
            {feedback.text}
          </span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="rounded-full p-1 hover:bg-black/5"
            aria-label="Dismiss message"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <h2 className="text-lg font-bold text-stone-900">
              {editing ? `Edit “${editing.name}”` : "Create Product"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-full p-1.5 text-stone-500 hover:bg-stone-100"
              aria-label="Close product form"
            >
              <X className="size-5" />
            </button>
          </div>

          {editing && <input type="hidden" name="id" value={editing.id} />}

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label htmlFor="product-name" className="block text-sm font-medium text-stone-800">
                  Product name <span className="text-red-600">*</span>
                </label>
                <input
                  id="product-name"
                  name="name"
                  type="text"
                  required
                  maxLength={140}
                  defaultValue={editing?.name ?? ""}
                  placeholder="e.g. Country Sourdough Loaf"
                  className="mt-1 h-11 w-full rounded-xl border border-stone-300 px-3.5 text-sm text-stone-900 focus:border-stone-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="product-price" className="block text-sm font-medium text-stone-800">
                    Price ({currencyCode}) <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="product-price"
                    name="price"
                    type="text"
                    inputMode="decimal"
                    required
                    defaultValue={editing ? centsToDecimalString(editing.priceCents) : ""}
                    placeholder="18.00"
                    className="mt-1 h-11 w-full rounded-xl border border-stone-300 px-3.5 text-sm tabular-nums text-stone-900 focus:border-stone-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="product-sort" className="block text-sm font-medium text-stone-800">
                    Sort order
                  </label>
                  <input
                    id="product-sort"
                    name="sortOrder"
                    type="number"
                    min={-9999}
                    max={99999}
                    defaultValue={editing?.sortOrder ?? 0}
                    className="mt-1 h-11 w-full rounded-xl border border-stone-300 px-3.5 text-sm tabular-nums text-stone-900 focus:border-stone-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="product-category" className="block text-sm font-medium text-stone-800">
                  Category
                </label>
                <select
                  id="product-category"
                  name="categoryId"
                  defaultValue={editing?.categoryId ?? ""}
                  className="mt-1 h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 focus:border-stone-600 focus:outline-none"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="product-description" className="block text-sm font-medium text-stone-800">
                  Description
                </label>
                <textarea
                  id="product-description"
                  name="description"
                  rows={4}
                  maxLength={2000}
                  defaultValue={editing?.description ?? ""}
                  placeholder="Describe ingredients, weight, or serving size…"
                  className="mt-1 w-full rounded-xl border border-stone-300 p-3 text-sm text-stone-900 focus:border-stone-600 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2.5 pt-1 text-sm font-medium text-stone-800">
                <input
                  type="checkbox"
                  name="isAvailable"
                  value="true"
                  defaultChecked={editing ? editing.isAvailable : true}
                  className="size-4 rounded border-stone-300 text-stone-900"
                />
                Available for customers to order on the storefront
              </label>
            </div>

            {/* Image upload & preview before saving */}
            <div className="space-y-3">
              <span className="block text-sm font-medium text-stone-800">Product image</span>
              <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
                {previewUrl && !removeImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Product preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center text-xs text-stone-500">
                    <Upload className="mb-2 size-6 text-stone-400" aria-hidden />
                    No image selected. Upload a JPEG, PNG, WebP, or GIF (max 5 MB).
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="product-image-file"
                  className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                >
                  <Upload className="size-3.5" aria-hidden />
                  {previewUrl && !removeImage ? "Replace image" : "Choose image"}
                </label>
                <input
                  id="product-image-file"
                  name="imageFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileChange}
                  className="sr-only"
                />
                {previewUrl && !removeImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      setRemoveImage(true);
                    }}
                    className="inline-flex h-10 items-center gap-1 rounded-full border border-red-200 px-3.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    Remove image
                  </button>
                )}
              </div>
              <p className="text-xs text-stone-500">
                Preview updates immediately before saving. Square (1:1) photos look best on product cards.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-stone-100 pt-4">
            <button
              type="button"
              onClick={closeForm}
              disabled={isPending}
              className="h-10 rounded-full border border-stone-300 px-4 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="h-10 rounded-full bg-stone-900 px-5 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
            >
              {isPending ? "Saving…" : editing ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      )}

      {/* Search & Category filter bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400"
            aria-hidden
          />
          <label htmlFor="admin-product-search" className="sr-only">
            Search products
          </label>
          <input
            id="admin-product-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or description…"
            className="h-10 w-full rounded-xl border border-stone-200 pl-10 pr-4 text-sm text-stone-900 focus:border-stone-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="admin-category-filter" className="sr-only">
            Filter by category
          </label>
          <select
            id="admin-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-800 sm:w-52"
          >
            <option value={ALL_CATEGORIES}>All categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={UNCATEGORIZED}>Uncategorized</option>
          </select>
        </div>
      </div>

      {/* Product list */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <p className="text-base font-semibold text-stone-900">No products match</p>
          <p className="mt-1 text-xs text-stone-500">
            Add a new product or adjust your search/category filters.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          {filteredProducts.map((product) => {
            const catName = product.categoryId ? categoryMap.get(product.categoryId) : null;
            return (
              <li
                key={product.id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
                    <SafeImage src={product.imageUrl} alt={product.name} sizes="64px" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-stone-900">
                        {product.name}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          product.isAvailable
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-stone-100 text-stone-600"
                        }`}
                      >
                        {product.isAvailable ? "Published" : "Hidden"}
                      </span>
                      {catName && (
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                          {catName}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm font-bold tabular-nums text-stone-900">
                      {formatMoney(product.priceCents, currencyCode)}
                      <span className="ml-2 text-xs font-normal text-stone-500">
                        · Sort #{product.sortOrder}
                      </span>
                    </p>
                    {product.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">
                        {product.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleToggleAvailability(product)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone-200 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                  >
                    {product.isAvailable ? (
                      <>
                        <EyeOff className="size-3.5" aria-hidden />
                        Hide
                      </>
                    ) : (
                      <>
                        <Eye className="size-3.5" aria-hidden />
                        Publish
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => openEditForm(product)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone-200 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Edit
                  </button>

                  {confirmDeleteId === product.id ? (
                    <div className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1">
                      <span className="px-1 text-xs font-semibold text-red-800">Delete?</span>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(product.id)}
                        className="rounded-full bg-red-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-800"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-full px-2 py-1 text-xs font-medium text-stone-700 hover:bg-stone-200"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setConfirmDeleteId(product.id)}
                      className="inline-flex h-9 items-center gap-1 rounded-full border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Delete
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

