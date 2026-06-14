import type { Metadata } from 'next'
import { profile } from '@/lib/content'
import type { JsonLdSchema } from '@/components/seo/JsonLd'

/**
 * Canonical production origin. The OLD code used https://kindrazki.dev, which
 * does not resolve — every web URL on the site derives from this constant so
 * the domain can never drift again. next.config.ts sets trailingSlash:true, so
 * every canonical/OG URL this module emits MUST end with a slash.
 */
export const SITE_URL = 'https://matheuskindrazki.dev'

/** Human-readable brand used for OG siteName and the title suffix. */
export const SITE_NAME = 'Matheus Kindrazki'

/** Twitter/X creator handle, derived from the profile social — never hardcoded. */
const TWITTER_CREATOR = `@${profile.social.twitter.split('/').filter(Boolean).pop()}`

/**
 * Turn a route path into the canonical, trailing-slashed absolute URL.
 *   '/'        → https://matheuskindrazki.dev/
 *   '/projetos'→ https://matheuskindrazki.dev/projetos/
 */
export function canonicalUrl(path: string): string {
  if (path === '/') return `${SITE_URL}/`
  const trimmed = `/${path.replace(/^\/+|\/+$/g, '')}`
  return `${SITE_URL}${trimmed}/`
}

export interface BuildMetadataInput {
  /** Route path, e.g. '/projetos'. '/' is the home route. */
  path: string
  /** Page title (already cased as you want it to read). */
  title: string
  /** Meta + OG + Twitter description. */
  description: string
  /**
   * Optional accent token, kept for call-site symmetry with the route registry.
   * Not emitted into <meta> today (themeColor is global, set in layout.tsx) but
   * accepted so per-route callers can pass routeMeta.accent without a lint error
   * and so a future per-route theme-color is a one-line change here.
   */
  accent?: string
}

/**
 * Single source of truth for per-route metadata. Returns a full Next Metadata
 * object: canonical (absolute, trailing-slash), OpenGraph, and Twitter cards.
 *
 * OG IMAGE CONTRACT (agent B): we deliberately DO NOT set openGraph.images or
 * twitter.images here. Next.js App Router auto-injects each route's colocated
 * `opengraph-image.{tsx,png,…}` (and `twitter-image.*`) into that route's
 * <head>, with the correct absolute URL + dimensions, when the file exists.
 * Hardcoding image URLs here would (a) duplicate that wiring and (b) override
 * the auto-injection. So agent B only has to drop the image files in place:
 *   - src/app/opengraph-image.tsx           → home  → /opengraph-image
 *   - src/app/projetos/opengraph-image.tsx  → /projetos/opengraph-image
 *   - src/app/skills/opengraph-image.tsx
 *   - src/app/sobre/opengraph-image.tsx
 *   - src/app/contato/opengraph-image.tsx
 *   - src/app/now/opengraph-image.tsx
 * Each should be 1200x630, exported with `size`/`contentType` per the Next
 * convention so the summary_large_image twitter card resolves automatically.
 */
export function buildMetadata({
  path,
  title,
  description,
}: BuildMetadataInput): Metadata {
  const url = canonicalUrl(path)

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      url,
      siteName: SITE_NAME,
      title,
      description,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: TWITTER_CREATOR,
    },
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Structured data (schema.org / JSON-LD). Every field below is DERIVED from
// the content.ts profile or the constants in this module — there are no
// hardcoded duplicates of anything that already has a source of truth. The
// objects are plain JsonLdSchema records consumed by <JsonLd> in the root
// layout, which serializes them XSS-safely into the SSR HTML.
// ──────────────────────────────────────────────────────────────────────────

/** Every public profile URL, in a stable order, for schema.org `sameAs`. */
const SAME_AS = Object.values(profile.social)

/**
 * Topics the author is known for — feeds Person.knowsAbout. Curated for the
 * structured-data graph (search engines use these as entity facets); kept here
 * rather than in content.ts because it is purely SEO metadata.
 */
const KNOWS_ABOUT = [
  'Frontend Architecture',
  'Applied AI',
  'RAG',
  'Microfrontends',
  'Design Systems',
]

/**
 * WebSite node — lets search engines treat the domain as a named site (and is
 * the conventional anchor for a future SearchAction sitelinks box).
 */
export function websiteSchema(): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: canonicalUrl('/'),
    inLanguage: 'en',
    author: { '@id': `${canonicalUrl('/')}#person` },
  }
}

/**
 * Person node — the author entity. worksFor (MokLabs), affiliation (CEIA/UFG),
 * address (Curitiba/BR), and sameAs (all socials) all derive from the profile.
 * It carries a stable @id so the WebSite node can reference it.
 */
export function personSchema(): JsonLdSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${canonicalUrl('/')}#person`,
    name: profile.name,
    alternateName: profile.nickname,
    url: canonicalUrl('/'),
    jobTitle: profile.title,
    description: profile.description,
    worksFor: {
      '@type': 'Organization',
      name: profile.company,
    },
    affiliation: {
      '@type': 'Organization',
      name: 'CEIA — Centro de Excelência em Inteligência Artificial',
      parentOrganization: {
        '@type': 'CollegeOrUniversity',
        name: 'Universidade Federal de Goiás (UFG)',
      },
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Curitiba',
      addressCountry: 'BR',
    },
    email: `mailto:${profile.email}`,
    sameAs: SAME_AS,
    knowsAbout: KNOWS_ABOUT,
  }
}
