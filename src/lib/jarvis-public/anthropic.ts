import Anthropic, { type ClientOptions } from '@anthropic-ai/sdk'
import type { ChatTurn } from './guard'

/** Models that accept the server-side fallback beta (`fallbacks: 'default'`). */
const SERVER_FALLBACK_MODELS = new Set([
  'claude-opus-5-5',
  'claude-opus-5',
  'claude-sonnet-5-5',
  'claude-fable-5-2',
  'claude-fable-5-1',
])

export function supportsServerFallback(model: string): boolean {
  return SERVER_FALLBACK_MODELS.has(model)
}

/** Text up to the last `.`, `!` or `?` that ends a sentence; '' when there is none. */
function cutAtSentenceEnd(text: string): string {
  let end = -1
  for (const match of text.matchAll(/[.!?](?=\s|$)/g)) end = (match.index ?? 0) + 1
  return end === -1 ? '' : text.slice(0, end).trim()
}

/**
 * Builds the `generate` dependency of the ask handler. No tools are defined:
 * the model can only read the system prompt and the conversation.
 *
 * The 20s timeout with no retry keeps a slow upstream inside the route's 30s
 * `maxDuration`, so the handler can still answer 503 as JSON.
 * SDK errors propagate; the handler maps any throw to 503.
 */
export function createGenerate(config: {
  apiKey: string
  model: string
  /** Test seam: replaces the HTTP transport. */
  fetch?: ClientOptions['fetch']
}) {
  const client = new Anthropic({
    apiKey: config.apiKey,
    timeout: 20_000,
    maxRetries: 0,
    ...(config.fetch ? { fetch: config.fetch } : {}),
  })

  return async function generate(input: {
    system: string
    messages: ChatTurn[]
  }): Promise<{ text: string; refused: boolean }> {
    const response = await client.beta.messages.create({
      model: config.model,
      max_tokens: 1000,
      output_config: { effort: 'low' },
      system: [{ type: 'text', text: input.system, cache_control: { type: 'ephemeral' } }],
      messages: input.messages,
      ...(supportsServerFallback(config.model)
        ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }
        : {}),
    })

    if (response.stop_reason === 'refusal') return { text: '', refused: true }

    // After a server-side fallback, blocks before the last `fallback` block
    // belong to the abandoned attempt; only the final model's text counts.
    const lastFallback = response.content.reduce(
      (index, block, i) => (block.type === 'fallback' ? i : index),
      -1,
    )
    const text = response.content
      .slice(lastFallback + 1)
      .flatMap((block) => (block.type === 'text' ? [block.text] : []))
      .join('\n')

    if (response.stop_reason === 'max_tokens') {
      return { text: cutAtSentenceEnd(text), refused: false }
    }
    return { text, refused: false }
  }
}
