import type { NextConfig } from 'next'

// Note: `output: 'export'` was removed to support the streaming /api/ask route
// (Ask Jarvis). The rest of the app is still safely prerendered as static.
const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

export default nextConfig
