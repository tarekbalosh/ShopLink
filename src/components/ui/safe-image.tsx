"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";

type Props = {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * Product/shop image with a graceful fallback for missing or broken URLs.
 * Renders inside a positioned parent (uses `fill`).
 */
export function SafeImage({ src, alt, sizes, priority, className }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div
        role="img"
        aria-label={`${alt} (image unavailable)`}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-stone-100 to-stone-200 text-stone-400"
      >
        <ImageOff className="size-8" aria-hidden />
        <span className="px-4 text-center text-xs font-medium text-stone-500">No image</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      preload={priority}
      className={className ?? "object-cover"}
      onError={() => setFailedSrc(src)}
    />
  );
}

