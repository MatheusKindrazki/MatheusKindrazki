/**
 * PUBLIC EDITION of Jarvis — the site chat.
 *
 * This route has NO connection to the private Jarvis backend. It calls the
 * Claude API directly with a system prompt made of fixed rules plus a public
 * dossier derived from this site's own content (src/lib/content.ts and the
 * owner-approved interview notes). The model has no tools, so its knowledge
 * is exactly that public dossier and it cannot act on anything.
 *
 * It is OFF unless JARVIS_PUBLIC_MODE=enabled AND ANTHROPIC_API_KEY is set.
 * While off, POST answers with a fixed offline message and never calls the
 * model.
 *
 * The in-memory rate limiter is best-effort: on serverless, instances do not
 * share memory, so the real spending backstop is a spend limit configured on
 * the API key itself.
 */
import {
  profile,
  roleSignals,
  projects,
  skillCategories,
  philosophy,
  timeline,
  writing,
  nowLearning,
  nowReading,
  nowThinking,
  nowNotDoing,
  site,
} from '@/lib/content'
import { createGenerate } from '@/lib/jarvis-public/anthropic'
import { buildDossier, dossierEmails, type DossierContent } from '@/lib/jarvis-public/dossier'
import { createRateLimiter, dailyCap, isPublicEnabled } from '@/lib/jarvis-public/guard'
import { createAskHandler } from '@/lib/jarvis-public/handler'
import { interviewNotes } from '@/lib/jarvis-public/interview'
import { buildSystemPrompt } from '@/lib/jarvis-public/prompt'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const dossierContent: DossierContent = {
  profile,
  roleSignals,
  projects,
  skillCategories,
  philosophy,
  timeline,
  writing,
  nowLearning,
  nowReading,
  nowThinking,
  nowNotDoing,
  site,
  interviewNotes,
}

const systemPrompt = buildSystemPrompt(buildDossier(dossierContent))

const limiter = createRateLimiter({ perMinute: 6, perHour: 30, perDay: dailyCap(process.env) })

let generate: ReturnType<typeof createGenerate> | null = null

const handler = createAskHandler({
  isEnabled: () => isPublicEnabled(process.env),
  systemPrompt,
  allowedEmails: dossierEmails(dossierContent),
  limiter,
  generate: (input) => {
    generate ??= createGenerate({
      apiKey: process.env.ANTHROPIC_API_KEY ?? '',
      model: process.env.JARVIS_PUBLIC_MODEL || 'claude-opus-5-5',
    })
    return generate(input)
  },
  log: (event) => console.info('[jarvis-public]', event),
})

export const GET = handler.GET
export const POST = handler.POST
