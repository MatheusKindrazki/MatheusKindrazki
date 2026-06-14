import { ImageResponse } from "next/og";

/**
 * Apple touch icon (180x180). Solid dark background (no transparency — iOS
 * composites touch icons on an opaque tile) with a bit more padding around the
 * K mark than the favicon. Same geometry as icon.svg, rendered via inline SVG
 * so next/og (Satori) rasterizes it faithfully.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1c2023",
        }}
      >
        {/* The 64-unit mark scaled into a 120px box leaves ~30px padding on
            each side of the 180px tile. */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="17" y="14" width="8" height="36" rx="2" fill="#ece5d8" />
          <path d="M27 32 L43 14 L52 14 L33 35 Z" fill="#e0a458" />
          <path d="M33 30 L52 50 L43 50 L27 33 Z" fill="#ece5d8" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
