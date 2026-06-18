export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * SECURITY — the public portfolio chat is DISCONNECTED from the personal
 * Jarvis backend.
 *
 * The previous implementation proxied every anonymous visitor message straight
 * to the owner's personal Jarvis (`platform: 'api'`), which the backend treats
 * as the owner: full access to private context (profile, agenda, memory,
 * documents) AND the ability to EXECUTE actions (it was observed creating
 * tasks). That leaks personal data and lets strangers mutate the owner's
 * system — unacceptable for a public endpoint.
 *
 * Until the Jarvis backend ships a hardened public/read-only mode (no personal
 * data, no actions), this route does NOT call Jarvis at all. It returns a
 * fixed, safe message. The proxy stays gated behind an explicit opt-in env so
 * it can never silently re-enable: it only proxies when
 * JARVIS_PUBLIC_MODE === 'enabled' AND the URL/key are set. Setting the key
 * alone is no longer enough.
 */

const JARVIS_URL = process.env.JARVIS_API_URL
const JARVIS_KEY = process.env.JARVIS_API_KEY
const PUBLIC_MODE_ENABLED = process.env.JARVIS_PUBLIC_MODE === 'enabled'

const UNAVAILABLE_MESSAGE =
  "Jarvis is offline for visitors right now — it's my private assistant, not a public one. " +
  'Ask me anything in person instead: reach me through the contact page.'

function unavailable(): Response {
  return Response.json(
    {
      response: UNAVAILABLE_MESSAGE,
      sources: [],
      suggested_buttons: [],
      conversation_id: null,
    },
    { status: 200 },
  )
}

export async function POST(req: Request): Promise<Response> {
  // Validate input shape even while disabled, so the contract is stable and we
  // never echo arbitrary bodies back.
  let body: { message?: string; conversation_id?: string | null }
  try {
    body = (await req.json()) as {
      message?: string
      conversation_id?: string | null
    }
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 })
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) {
    return Response.json({ error: 'message is required' }, { status: 400 })
  }
  if (message.length > 2000) {
    return Response.json(
      { error: 'message too long (max 2000 chars)' },
      { status: 400 },
    )
  }

  // Hard gate: the personal Jarvis is NEVER contacted unless public mode is
  // explicitly enabled AND the backend has a hardened read-only public mode.
  // Today that mode does not exist, so this stays off and we short-circuit.
  if (!PUBLIC_MODE_ENABLED || !JARVIS_URL || !JARVIS_KEY) {
    return unavailable()
  }

  // NOTE: This proxy path is intentionally unreachable until JARVIS_PUBLIC_MODE
  // is set to 'enabled'. Before enabling it, the Jarvis backend MUST enforce a
  // public, read-only, no-actions, no-personal-data mode for `platform:
  // 'public'`. Do not flip the env without that guarantee.
  try {
    const upstream = await fetch(`${JARVIS_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': JARVIS_KEY,
      },
      body: JSON.stringify({
        message,
        conversation_id: body.conversation_id ?? undefined,
        // Signal the public, consultative, read-only context to the backend.
        // The backend is the source of truth for enforcing it.
        platform: 'public',
        mode: 'public_readonly',
        allow_actions: false,
      }),
      signal: AbortSignal.timeout(45_000),
    })

    if (!upstream.ok) return unavailable()

    const data = (await upstream.json()) as {
      response?: unknown
      sources?: unknown
      suggested_buttons?: unknown
      conversation_id?: unknown
    }

    return Response.json({
      response: typeof data.response === 'string' ? data.response : '',
      sources: Array.isArray(data.sources) ? data.sources : [],
      suggested_buttons: Array.isArray(data.suggested_buttons)
        ? data.suggested_buttons
        : [],
      conversation_id:
        typeof data.conversation_id === 'string' ? data.conversation_id : null,
    })
  } catch {
    return unavailable()
  }
}
