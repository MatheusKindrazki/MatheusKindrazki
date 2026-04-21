// TODO: add IP-based rate limiting before public deployment

import { Resend } from 'resend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL ?? 'matheus@kindrazki.dev'
const CONTACT_FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL ?? 'onboarding@resend.dev'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request): Promise<Response> {
  let body: { name?: string; email?: string; message?: string }
  try {
    body = (await req.json()) as {
      name?: string
      email?: string
      message?: string
    }
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!name || name.length > 120) {
    return Response.json(
      { error: 'name is required (max 120 chars)' },
      { status: 400 },
    )
  }
  if (!email || !EMAIL_RE.test(email) || email.length > 200) {
    return Response.json({ error: 'valid email is required' }, { status: 400 })
  }
  if (!message || message.length > 4000) {
    return Response.json(
      { error: 'message is required (max 4000 chars)' },
      { status: 400 },
    )
  }

  if (!RESEND_API_KEY) {
    // Graceful fallback — same shape as /api/ask when unconfigured
    return Response.json(
      {
        ok: false,
        note: 'mail delivery not configured — reach Matheus at matheus@kindrazki.dev',
      },
      { status: 503 },
    )
  }

  try {
    const resend = new Resend(RESEND_API_KEY)
    const subject = `kindrazki.dev · ${name}`
    const plainBody = [
      `From:    ${name} <${email}>`,
      `Subject: contact form — kindrazki.dev`,
      '',
      message,
    ].join('\n')

    const { error } = await resend.emails.send({
      from: `kindrazki.dev <${CONTACT_FROM_EMAIL}>`,
      to: CONTACT_TO_EMAIL,
      replyTo: email,
      subject,
      text: plainBody,
    })

    if (error) {
      return Response.json(
        { ok: false, error: 'delivery failed' },
        { status: 502 },
      )
    }

    return Response.json({ ok: true })
  } catch {
    return Response.json(
      { ok: false, error: 'delivery failed' },
      { status: 502 },
    )
  }
}
