"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteCategoryAction, saveCategoryAction } from "@/app/actions/admin";
import type { Category } from "@/lib/types";

type Props = {
  categories: Category[];
  productCountsByCategory: Record<string, number>;
};

export function CategoriesManager({ categories, productCountsByCategory }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<Category | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await saveCategoryAction(formData);
      if (!result.ok) {
        setFeedback({ type: "error", text: result.error ?? "Failed to save category." });
        return;
      }
      setFeedback({ type: "success", text: result.message ?? "Category saved." });
      setEditing(null);
      form.reset();
      router.refresh();
    });
  }

  function handleDelete(categoryId: string) {
    setFeedback(null);
    startTransition(async () => {
      const result = await deleteCategoryAction(categoryId);
      setConfirmDeleteId(null);
      if (!result.ok) {
        setFeedback({ type: "error", text: result.error ?? "Failed to delete category." });
        return;
      }
      setFeedback({ type: "success", text: result.message ?? "Category deleted." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Categories</h1>
        <p className="mt-0.5 text-sm text-stone-600">
          Organize your products into categories so customers can filter the catalog.
        </p>
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

      {/* Create / Edit form */}
      <form
        key={editing?.id ?? "create"}
        onSubmit={handleSave}
        className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900">
            {editing ? `Edit Category “${editing.name}”` : "Add New Category"}
          </h2>
          {editing && (
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="text-xs font-semibold text-stone-600 hover:text-stone-900"
            >
              Cancel edit
            </button>
          )}
        </div>

        {editing && <input type="hidden" name="id" value={editing.id} />}

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="category-name" className="block text-xs font-semibold text-stone-700">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              id="category-name"
              name="name"
              type="text"
              required
              maxLength={80}
              defaultValue={editing?.name ?? ""}
              placeholder="e.g. Pastries"
              className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3 text-sm text-stone-900 focus:border-stone-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="category-slug" className="block text-xs font-semibold text-stone-700">
              Slug <span className="font-normal text-stone-400">(auto if blank)</span>
            </label>
            <input
              id="category-slug"
              name="slug"
              type="text"
              maxLength={90}
              defaultValue={editing?.slug ?? ""}
              placeholder="pastries"
              className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3 font-mono text-xs text-stone-900 focus:border-stone-600 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="category-sort" className="block text-xs font-semibold text-stone-700">
              Sort order
            </label>
            <input
              id="category-sort"
              name="sortOrder"
              type="number"
              min={-9999}
              max={99999}
              defaultValue={editing?.sortOrder ?? 0}
              className="mt-1 h-10 w-full rounded-xl border border-stone-300 px-3 text-sm tabular-nums text-stone-900 focus:border-stone-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-stone-900 px-5 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
          >
            <Plus className="size-4" aria-hidden />
            {isPending ? "Saving…" : editing ? "Update Category" : "Add Category"}
          </button>
        </div>
      </form>

      {/* Categories list */}
      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center">
          <p className="text-base font-semibold text-stone-900">No categories yet</p>
          <p className="mt-1 text-xs text-stone-500">
            Create your first category above to group products on the storefront.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          {categories.map((category) => {
            const count = productCountsByCategory[category.id] ?? 0;
            return (
              <li
                key={category.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-stone-900">{category.name}</p>
                    <span className="rounded-full bg-stone-100 px-2 py-0.5 font-mono text-xs text-stone-600">
                      {category.slug}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {count} {count === 1 ? "product" : "products"} · Sort #{category.sortOrder}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setEditing(category)}
                    className="inline-flex h-9 items-center gap-1 rounded-full border border-stone-200 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                    Edit
                  </button>

                  {confirmDeleteId === category.id ? (
                    <div className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1">
                      <span className="px-1 text-xs font-semibold text-red-800">
                        Delete category?
                      </span>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(category.id)}
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
                      onClick={() => setConfirmDeleteId(category.id)}
                      className="inline-flex h-9 items-center gap-1 rounded-full border border-red-200 px-3 text-xs font-semibold text-red-700 hover:bg-red-50"
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

