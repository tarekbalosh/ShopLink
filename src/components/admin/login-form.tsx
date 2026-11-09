"use client";

import { useState, useTransition } from "react";
import { Lock } from "lucide-react";
import { signInAdminAction } from "@/app/actions/auth";

export function LoginForm({ disabled }: { disabled?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await signInAdminAction(formData);
      if (result && !result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="admin-email" className="block text-sm font-medium text-stone-800">
          Admin email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={disabled || isPending}
          placeholder="owner@example.com"
          className="mt-1 h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-600 focus:outline-none disabled:bg-stone-100"
        />
      </div>

      <div>
        <label htmlFor="admin-password" className="block text-sm font-medium text-stone-800">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          disabled={disabled || isPending}
          placeholder="••••••••"
          className="mt-1 h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-600 focus:outline-none disabled:bg-stone-100"
        />
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={disabled || isPending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-5 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Lock className="size-4" aria-hidden />
        {isPending ? "Signing in…" : "Sign in to Admin"}
      </button>
    </form>
  );
}

