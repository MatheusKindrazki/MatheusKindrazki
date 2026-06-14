import { execSync } from 'node:child_process'
import type { NextConfig } from 'next'

// /now shows "updated N days ago" derived from this stamp. We inject the real
// date of the last git commit that touched the content file, so the claim is
// honest by construction and can never silently rot. The fallback mirrors
// CONTENT_UPDATED_FALLBACK_ISO in src/lib/content.ts for environments without
// git history (e.g. shallow CI checkouts).
let contentUpdatedAt = '2026-04-17'
try {
  const stamp = execSync('git log -1 --format=%cI -- src/lib/content.ts', {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
  if (stamp) contentUpdatedAt = stamp
} catch {
  // git unavailable — keep the fallback constant.
}

// Note: `output: 'export'` was removed to support the streaming /api/ask route
// (Ask Jarvis). The rest of the app is still safely prerendered as static.
const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_CONTENT_UPDATED_AT: contentUpdatedAt,
  },
  images: {
    unoptimized: true,
  },
  // trailingSlash:true keeps every *page* URL canonical with a trailing slash —
  // and seo.ts/sitemap.ts/manifest.ts all emit the slashed form explicitly, so
  // canonical/og:url/sitemap entries are correct regardless of the redirect.
  trailingSlash: true,
  // ...but Next's auto-injected metadata IMAGE routes (opengraph-image,
  // twitter-image, apple-icon, icon) are emitted in <head> WITHOUT a trailing
  // slash (e.g. og:image=/opengraph-image, apple-touch-icon=/apple-icon). Under
  // a plain trailingSlash:true those bare paths 308-redirect to the slashed
  // form, so every share-scraper / Googlebot / Lighthouse apple-touch-icon
  // fetch eats an extra round-trip — and fetchers that don't follow image
  // redirects (WhatsApp, older Discord, some unfurlers) fail to load the card.
  // skipTrailingSlashRedirect stops Next from issuing those 308s, so the exact
  // URL Next prints in <head> serves a 200 image/png directly. Page URLs are
  // unaffected: their slashed form is still the only one referenced anywhere.
  skipTrailingSlashRedirect: true,
}

export default nextConfig
