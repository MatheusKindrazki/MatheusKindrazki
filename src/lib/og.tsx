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
 * serif, Instrument Sans body and IBM Plex Mono telemetry inside the card,
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

/** Match root layout: Fraunces display, Instrument Sans body, IBM Plex Mono HUD. */
type OgFont = NonNullable<
  ConstructorParameters<typeof ImageResponse>[1]
>["fonts"];

async function loadCardFonts(): Promise<OgFont> {
  const [fraunces, body, mono] = await Promise.all([
    loadGoogleFont("Fraunces", 600),
    loadGoogleFont("Instrument Sans", 400),
    loadGoogleFont("IBM Plex Mono", 500),
  ]);

  return [
    { name: "Fraunces", data: fraunces, weight: 600, style: "normal" },
    { name: "Instrument Sans", data: body, weight: 400, style: "normal" },
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
const MUTED = "#9a9a9a";
const BODY = "#dddddd";

/**
 * Faint cosmic dot-field — positioned divs (no images allowed). Deterministic
 * coordinates keep the visual stable across builds. A background gesture,
 * never a substitute for the person's name or the Kindra identity.
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

/**
 * Conservative glyph budgets, not browser measurement. Explicit lines keep long
 * copy inside the fixed canvas without relying on unsupported CSS line-clamp.
 * Wide/unrecognised glyphs get a full em; over-budget copy ends in an ellipsis.
 */
function textUnits(text: string): number {
  return Array.from(text).reduce((total, character) => {
    if (/\s/.test(character)) return total + 0.35;
    if (/[ilI1.,:;'!|]/.test(character)) return total + 0.4;
    if (/[MWmw@%&]/.test(character)) return total + 1.1;
    if (/[A-Z]/.test(character)) return total + 0.85;
    if (/[a-z0-9]/.test(character)) return total + 0.7;
    return total + 1;
  }, 0);
}

function cardLines(text: string, width: number, fontSize: number, limit: number): string[] {
  const budget = width / fontSize;
  const lines: string[] = [];
  let line = "";
  // Iterate glyphs as well as words so URLs/unbroken route labels cannot overflow.
  for (const word of text.trim().replace(/\s+/g, " ").split(" ")) {
    if (!word) continue;
    if (line && textUnits(line + " " + word) <= budget) {
      line += " " + word;
      continue;
    }
    if (line) lines.push(line);
    line = "";
    for (const character of Array.from(word)) {
      if (line && textUnits(line + character) > budget) {
        lines.push(line);
        line = "";
      }
      line += character;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= limit) return lines;
  const result = lines.slice(0, limit);
  let last = result[limit - 1];
  while (textUnits(last + "…") > budget) last = Array.from(last).slice(0, -1).join("");
  result[limit - 1] = last.trimEnd() + "…";
  return result;
}

export interface OgCardOptions {
  /** Route label (e.g. "projects"); omit for the default site card. */
  label?: string;
  /** Route summary; long copy is bounded to three lines with an ellipsis. */
  description?: string;
  /** Existing site accent — tint, HUD, dots and palette swatches. */
  accent?: ThemeColor;
  /** Zero-padded route index (e.g. "02"); shown in the HUD. */
  index?: string;
  /** Accessible description exported by the calling metadata route. */
  alt: string;
}

/**
 * 1200×630 share cards: Kindra + full name + shared profile title, once each.
 * Routes lead with their label; home leads with Kindra. Identity is independent
 * of route copy, and bounded line budgets reserve room for the footer/HUD.
 */
export async function renderOgCard(options: OgCardOptions): Promise<ImageResponse> {
  const { label, description, index } = options;
  const accentKey: ThemeColor = options.accent ?? "yellow";
  const accent = colors[accentKey];
  const fonts = await loadCardFonts();
  const routeLabel = label?.trim();
  const isRouteCard = Boolean(routeLabel);
  const heading = isRouteCard ? routeLabel! : profile.nickname;
  const headingSize = textUnits(heading) <= 1040 / 112 ? 112 : 80;
  const headingLines = cardLines(heading, 1040, headingSize, 2);
  const bodyLines = cardLines(isRouteCard ? description ?? "" : profile.headline, 960, 26, 3);
  const identity = isRouteCard ? `${profile.nickname} · ${profile.name}` : profile.name;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "64px 80px 56px",
          backgroundColor: BG,
          backgroundImage: `radial-gradient(900px circle at 78% 12%, ${withAlpha(accent, 0.12)}, rgba(0,0,0,0) 55%)`,
          fontFamily: "Instrument Sans",
          fontWeight: 400,
          position: "relative",
        }}
      >
        {STARS.map((star, i) => (
          <div key={i} style={{ position: "absolute", left: `${star.x}%`, top: `${star.y}%`,
            width: star.s, height: star.s, borderRadius: star.s,
            backgroundColor: CREAM, opacity: star.o }} />
        ))}
        {/* Square hairline frame and index: the site's handcrafted HUD, not a new brand. */}
        <div style={{ position: "absolute", top: 28, left: 28, right: 28, bottom: 28,
          border: `1px solid ${withAlpha(accent, 0.18)}` }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", height: 72, flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 28, color: WHITE }}>
              {cardLines(identity, 880, 28, 1)[0]}
            </div>
            <div style={{ fontSize: 22, color: BODY }}>
              {cardLines(profile.title, 880, 22, 1)[0]}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 16 }}>
            <div style={{ fontFamily: "IBM Plex Mono", fontWeight: 500, fontSize: 18,
              letterSpacing: 2, color: accent }}>{cardLines(index ?? "01", 100, 18, 1)[0]}</div>
            <IdentityDots accent={accent} />
          </div>
        </div>

        {/* Explicit line heights leave at least 24px between copy and footer. */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: 306, flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Fraunces",
            fontSize: headingSize, fontWeight: 600, lineHeight: 1.08, color: WHITE }}>
            {headingLines.map((line, i) => <div key={i} style={{ height: headingSize * 1.08 }}>{line}</div>)}
          </div>
          {bodyLines.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", marginTop: 24,
              fontSize: 26, lineHeight: 1.3, color: BODY }}>
              {bodyLines.map((line, i) => <div key={i} style={{ height: 34 }}>{line}</div>)}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: 32, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {(["green", "yellow", "red", "blue"] as ThemeColor[]).map((color) => (
              <div key={color} style={{ width: 32, height: 6, backgroundColor: colors[color],
                opacity: color === accentKey ? 1 : 0.4 }} />
            ))}
          </div>
          <div style={{ fontFamily: "IBM Plex Mono", fontWeight: 500, fontSize: 18,
            letterSpacing: 0.5, color: MUTED }}>
            {cardLines(SITE_URL + " · " + profile.location.toLowerCase(), 780, 18, 1)[0]}
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts },
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
