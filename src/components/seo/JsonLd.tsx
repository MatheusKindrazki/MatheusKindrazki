/**
 * A JSON-LD node. Loose-but-honest typing: schema.org graphs are recursive and
 * open-ended, so we model a node as a JSON object that MUST carry `@context` and
 * `@type` at the root. We avoid pulling in the heavyweight `schema-dts` package
 * (not a dependency here) and instead keep this self-contained.
 */
export type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue }

export interface JsonLdSchema {
  '@context': string
  '@type': string
  [key: string]: JsonLdValue
}

/**
 * Renders a single <script type="application/ld+json"> tag for one schema.org
 * node. This is a Server Component (no 'use client') so the JSON is emitted in
 * the initial SSR HTML — exactly where crawlers (Google, LinkedIn, etc.) read
 * structured data.
 *
 * SECURITY: JSON-LD lives inside an HTML <script> element, so the one byte that
 * can break out of that context is `<` (e.g. a "</script>" sequence, or a "<!--"
 * smuggled in user content). We JSON.stringify and then escape every `<` to its
 * unicode form `<`. JSON.parse treats < as a literal '<', so the data
 * round-trips losslessly while becoming impossible to abuse for XSS. We use
 * dangerouslySetInnerHTML on purpose: React would otherwise HTML-escape the
 * JSON (turning `"` into `&quot;`), producing invalid JSON-LD.
 */
export default function JsonLd({ schema }: { schema: JsonLdSchema }) {
  const json = JSON.stringify(schema).replace(/</g, '\\u003c')

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
