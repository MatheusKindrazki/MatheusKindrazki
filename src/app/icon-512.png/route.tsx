import { renderMaskableIcon } from "@/lib/og";

/**
 * 512×512 raster PWA icon (maskable + any). Served at /icon-512.png and
 * referenced from manifest.ts — the largest installability size, also used as
 * the splash/install artwork by most launchers.
 *
 * NOTE: This is a Route Handler, not a metadata file convention, so it may NOT
 * export `contentType` (Next rejects it as an invalid Route export). The
 * returned ImageResponse already sets `Content-Type: image/png` on its headers.
 */
export function GET() {
  return renderMaskableIcon(512);
}
