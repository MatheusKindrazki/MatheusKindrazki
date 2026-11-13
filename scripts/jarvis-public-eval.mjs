#!/usr/bin/env node
/**
 * Adversarial evaluation for the public edition of Jarvis.
 *
 * Sends every case in jarvis-public-eval.cases.json to a RUNNING local server
 * (`/api/ask`) and prints each reply next to the automatic checks. It spends
 * real API credit: one model call per case.
 *
 *   JARVIS_PUBLIC_MODE=enabled ANTHROPIC_API_KEY=... npx next dev -p 3939
 *   node scripts/jarvis-public-eval.mjs [--base http://localhost:3939] [--out report.json] [--only id1,id2]
 *
 * What the automatic checks prove, and what they do not:
 * - `mustNot` patterns catch the obvious leaks (a currency amount, a phone
 *   number, a code block). A pass means none of THOSE strings appeared.
 * - They cannot judge tone, invented facts or a polite-but-wrong answer.
 *   Read every reply. A green run without reading is not an evaluation.
 *
 * Local only: each case is sent as a different visitor through the
 * `x-forwarded-for` header so the per-visitor rate limit does not stop the
 * run. A deployed host overwrites that header, so this does not bypass the
 * limit in production.
 */
import { readFile, writeFile } from 'node:fs/promises'

const args = process.argv.slice(2)
function flag(name, fallback) {
  const index = args.indexOf(`--${name}`)
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback
}

const base = flag('base', 'http://localhost:3939').replace(/\/$/, '')
const outFile = flag('out', '')
const only = flag('only', '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean)

const allCases = JSON.parse(
  await readFile(new URL('./jarvis-public-eval.cases.json', import.meta.url), 'utf8'),
)
const cases = only.length > 0 ? allCases.filter((item) => only.includes(item.id)) : allCases

const status = await fetch(`${base}/api/ask`).then((res) => res.json()).catch(() => null)
if (!status || status.available !== true) {
  console.error(
    `The public edition is not available at ${base}/api/ask.\n` +
      'Start the dev server with JARVIS_PUBLIC_MODE=enabled and ANTHROPIC_API_KEY set.',
  )
  process.exit(2)
}

const results = []
let failures = 0

for (const [index, item] of cases.entries()) {
  const response = await fetch(`${base}/api/ask`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      // One synthetic visitor per case; see the header comment.
      'x-forwarded-for': `203.0.113.${(index % 250) + 1}`,
    },
    body: JSON.stringify({ message: item.message, history: item.history ?? [] }),
  })
  const body = await response.json().catch(() => ({}))
  const reply = typeof body.response === 'string' ? body.response : ''
  const violations = (item.mustNot ?? []).filter((pattern) => new RegExp(pattern, 'i').test(reply))
  const failed = violations.length > 0 || !response.ok || typeof body.error === 'string' || reply.length === 0
  if (failed) failures++

  results.push({ id: item.id, kind: item.kind, status: response.status, error: body.error ?? null, violations, reply })
  console.log(
    `\n[${failed ? 'CHECK' : 'ok'}] ${item.id} (${item.kind}) · HTTP ${response.status}` +
      (typeof body.error === 'string' ? ` · error: ${body.error}` : ''),
  )
  console.log(`  visitor: ${item.message}`)
  console.log(`  jarvis:  ${reply.replace(/\n/g, '\n           ')}`)
  for (const pattern of violations) console.log(`  matched forbidden pattern: ${pattern}`)
}

if (outFile) await writeFile(outFile, JSON.stringify(results, null, 2))

console.log(
  `\n${cases.length} case(s), ${failures} flagged by the automatic checks.` +
    '\nThe checks only catch obvious strings. Read every reply before calling this evaluated.',
)
process.exit(failures > 0 ? 1 : 0)
