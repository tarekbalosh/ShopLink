/**
 * Accent color helpers. The shop owner can pick any color, so we derive
 * readable foreground/ink colors to keep WCAG contrast acceptable.
 */

export const DEFAULT_ACCENT = "#0f766e";
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function isHexColor(value: string): boolean {
  return HEX_RE.test(value);
}

export function normalizeHex(value: string | null | undefined): string {
  return value && isHexColor(value) ? value.toLowerCase() : DEFAULT_ACCENT;
}

function channel(hex: string, offset: number): number {
  return parseInt(hex.slice(offset, offset + 2), 16);
}

function toLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const h = normalizeHex(hex);
  return (
    0.2126 * toLinear(channel(h, 1)) +
    0.7152 * toLinear(channel(h, 3)) +
    0.0722 * toLinear(channel(h, 5))
  );
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Darken a hex color by mixing it with black. amount: 0..1 */
function darken(hex: string, amount: number): string {
  const h = normalizeHex(hex);
  const mix = (offset: number) =>
    Math.round(channel(h, offset) * (1 - amount))
      .toString(16)
      .padStart(2, "0");
  return `#${mix(1)}${mix(3)}${mix(5)}`;
}

export type AccentPalette = {
  /** Background for primary buttons/badges. */
  accent: string;
  /** Text color on top of `accent`. */
  accentForeground: string;
  /** Accent usable as text/icon on white backgrounds (>= 4.5:1). */
  accentInk: string;
};

export function accentPalette(input: string | null | undefined): AccentPalette {
  const accent = normalizeHex(input);
  const accentForeground =
    contrastRatio(accent, "#ffffff") >= contrastRatio(accent, "#111827") ? "#ffffff" : "#111827";

  let accentInk = accent;
  for (let i = 1; i <= 10 && contrastRatio(accentInk, "#ffffff") < 4.5; i++) {
    accentInk = darken(accent, i * 0.08);
  }
  return { accent, accentForeground, accentInk };
}

