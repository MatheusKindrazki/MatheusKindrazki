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
  trailingSlash: true,
}

export default nextConfig
