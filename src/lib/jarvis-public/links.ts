/**
 * Turns URLs and emails in a public-edition reply into link segments, but only
 * for destinations the site itself publishes. Everything else stays plain text,
 * so a manipulated reply cannot turn into a link to an arbitrary host.
 *
 * Pure: type imports only, unit-tested in isolation. The result is rendered as
 * React elements, never as HTML.
 */
import type { DossierContent } from './dossier'

// Mirrors SITE_URL in dossier.ts; kept local so this module stays import-free
// at runtime.
const SITE_URL = 'https://matheuskindrazki.dev'

export type LinkSegment =
  | { type: 'text'; value: string }
  | { type: 'link'; value: string; href: string }

export interface LinkTargets {
  /** The owner's own site: any path on it may be linked. */
  siteHost: string
  /** Published URLs, normalised; these and their subpaths may be linked. */
  urls: string[]
}

/** Lowercase-host origin + pathname without a trailing slash, or null. */
function normalizeUrl(value: string | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return `${url.origin.toLowerCase()}${url.pathname.replace(/\/+$/, '')}`
  } catch {
    return null
  }
}

export function publicLinkTargets(
  content: Pick<DossierContent, 'profile' | 'projects' | 'writing'>,
): LinkTargets {
  const candidates: (string | undefined)[] = [
    content.profile.calLink,
    ...Object.values(content.profile.social),
    ...content.projects.flatMap((project) => [
      project.link,
      ...(project.caseNote?.references ?? []).map((reference) => reference.url),
    ]),
    ...content.writing.map((piece) => piece.link),
  ]
  const urls = new Set<string>()
  for (const candidate of candidates) {
    const normalized = normalizeUrl(candidate)
    if (normalized) urls.add(normalized)
  }
  return { siteHost: new URL(SITE_URL).hostname.toLowerCase(), urls: [...urls] }
}

const TOKEN_PATTERN = /https:\/\/[^\s<>"'`]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
const TRAILING_PUNCTUATION = /[.,;:!?)]+$/

function bareHost(host: string): string {
  return host.startsWith('www.') ? host.slice(4) : host
}

function isAllowedUrl(token: string, targets: LinkTargets): boolean {
  // Userinfo (`user@`) and explicit ports (`:8443`) are never linked.
  const authority = token.slice('https://'.length).split(/[/?#]/)[0]
  if (authority.includes('@') || authority.includes(':')) return false
  let url: URL
  try {
    url = new URL(token)
  } catch {
    return false
  }
  if (bareHost(url.hostname.toLowerCase()) === bareHost(targets.siteHost.toLowerCase())) return true
  const normalized = normalizeUrl(token)
  if (!normalized) return false
  return targets.urls.some((allowed) => normalized === allowed || normalized.startsWith(`${allowed}/`))
}

export function splitLinks(text: string, targets: LinkTargets, allowedEmails: string[]): LinkSegment[] {
  const emails = new Set(allowedEmails.map((email) => email.toLowerCase()))
  const segments: LinkSegment[] = []

  const pushText = (value: string) => {
    if (!value) return
    const last = segments[segments.length - 1]
    if (last && last.type === 'text') last.value += value
    else segments.push({ type: 'text', value })
  }

  let cursor = 0
  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const start = match.index ?? 0
    const isUrl = match[0].toLowerCase().startsWith('https://')
    const token = isUrl ? match[0].replace(TRAILING_PUNCTUATION, '') : match[0]
    pushText(text.slice(cursor, start))
    cursor = start + token.length

    if (isUrl && isAllowedUrl(token, targets)) {
      segments.push({ type: 'link', value: token, href: token })
    } else if (!isUrl && emails.has(token.toLowerCase())) {
      segments.push({ type: 'link', value: token, href: `mailto:${token}` })
    } else {
      pushText(token)
    }
  }
  pushText(text.slice(cursor))

  return segments.length > 0 ? segments : [{ type: 'text', value: text }]
}
