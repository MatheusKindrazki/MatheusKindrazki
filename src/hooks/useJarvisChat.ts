'use client'

import { useCallback, useEffect, useState } from 'react'
import { PUBLIC_INTRO, UPSTREAM_ERROR_MESSAGE } from '@/lib/jarvis-public/prompt'

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
  /** Shown in the panel but never part of the model conversation (intro, notices, unanswered turns). */
  local?: boolean
}

export const JARVIS_INTRO =
  "Hey — I'm Jarvis, Matheus's personal AI. I'm private, so I'm offline for visitors right now. " +
  'Want to talk to the real Matheus? Reach him through the contact page.'

const MAX_HISTORY = 12
const EMPTY_REPLY_MESSAGE = 'Something went wrong on my side. Try again in a moment.'
const NETWORK_ERROR_MESSAGE = 'Network error. Try again in a moment.'

interface UseJarvisChatResult {
  messages: ChatMessage[]
  loading: boolean
  send: (text: string) => Promise<void>
}

function introMessage(available: boolean): ChatMessage {
  return { role: 'assistant', content: available ? PUBLIC_INTRO : JARVIS_INTRO, local: true }
}

/**
 * Turns the HTTP outcome into the assistant message to show. `local` means the
 * turn failed (or the edition is off), so neither the question nor the notice
 * is replayed to the model as history.
 */
async function readReply(res: Response): Promise<{ content: string; local: boolean }> {
  let data: unknown
  try {
    data = JSON.parse(await res.text())
  } catch {
    // e.g. a platform 504 page instead of our JSON
    return { content: UPSTREAM_ERROR_MESSAGE, local: true }
  }
  const body = typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : {}
  const response = typeof body.response === 'string' && body.response.length > 0 ? body.response : null
  const local = !res.ok || response === null || body.available === false
  return { content: response ?? EMPTY_REPLY_MESSAGE, local }
}

export function useJarvisChat(available: boolean): UseJarvisChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [introMessage(available)])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMessages((prev) =>
      prev.some((message) => message.role === 'user') ? prev : [introMessage(available)],
    )
  }, [available])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      const history = messages
        .filter((message) => !message.local)
        .slice(-MAX_HISTORY)
        .map(({ role, content }) => ({ role, content }))

      const userMsg: ChatMessage = { role: 'user', content: trimmed }
      setMessages((prev) => [...prev, userMsg])
      setLoading(true)

      const finish = (reply: ChatMessage) => {
        setMessages((prev) => [
          ...(reply.local
            ? prev.map((message) => (message === userMsg ? { ...message, local: true } : message))
            : prev),
          reply,
        ])
      }

      try {
        let res: Response
        try {
          res = await fetch('/api/ask', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ message: trimmed, history }),
          })
        } catch {
          finish({ role: 'assistant', content: NETWORK_ERROR_MESSAGE, local: true })
          return
        }
        const reply = await readReply(res)
        finish({ role: 'assistant', content: reply.content, ...(reply.local ? { local: true } : {}) })
      } catch {
        finish({ role: 'assistant', content: UPSTREAM_ERROR_MESSAGE, local: true })
      } finally {
        setLoading(false)
      }
    },
    [loading, messages],
  )

  return { messages, loading, send }
}
