"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink, Store, Upload, X } from "lucide-react";
import { saveShopSettingsAction } from "@/app/actions/admin";
import { accentPalette } from "@/lib/color";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";
import type { ShopSettings } from "@/lib/types";

const PRESET_COLORS = [
  { hex: "#0f766e", label: "Teal" },
  { hex: "#c2410c", label: "Terracotta" },
  { hex: "#15803d", label: "Forest" },
  { hex: "#1d4ed8", label: "Cobalt" },
  { hex: "#7e22ce", label: "Plum" },
  { hex: "#be123c", label: "Rose" },
  { hex: "#1c1917", label: "Charcoal" },
];

export function SettingsForm({ settings }: { settings: ShopSettings }) {
  const router = useRouter();
  const [accentColor, setAccentColor] = useState(settings.accentColor);
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logoUrl);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const palette = accentPalette(accentColor);

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setRemoveLogo(false);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    const formData = new FormData(event.currentTarget);
    formData.set("accentColor", accentColor);
    if (removeLogo) {
      formData.set("removeLogo", "true");
    }

    startTransition(async () => {
      const result = await saveShopSettingsAction(formData);
      if (!result.ok) {
        setFeedback({ type: "error", text: result.error ?? "Could not save settings." });
        return;
      }
      setFeedback({ type: "success", text: result.message ?? "Shop settings updated." });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Shop Settings</h1>
          <p className="mt-0.5 text-sm text-stone-600">
            Update your shop identity, WhatsApp ordering number, currency, and brand color.
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 text-xs font-semibold text-stone-800 hover:bg-stone-50"
        >
          Preview Storefront
          <ExternalLink className="size-3.5" aria-hidden />
        </Link>
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

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label htmlFor="shop-name" className="block text-sm font-medium text-stone-800">
                Shop name <span className="text-red-600">*</span>
              </label>
              <input
                id="shop-name"
                name="shopName"
                type="text"
                required
                maxLength={120}
                defaultValue={settings.shopName}
                placeholder="e.g. Harmoni Bakery"
                className="mt-1 h-11 w-full rounded-xl border border-stone-300 px-3.5 text-sm text-stone-900 focus:border-stone-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="shop-description" className="block text-sm font-medium text-stone-800">
                Shop description
              </label>
              <textarea
                id="shop-description"
                name="description"
                rows={3}
                maxLength={600}
                defaultValue={settings.description}
                placeholder="Short welcome message shown at the top of your catalog…"
                className="mt-1 w-full rounded-xl border border-stone-300 p-3 text-sm text-stone-900 focus:border-stone-600 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="whatsapp-number" className="block text-sm font-medium text-stone-800">
                WhatsApp number for orders
              </label>
              <input
                id="whatsapp-number"
                name="whatsappNumber"
                type="text"
                inputMode="numeric"
                defaultValue={settings.whatsappNumber ?? ""}
                placeholder="60123456789"
                aria-describedby="whatsapp-number-help"
                className="mt-1 h-11 w-full rounded-xl border border-stone-300 px-3.5 font-mono text-sm text-stone-900 focus:border-stone-600 focus:outline-none"
              />
              <p id="whatsapp-number-help" className="mt-1.5 text-xs leading-relaxed text-stone-600">
                Use <strong>international format, digits only</strong> — include country code, no{" "}
                <code className="rounded bg-stone-100 px-1">+</code> sign, no leading{" "}
                <code className="rounded bg-stone-100 px-1">0</code>, and no spaces or dashes. Example:{" "}
                <code className="rounded bg-stone-100 px-1 font-mono font-semibold text-stone-800">
                  60123456789
                </code>{" "}
                (Malaysia) or{" "}
                <code className="rounded bg-stone-100 px-1 font-mono font-semibold text-stone-800">
                  966501234567
                </code>{" "}
                (Saudi Arabia).
              </p>
            </div>

            <div>
              <label htmlFor="currency-code" className="block text-sm font-medium text-stone-800">
                Currency
              </label>
              <select
                id="currency-code"
                name="currencyCode"
                defaultValue={settings.currencyCode}
                className="mt-1 h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 text-sm text-stone-900 focus:border-stone-600 focus:outline-none"
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-5">
            {/* Logo upload & preview */}
            <div>
              <span className="block text-sm font-medium text-stone-800">Shop logo</span>
              <div className="mt-2 flex items-center gap-4">
                <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
                  {logoPreview && !removeLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreview}
                      alt="Shop logo preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Store className="size-8 text-stone-400" aria-hidden />
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <label
                    htmlFor="shop-logo-file"
                    className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                  >
                    <Upload className="size-3.5" aria-hidden />
                    {logoPreview && !removeLogo ? "Replace logo" : "Upload logo"}
                  </label>
                  <input
                    id="shop-logo-file"
                    name="logoFile"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleLogoChange}
                    className="sr-only"
                  />
                  {logoPreview && !removeLogo && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview(null);
                        setRemoveLogo(true);
                      }}
                      className="inline-flex h-10 items-center rounded-full border border-red-200 px-3.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-1.5 text-xs text-stone-500">
                Square image recommended (JPEG, PNG, WebP, or GIF up to 5 MB).
              </p>
            </div>

            {/* Accent color */}
            <div>
              <label htmlFor="accent-color-picker" className="block text-sm font-medium text-stone-800">
                Storefront accent color
              </label>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setAccentColor(preset.hex)}
                    aria-label={`Select ${preset.label} (${preset.hex})`}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                      accentColor.toLowerCase() === preset.hex
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    <span
                      className="size-3.5 rounded-full border border-black/10"
                      style={{ backgroundColor: preset.hex }}
                    />
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <input
                  id="accent-color-picker"
                  type="color"
                  value={palette.accent}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-stone-300 bg-white p-1"
                />
                <span className="font-mono text-xs text-stone-600">{palette.accent}</span>
                <span
                  style={{
                    backgroundColor: palette.accent,
                    color: palette.accentForeground,
                  }}
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm"
                >
                  Button preview
                </span>
              </div>
              <p className="mt-1.5 text-xs text-stone-500">
                ShopLink automatically adjusts button text and link contrast so your storefront remains easy to read.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-stone-100 pt-4">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center rounded-full bg-stone-900 px-6 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

