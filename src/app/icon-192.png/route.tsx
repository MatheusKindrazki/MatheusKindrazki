import { renderMaskableIcon } from "@/lib/og";

/**
 * 192×192 raster PWA icon (maskable + any). Served at /icon-192.png and
 * referenced from manifest.ts — the file-convention icons (icon.svg / 32 / 180)
 * don't cover the installability sizes Android/Chrome require.
 *
 * NOTE: This is a Route Handler, not a metadata file convention, so it may NOT
 * export `contentType` (Next rejects it as an invalid Route export). The
 * returned ImageResponse already sets `Content-Type: image/png` on its headers.
 */
export function GET() {
  return renderMaskableIcon(192);
}
