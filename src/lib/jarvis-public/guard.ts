/**
 * Input validation, request screening, rate limiting and reply screening for
 * the public edition of Jarvis. Pure: no runtime imports, unit-tested in
 * isolation.
 */

export const MAX_MESSAGE_CHARS = 800
export const MAX_HISTORY_MESSAGES = 12
export const MAX_HISTORY_ITEM_CHARS = 2500
export const MAX_REPLY_CHARS = 2500
/** Arrays longer than this are rejected before any item is inspected. */
export const MAX_HISTORY_INPUT_ITEMS = 60
/** Summed content length of the history kept for the model. */
export const MAX_HISTORY_TOTAL_CHARS = 8000
/** Request bodies longer than this are refused before parsing. */
export const MAX_BODY_BYTES = 32_000

type Env = Record<string, string | undefined>

/** The public edition runs only with the exact opt-in AND a non-empty API key. */
export function isPublicEnabled(env: Env): boolean {
  return env.JARVIS_PUBLIC_MODE === 'enabled' && Boolean(env.ANTHROPIC_API_KEY)
}

/** Requests per day per server instance: an integer 1..5000, default 200. */
export function dailyCap(env: Env): number {
  const raw = env.JARVIS_PUBLIC_DAILY_CAP
  const parsed = raw && /^\d+$/.test(raw.trim()) ? Number(raw.trim()) : NaN
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5000 ? parsed : 200
}

export type ChatTurn = { role: 'user' | 'assistant'; content: string }

export type ParsedAskRequest =
  | { ok: true; message: string; history: ChatTurn[] }
  | { ok: false; error: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseTurn(item: unknown): ChatTurn | null {
  if (!isRecord(item)) return null
  const { role, content } = item
  if (role !== 'user' && role !== 'assistant') return null
  if (typeof content !== 'string') return null
  const trimmed = content.trim()
  const limit = role === 'user' ? MAX_MESSAGE_CHARS : MAX_HISTORY_ITEM_CHARS
  if (trimmed.length < 1 || trimmed.length > limit) return null
  return { role, content: trimmed }
}

function dropLeadingAssistant(history: ChatTurn[]): ChatTurn[] {
  const firstUser = history.findIndex((turn) => turn.role === 'user')
  return firstUser === -1 ? [] : history.slice(firstUser)
}

function totalChars(history: ChatTurn[]): number {
  return history.reduce((sum, turn) => sum + turn.content.length, 0)
}

export function parseAskRequest(raw: unknown): ParsedAskRequest {
  if (!isRecord(raw)) return { ok: false, error: 'invalid request body' }

  const message = typeof raw.message === 'string' ? raw.message.trim() : ''
  if (!message) return { ok: false, error: 'message is required' }
  if (message.length > MAX_MESSAGE_CHARS) {
    return { ok: false, error: `message too long (max ${MAX_MESSAGE_CHARS} chars)` }
  }

  let history: ChatTurn[] = []
  if (raw.history !== undefined) {
    if (!Array.isArray(raw.history) || raw.history.length > MAX_HISTORY_INPUT_ITEMS) {
      return { ok: false, error: 'invalid history' }
    }
    for (const item of raw.history) {
      const turn = parseTurn(item)
      if (!turn) return { ok: false, error: 'invalid history' }
      history.push(turn)
    }
    history = dropLeadingAssistant(history.slice(-MAX_HISTORY_MESSAGES))
    while (totalChars(history) > MAX_HISTORY_TOTAL_CHARS) {
      history = dropLeadingAssistant(history.slice(1))
    }
  }

  return { ok: true, message, history }
}

export function clientKey(headers: Headers): string {
  const candidates = [
    headers.get('x-vercel-forwarded-for'),
    headers.get('x-real-ip'),
    headers.get('x-forwarded-for')?.split(',')[0],
  ]
  for (const candidate of candidates) {
    const value = candidate?.trim()
    if (value) return normalizeIp(value)
  }
  return 'unknown'
}

function parseIpv4(value: string): number[] | null {
  const parts = value.split('.')
  if (parts.length !== 4) return null
  const octets = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : NaN))
  return octets.every((octet) => Number.isInteger(octet) && octet <= 255) ? octets : null
}

/** Expands an IPv6 address to eight numeric hextets, or null if it does not parse. */
function parseIpv6(value: string): number[] | null {
  let address = value.toLowerCase()
  // An embedded IPv4 tail (`::ffff:1.2.3.4`) is rewritten as two hextets.
  const lastColon = address.lastIndexOf(':')
  const last = address.slice(lastColon + 1)
  if (last.includes('.')) {
    const v4 = parseIpv4(last)
    if (!v4) return null
    const high = ((v4[0] << 8) | v4[1]).toString(16)
    const low = ((v4[2] << 8) | v4[3]).toString(16)
    address = `${address.slice(0, lastColon + 1)}${high}:${low}`
  }
  const halves = address.split('::')
  if (halves.length > 2) return null
  const toGroups = (part: string) => (part === '' ? [] : part.split(':'))
  const head = toGroups(halves[0])
  const rest = halves.length === 2 ? toGroups(halves[1]) : []
  const groups = [...head, ...rest]
  if (!groups.every((group) => /^[0-9a-f]{1,4}$/.test(group))) return null
  if (halves.length === 1 ? groups.length !== 8 : groups.length > 7) return null
  const zeros = new Array<string>(8 - groups.length).fill('0')
  return [...head, ...zeros, ...rest].map((group) => parseInt(group, 16))
}

/**
 * IPv4 stays as is; IPv4-mapped IPv6 becomes the IPv4; other IPv6 collapses
 * to its /64 (one visitor per /64). Anything else is returned unchanged.
 */
function normalizeIp(value: string): string {
  if (parseIpv4(value)) return value
  const bare = value.replace(/^\[|\]$/g, '').replace(/%.*$/, '')
  if (!bare.includes(':')) return value
  const hextets = parseIpv6(bare)
  if (!hextets) return value
  if (hextets.slice(0, 5).every((h) => h === 0) && hextets[5] === 0xffff) {
    return [hextets[6] >> 8, hextets[6] & 0xff, hextets[7] >> 8, hextets[7] & 0xff].join('.')
  }
  return `${hextets.slice(0, 4).map((h) => h.toString(16)).join(':')}::/64`
}

export function isCrossSite(headers: Headers): boolean {
  if (headers.get('sec-fetch-site') === 'cross-site') return true
  const origin = headers.get('origin')
  if (origin === null) return false
  try {
    const originHost = new URL(origin).host.toLowerCase()
    return originHost !== (headers.get('host') ?? '').toLowerCase()
  } catch {
    return true
  }
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; scope: 'visitor' | 'global'; retryAfterSeconds: number }

export interface RateLimiter {
  check(key: string): RateLimitResult
}

/** Read-only view used by tests to observe memory bounds. */
export interface InspectableRateLimiter extends RateLimiter {
  size(): number
}

const MINUTE_MS = 60_000
const HOUR_MS = 3_600_000
const DAY_MS = 86_400_000
/** Above this many tracked visitors, stale keys are swept on the next check. */
const SWEEP_THRESHOLD = 500

function retryAfter(oldest: number, windowMs: number, now: number): number {
  return Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
}

/**
 * Sliding-window limiter held in memory. Best-effort on serverless: separate
 * instances do not share this state.
 */
export function createRateLimiter(options: {
  perMinute: number
  perHour: number
  perDay: number
  now?: () => number
}): InspectableRateLimiter {
  const now = options.now ?? Date.now
  const visitors = new Map<string, number[]>()
  let global: number[] = []

  return {
    check(key: string): RateLimitResult {
      const t = now()

      if (visitors.size > SWEEP_THRESHOLD) {
        for (const [visitor, stamps] of visitors) {
          if (stamps.every((ts) => ts <= t - HOUR_MS)) visitors.delete(visitor)
        }
      }

      global = global.filter((ts) => ts > t - DAY_MS)
      const hits = (visitors.get(key) ?? []).filter((ts) => ts > t - HOUR_MS)
      if (hits.length === 0) visitors.delete(key)
      else visitors.set(key, hits)

      if (global.length >= options.perDay) {
        return { allowed: false, scope: 'global', retryAfterSeconds: retryAfter(global[0], DAY_MS, t) }
      }

      const lastMinute = hits.filter((ts) => ts > t - MINUTE_MS)
      if (lastMinute.length >= options.perMinute) {
        return { allowed: false, scope: 'visitor', retryAfterSeconds: retryAfter(lastMinute[0], MINUTE_MS, t) }
      }
      if (hits.length >= options.perHour) {
        return { allowed: false, scope: 'visitor', retryAfterSeconds: retryAfter(hits[0], HOUR_MS, t) }
      }

      hits.push(t)
      visitors.set(key, hits)
      global.push(t)
      return { allowed: true }
    },
    size(): number {
      return visitors.size
    },
  }
}

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi

export function screenReply(
  text: string,
  allowedEmails: string[],
): { ok: true; text: string } | { ok: false } {
  const trimmed = text.trim()
  if (!trimmed) return { ok: false }
  const allowed = new Set(allowedEmails.map((email) => email.toLowerCase()))
  for (const match of trimmed.match(EMAIL_PATTERN) ?? []) {
    if (!allowed.has(match.toLowerCase())) return { ok: false }
  }
  return { ok: true, text: trimmed.slice(0, MAX_REPLY_CHARS) }
}

/**
 * Reads a request body while counting BYTES, and stops as soon as the total
 * passes `maxBytes` instead of buffering the whole body first. A declared
 * `content-length` above the limit is refused without reading at all.
 */
export async function readCappedBody(
  req: Pick<Request, 'headers' | 'body'>,
  maxBytes: number,
): Promise<{ ok: true; text: string } | { ok: false }> {
  const declared = Number(req.headers.get('content-length') ?? NaN)
  if (Number.isFinite(declared) && declared > maxBytes) return { ok: false }
  if (!req.body) return { ok: true, text: '' }

  const reader = req.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined)
      return { ok: false }
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return { ok: true, text: new TextDecoder('utf-8').decode(bytes) }
}

/**
 * Client-side decision for one `/api/ask` answer. `content` is the text to
 * show (null when the body has none); `local` means it is not model output —
 * a notice, an error, or the switched-off answer — so neither it nor the
 * question that produced it is sent back as history. Relies on the server's
 * `error` marker, never on comparing notice texts.
 */
export function classifyReply(status: number, body: unknown): { content: string | null; local: boolean } {
  if (!isRecord(body)) return { content: null, local: true }
  const content = typeof body.response === 'string' && body.response.length > 0 ? body.response : null
  const ok = status >= 200 && status < 300
  const local = !ok || content === null || body.available === false || typeof body.error === 'string'
  return { content, local }
}
