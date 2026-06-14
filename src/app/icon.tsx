import { ImageResponse } from "next/og";

/**
 * Raster fallback for /icon (32x32). The primary scalable mark is icon.svg
 * (Next prefers it); this exists so clients that demand a raster favicon still
 * get the on-brand K instead of falling through to the stale CRA atom in
 * public/favicon.ico. Renders the same geometry as icon.svg via inline SVG,
 * which next/og (Satori) rasterizes faithfully.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="64" height="64" rx="14" fill="#1c2023" />
          <rect x="17" y="14" width="8" height="36" rx="2" fill="#ece5d8" />
          <path d="M27 32 L43 14 L52 14 L33 35 Z" fill="#e0a458" />
          <path d="M33 30 L52 50 L43 50 L27 33 Z" fill="#ece5d8" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
