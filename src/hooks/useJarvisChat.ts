'use client'

import { useCallback, useRef, useState } from 'react'

export type ChatRole = 'user' | 'assistant'

export interface SuggestedButton {
  text: string
  action: string
}

export interface ChatMessage {
  role: ChatRole
  content: string
  sources?: string[]
  suggestedButtons?: SuggestedButton[]
}

export const JARVIS_INTRO =
  "Hey — I'm Jarvis, Matheus's personal AI. I know his projects, his thinking, his story. Ask me anything."

interface ApiResponse {
  response: string
  sources: string[]
  suggested_buttons: SuggestedButton[]
  conversation_id: string | null
}

interface UseJarvisChatResult {
  messages: ChatMessage[]
  loading: boolean
  send: (text: string) => Promise<void>
}

export function useJarvisChat(): UseJarvisChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: JARVIS_INTRO },
  ])
  const [loading, setLoading] = useState(false)
  const conversationIdRef = useRef<string | null>(null)

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      const userMsg: ChatMessage = { role: 'user', content: trimmed }
      setMessages((prev) => [...prev, userMsg])
      setLoading(true)

      try {
        const res = await fetch('/api/ask', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            conversation_id: conversationIdRef.current,
          }),
        })

        const data = (await res.json()) as Partial<ApiResponse>

        if (typeof data.conversation_id === 'string' && data.conversation_id) {
          conversationIdRef.current = data.conversation_id
        }

        const assistant: ChatMessage = {
          role: 'assistant',
          content:
            typeof data.response === 'string' && data.response.length > 0
              ? data.response
              : '(empty response)',
          sources: Array.isArray(data.sources) ? data.sources : [],
          suggestedButtons: Array.isArray(data.suggested_buttons)
            ? data.suggested_buttons
            : [],
        }
        setMessages((prev) => [...prev, assistant])
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Network error. Try again in a moment.',
          },
        ])
      } finally {
        setLoading(false)
      }
    },
    [loading],
  )

  return { messages, loading, send }
}
