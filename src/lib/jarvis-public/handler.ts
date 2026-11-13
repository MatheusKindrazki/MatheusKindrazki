/**
 * Request handling for the public edition of Jarvis, with every side effect
 * injected so it can be tested without a network or an API key.
 *
 * Visitor message content and upstream error messages are never logged or
 * echoed back; logs carry status codes, counts and error class names only.
 *
 * Contract: a response body has an `error` string if and only if `response`
 * is NOT model output (notices, limits, failures, the switched-off answer).
 * The client relies on that marker to keep such turns out of the history.
 */
import {
  MAX_BODY_BYTES,
  clientKey,
  readCappedBody,
  isCrossSite,
  parseAskRequest,
  screenReply,
  type ChatTurn,
  type RateLimiter,
} from './guard'
import {
  DAILY_LIMIT_MESSAGE,
  DECLINED_MESSAGE,
  RATE_LIMITED_MESSAGE,
  UNAVAILABLE_MESSAGE,
  UPSTREAM_ERROR_MESSAGE,
} from './prompt'

type LogEvent = Record<string, string | number | boolean>

export interface AskDeps {
  isEnabled: () => boolean
  systemPrompt: string
  allowedEmails: string[]
  limiter: RateLimiter
  generate: (input: { system: string; messages: ChatTurn[] }) => Promise<{ text: string; refused: boolean }>
  log?: (event: LogEvent) => void
}

interface AskBody {
  response: string
  available: boolean
  error?: string
  retry_after?: number
}

function reply(body: AskBody, status = 200, headers?: Record<string, string>): Response {
  return Response.json(body, { status, headers })
}

/** Error class name and HTTP status only — never the message. */
function describeError(error: unknown): LogEvent {
  const event: LogEvent = {
    cause: error instanceof Error && error.name ? error.name : 'Error',
  }
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status: unknown }).status
    if (typeof status === 'number') event.upstream_status = status
  }
  return event
}

export function createAskHandler(deps: AskDeps): {
  GET(req: Request): Promise<Response>
  POST(req: Request): Promise<Response>
} {
  return {
    async GET(): Promise<Response> {
      return Response.json(
        { available: deps.isEnabled() },
        { status: 200, headers: { 'Cache-Control': 'no-store' } },
      )
    },

    async POST(req: Request): Promise<Response> {
      const key = clientKey(req.headers)
      const log = (event: LogEvent) =>
        deps.log?.(key === 'unknown' ? { ...event, anonymous: true } : event)

      if (isCrossSite(req.headers)) {
        log({ status: 403 })
        return reply({ response: '', available: deps.isEnabled(), error: 'forbidden' }, 403)
      }

      const body = await readCappedBody(req, MAX_BODY_BYTES)
      if (!body.ok) {
        log({ status: 413 })
        return reply({ response: '', available: deps.isEnabled(), error: 'payload too large' }, 413)
      }

      let raw: unknown
      try {
        raw = JSON.parse(body.text)
      } catch {
        return reply({ response: '', available: deps.isEnabled(), error: 'invalid json' }, 400)
      }

      const parsed = parseAskRequest(raw)
      if (!parsed.ok) {
        return reply({ response: '', available: deps.isEnabled(), error: parsed.error }, 400)
      }

      if (!deps.isEnabled()) {
        return reply({ response: UNAVAILABLE_MESSAGE, available: false, error: 'unavailable' })
      }

      const limit = deps.limiter.check(key)
      if (!limit.allowed) {
        log({ status: 429, scope: limit.scope })
        return reply(
          {
            response: limit.scope === 'global' ? DAILY_LIMIT_MESSAGE : RATE_LIMITED_MESSAGE,
            available: true,
            error: 'rate_limited',
            retry_after: limit.retryAfterSeconds,
          },
          429,
          { 'Retry-After': String(limit.retryAfterSeconds) },
        )
      }

      const turns = parsed.history.length + 1
      let result: { text: string; refused: boolean }
      try {
        result = await deps.generate({
          system: deps.systemPrompt,
          messages: [...parsed.history, { role: 'user', content: parsed.message }],
        })
      } catch (error) {
        log({ status: 503, turns, ...describeError(error) })
        return reply({ response: UPSTREAM_ERROR_MESSAGE, available: true, error: 'upstream' }, 503)
      }

      if (result.refused) {
        log({ status: 200, turns, refused: true })
        return reply({ response: DECLINED_MESSAGE, available: true, error: 'declined' })
      }

      const screened = screenReply(result.text, deps.allowedEmails)
      if (!screened.ok) {
        const empty = result.text.trim().length === 0
        log({ status: 200, turns, screened: true, empty })
        return reply({ response: UPSTREAM_ERROR_MESSAGE, available: true, error: empty ? 'empty' : 'screened' })
      }

      log({ status: 200, turns, chars: screened.text.length })
      return reply({ response: screened.text, available: true })
    },
  }
}
