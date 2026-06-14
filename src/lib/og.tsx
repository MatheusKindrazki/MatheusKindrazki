import { ImageResponse } from "next/og";

import { colors, type ThemeColor } from "@/lib/colors";
import { profile } from "@/lib/content";

/**
 * ──────────────────────────────────────────────────────────────────────────
 * Open Graph / share-card factory.
 *
 * Every social card on the site (the default site card + one per route) is
 * code-generated at the edge by next/og's `ImageResponse`, which renders JSX
 * through Satori. Satori is NOT a browser: it only understands a flexbox subset
 * of CSS, so the rules below are load-bearing, not stylistic preference:
 *
 *   - inline styles only (no Tailwind, no globals.css tokens, no className)
 *   - any element with MORE THAN ONE child must set `display: "flex"`
 *   - no CSS grid; lay everything out with flexbox
 *   - images must be data: or absolute URLs (we use none — pure vector/CSS)
 *
 * FONTS: Satori cannot read woff2 and has no system fonts. We fetch real TTF
 * binaries at render time. Google Fonts' css2 endpoint serves woff2 to modern
 * browsers but falls back to TTF (`format('truetype')`) for a legacy UA — so we
 * spoof `Mozilla/4.0`, scrape the .ttf URL out of the returned @font-face, and
 * hand the bytes to ImageResponse. This gives us the *real* Fraunces display
 * serif and IBM Plex Mono (the site's actual type system) inside the card,
 * rather than a Satori system-serif fallback. Fonts are cached
 * (`force-cache`) so repeated builds/requests don't re-hit Google.
 * ──────────────────────────────────────────────────────────────────────────
 */

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

const SITE_URL = "matheuskindrazki.dev";

/** Legacy UA that makes Google Fonts hand back a TTF instead of woff2. */
const TTF_UA = { "User-Agent": "Mozilla/4.0 (compatible; OG ImageResponse)" };

/** Resolve a single static TTF instance of a Google font at a given weight. */
async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family,
    )}:wght@${weight}`,
    { headers: TTF_UA, cache: "force-cache" },
  ).then((res) => res.text());

  const url = css.match(/src:\s*url\((https:\/\/[^)]+\.ttf)\)/)?.[1];
  if (!url) {
    throw new Error(`Could not extract a TTF URL for ${family}:${weight}`);
  }

  return fetch(url, { cache: "force-cache" }).then((res) => res.arrayBuffer());
}

/** Font set every card shares — Fraunces display + IBM Plex Mono telemetry. */
type OgFont = NonNullable<
  ConstructorParameters<typeof ImageResponse>[1]
>["fonts"];

async function loadCardFonts(): Promise<OgFont> {
  const [fraunces, frauncesBold, mono] = await Promise.all([
    loadGoogleFont("Fraunces", 600),
    loadGoogleFont("Fraunces", 300),
    loadGoogleFont("IBM Plex Mono", 500),
  ]);

  return [
    { name: "Fraunces", data: fraunces, weight: 600, style: "normal" },
    { name: "Fraunces", data: frauncesBold, weight: 300, style: "normal" },
    { name: "IBM Plex Mono", data: mono, weight: 500, style: "normal" },
  ];
}

/** rgba helper — Satori has no color-mix(), so alpha tints are precomputed. */
function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const BG = "#000000";
const CREAM = "#ece5d8";
const WHITE = "#ffffff";
const MUTED = "rgba(236, 229, 216, 0.55)";

/**
 * Faint cosmic dot-field — positioned divs (no images allowed). Deterministic
 * coordinates so the card is byte-stable across builds. Mirrors the site's
 * "Observatório K-2542 parked over Curitiba" star-field gesture.
 */
const STARS: { x: number; y: number; s: number; o: number }[] = [
  { x: 7, y: 18, s: 3, o: 0.5 },
  { x: 18, y: 62, s: 2, o: 0.35 },
  { x: 26, y: 30, s: 2, o: 0.4 },
  { x: 35, y: 80, s: 3, o: 0.3 },
  { x: 44, y: 14, s: 2, o: 0.45 },
  { x: 58, y: 70, s: 2, o: 0.3 },
  { x: 67, y: 24, s: 3, o: 0.5 },
  { x: 74, y: 55, s: 2, o: 0.35 },
  { x: 82, y: 82, s: 2, o: 0.3 },
  { x: 88, y: 36, s: 3, o: 0.45 },
  { x: 93, y: 68, s: 2, o: 0.4 },
  { x: 12, y: 88, s: 2, o: 0.3 },
];

/** The 4-dot Identity brand gesture, rendered with the route accent. */
function IdentityDots({ accent }: { accent: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
      {[1, 0.7, 0.45, 0.25].map((o, i) => (
        <div
          key={i}
          style={{
            width: 12,
            height: 12,
            borderRadius: 12,
            backgroundColor: accent,
            opacity: o,
          }}
        />
      ))}
    </div>
  );
}

export interface OgCardOptions {
  /** Route label (e.g. "projects"); omit for the default site card. */
  label?: string;
  /** One-line route description; omit for the default site card. */
  description?: string;
  /** Theme accent — drives the radial glow, eyebrow, dots and palette swatches. */
  accent?: ThemeColor;
  /** Zero-padded HUD index (e.g. "02"); shown in the mono footer. */
  index?: string;
  /** Satori `alt` for the resulting <img>. */
  alt: string;
}

/**
 * Build a 1200×630 share card. The default site card (no label) leads with the
 * full name + title + headline; route cards (with a label) lead with the route
 * label + its one-line description. Both share the dark cosmic shell, the accent
 * glow, the Identity dots, the palette swatch row, and the mono footer.
 */
export async function renderOgCard(options: OgCardOptions): Promise<ImageResponse> {
  const { label, description, index, alt } = options;
  const accentKey: ThemeColor = options.accent ?? "yellow";
  const accent = colors[accentKey];

  const fonts = await loadCardFonts();

  const isRouteCard = Boolean(label);
  const eyebrow = isRouteCard
    ? `${index ? `${index} · ` : ""}observatório k-2542`
    : "observatório k-2542";
  const heading = isRouteCard ? label! : profile.name;
  const subhead = isRouteCard ? profile.name : profile.title;
  const body = isRouteCard ? description ?? "" : profile.headline;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "72px 80px",
          backgroundColor: BG,
          backgroundImage: `radial-gradient(900px circle at 78% 12%, ${withAlpha(
            accent,
            0.22,
          )}, rgba(0,0,0,0) 55%), radial-gradient(700px circle at 8% 96%, ${withAlpha(
            accent,
            0.1,
          )}, rgba(0,0,0,0) 50%)`,
          fontFamily: "Fraunces",
          position: "relative",
        }}
      >
        {/* faint cosmic dot-field */}
        {STARS.map((star, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.s,
              height: star.s,
              borderRadius: star.s,
              backgroundColor: CREAM,
              opacity: star.o,
            }}
          />
        ))}

        {/* hairline frame */}
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 28,
            right: 28,
            bottom: 28,
            border: `1px solid ${withAlpha(accent, 0.18)}`,
            borderRadius: 6,
          }}
        />

        {/* top row — eyebrow + identity dots */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontFamily: "IBM Plex Mono",
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: accent,
            }}
          >
            {eyebrow}
          </div>
          <IdentityDots accent={accent} />
        </div>

        {/* center block — heading + subhead + body */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: isRouteCard ? 120 : 96,
              fontWeight: 600,
              lineHeight: 1,
              color: WHITE,
              textTransform: isRouteCard ? "lowercase" : "none",
            }}
          >
            {heading}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: 34,
              fontWeight: 300,
              color: CREAM,
            }}
          >
            {subhead}
          </div>
          {body ? (
            <div
              style={{
                display: "flex",
                marginTop: 18,
                maxWidth: 880,
                fontSize: 26,
                fontWeight: 300,
                lineHeight: 1.35,
                color: MUTED,
              }}
            >
              {body}
            </div>
          ) : null}
        </div>

        {/* bottom row — palette swatches + mono footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "row", gap: 10 }}>
            {(["green", "yellow", "red", "blue"] as ThemeColor[]).map((c) => (
              <div
                key={c}
                style={{
                  width: 36,
                  height: 6,
                  borderRadius: 6,
                  backgroundColor: colors[c],
                  opacity: c === accentKey ? 1 : 0.4,
                }}
              />
            ))}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "IBM Plex Mono",
              fontSize: 22,
              letterSpacing: 1,
              color: MUTED,
            }}
          >
            {`${SITE_URL} — ${profile.location.toLowerCase()}`}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts,
    },
  );
}

/**
 * ──────────────────────────────────────────────────────────────────────────
 * PWA maskable icon (192 / 512).
 *
 * Next auto-discovers icon.svg / icon.tsx (32px) / apple-icon.tsx (180px), but
 * Android/Chrome "Add to Home Screen" requires raster 192 AND 512 icons, and a
 * `maskable` variant so the launcher can crop to its mask shape without clipping
 * the mark. Those sizes are NOT part of the file-convention set, so we render
 * them on demand from route handlers (src/app/icon-192.png, icon-512.png) and
 * reference them by URL from manifest.ts.
 *
 * The K geometry mirrors src/app/icon.svg (agent A's source of truth); it is
 * re-expressed here only because cross-file SVG import isn't worth it for nine
 * path commands. The 64-unit mark is centered in a safe zone (≈80% of the tile)
 * so it survives an aggressive maskable crop.
 * ──────────────────────────────────────────────────────────────────────────
 */
export function renderMaskableIcon(px: number): ImageResponse {
  // Keep the mark within the maskable safe zone (~80% of the canvas).
  const mark = Math.round(px * 0.62);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1c2023",
        }}
      >
        <svg
          width={mark}
          height={mark}
          viewBox="0 0 64 64"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="17" y="14" width="8" height="36" rx="2" fill="#ece5d8" />
          <path d="M27 32 L43 14 L52 14 L33 35 Z" fill="#e0a458" />
          <path d="M33 30 L52 50 L43 50 L27 33 Z" fill="#ece5d8" />
        </svg>
      </div>
    ),
    { width: px, height: px },
  );
}

export { renderOgCard as default };
