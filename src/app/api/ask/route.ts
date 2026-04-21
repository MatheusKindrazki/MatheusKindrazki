// TODO: add IP-based rate limiting before public deployment

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const JARVIS_URL = process.env.JARVIS_API_URL
const JARVIS_KEY = process.env.JARVIS_API_KEY

export async function POST(req: Request): Promise<Response> {
  if (!JARVIS_URL || !JARVIS_KEY) {
    return Response.json(
      {
        response:
          "Jarvis is sleeping — the portfolio owner hasn't wired up the API key yet. But he's real, and you can reach him via the contact page.",
        sources: [],
        suggested_buttons: [],
        conversation_id: null,
      },
      { status: 200 },
    )
  }

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
        platform: 'api',
      }),
      // Jarvis responses can take 15s+ for complex questions. Set a 45s server timeout.
      signal: AbortSignal.timeout(45_000),
    })

    if (!upstream.ok) {
      return Response.json(
        {
          response:
            'Jarvis had trouble answering that one. Try rephrasing, or reach Matheus directly at matheus@kindrazki.dev.',
          sources: [],
          suggested_buttons: [],
          conversation_id: body.conversation_id ?? null,
        },
        { status: 200 },
      )
    }

    const data = (await upstream.json()) as {
      response?: unknown
      sources?: unknown
      suggested_buttons?: unknown
      conversation_id?: unknown
    }

    // Pass through only the fields the UI uses — don't leak upstream internals
    return Response.json({
      response: typeof data.response === 'string' ? data.response : '',
      sources: Array.isArray(data.sources) ? data.sources : [],
      suggested_buttons: Array.isArray(data.suggested_buttons)
        ? data.suggested_buttons
        : [],
      conversation_id:
        typeof data.conversation_id === 'string' ? data.conversation_id : null,
    })
  } catch (err) {
    const msg =
      err instanceof Error && err.name === 'TimeoutError'
        ? 'Jarvis took too long to reply — try a simpler question.'
        : 'Jarvis hit a snag. Try again in a moment.'
    return Response.json(
      {
        response: msg,
        sources: [],
        suggested_buttons: [],
        conversation_id: body.conversation_id ?? null,
      },
      { status: 200 },
    )
  }
}
