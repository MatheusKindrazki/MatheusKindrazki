const fs = require('fs');

const content = `'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useJarvis } from './JarvisProvider'
import {
  useJarvisChat,
  JARVIS_INTRO,
  type ChatMessage,
  type SuggestedButton,
} from '@/hooks/useJarvisChat'

const SUGGESTIONS: string[] = [
  "what's matheus building right now?",
  'tell me about MokLabs',
  "what's his engineering philosophy?",
  'why Jarvis?',
]

function useIsNarrow(breakpoint = 640): boolean {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const check = () => setNarrow(window.innerWidth < breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])
  return narrow
}

interface MessageProps {
  message: ChatMessage
  onSuggestedClick: (text: string) => void
  disabled: boolean
}

function MessageBubble({ message, onSuggestedClick, disabled }: MessageProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end mt-8">
        <div className="flex flex-col items-end max-w-[85%]">
          <span
            className="mb-2 text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--color-kindra-meta-mid)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            [ user ]
          </span>
          <div
            className="text-[14px] leading-[22px] text-white whitespace-pre-wrap text-right"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {message.content}
          </div>
        </div>
      </div>
    )
  }

  const hasSources = !!message.sources && message.sources.length > 0
  const hasSuggested = !!message.suggestedButtons && message.suggestedButtons.length > 0

  return (
    <div className="flex flex-col items-start mt-8">
      <span
        className="mb-2 text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--color-kindra-yellow)] flex items-center gap-2"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <span aria-hidden className="inline-block w-[0.5em] h-[0.5em] bg-[var(--color-kindra-yellow)]" />
        jarvis
      </span>
      <div
        className="text-[14px] leading-[24px] text-[#d0d0d0] whitespace-pre-wrap"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {message.content}
      </div>
      {hasSources && (
        <div
          className="mt-3 text-[10px] tracking-[0.2em] uppercase text-[var(--color-kindra-meta-low)] border-l border-[var(--color-kindra-rule-strong)] pl-3"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <span className="text-[var(--color-kindra-rule-strong)]">//</span> grounded on &middot; {message.sources!.join(' · ')}
        </div>
      )}
      {hasSuggested && (
        <div className="mt-4 flex flex-wrap gap-3">
          {message.suggestedButtons!.map((b: SuggestedButton, i) => (
            <button
              key={\`\${b.text}-\${i}\`}
              type="button"
              data-cursor="link"
              onClick={() => onSuggestedClick(b.text)}
              disabled={disabled}
              className="text-[11px] tracking-[0.05em] text-[var(--color-kindra-meta-mid)] transition-colors duration-300 hover:text-[var(--color-kindra-yellow)] disabled:opacity-50 text-left"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <span className="text-[var(--color-kindra-rule-strong)]">[ </span>
              {b.text}
              <span className="text-[var(--color-kindra-rule-strong)]"> ]</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function LoadingBubble() {
  return (
    <div className="flex flex-col items-start mt-8">
      <span
        className="mb-2 text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--color-kindra-yellow)] flex items-center gap-2"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <span aria-hidden className="inline-block w-[0.5em] h-[0.5em] bg-[var(--color-kindra-yellow)]" />
        jarvis
      </span>
      <div
        className="flex items-center gap-[6px] text-[14px] leading-[22px] text-[var(--color-kindra-yellow)] h-[24px]"
        aria-label="Jarvis is thinking"
      >
        <span
          className="inline-block h-1 w-1 animate-ping rounded-full bg-current"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="inline-block h-1 w-1 animate-ping rounded-full bg-current"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="inline-block h-1 w-1 animate-ping rounded-full bg-current"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  )
}

export default function JarvisChat() {
  const { open, setOpen } = useJarvis()
  const { messages, loading, send } = useJarvisChat()
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const reduceMotion = useReducedMotion()
  const isNarrow = useIsNarrow(640)

  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const maxHeight = 22 * 4 + 16
    el.style.height = \`\${Math.min(el.scrollHeight, maxHeight)}px\`
  }, [input])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, loading])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      textareaRef.current?.focus()
    }, 320)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, setOpen])

  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return
      setInput('')
      void send(trimmed)
    },
    [send, loading],
  )

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    submit(input)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(input)
    }
  }

  const showSuggestions = useMemo(() => {
    return (
      messages.length === 1 &&
      messages[0].role === 'assistant' &&
      messages[0].content === JARVIS_INTRO
    )
  }, [messages])

  const hasInput = input.trim().length > 0

  const panelInitial = reduceMotion ? { opacity: 0 } : isNarrow ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 }
  const panelAnimate = reduceMotion ? { opacity: 1 } : isNarrow ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }
  const panelExit = reduceMotion ? { opacity: 0 } : isNarrow ? { y: '100%', opacity: 0 } : { x: '100%', opacity: 0 }
  const panelTransition = reduceMotion ? { duration: 0.25 } : { type: 'spring', stiffness: 350, damping: 35 }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="jarvis-backdrop"
            aria-hidden
            className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setOpen(false)}
          />

          <motion.aside
            key="jarvis-panel"
            role="dialog"
            aria-label="Jarvis chat"
            aria-modal="true"
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={panelTransition}
            className="fixed z-[70] flex flex-col border-l border-[var(--color-kindra-rule-strong)] bg-[#050505] inset-y-0 right-0 w-full sm:w-[500px]"
          >
            {/* Header */}
            <header className="flex-none flex items-center justify-between border-b border-[var(--color-kindra-rule)] px-8 py-6">
              <div className="flex flex-col gap-2">
                <span
                  className="text-[28px] font-bold leading-none text-white tracking-[-0.03em]"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Jarvis <span className="text-[var(--color-kindra-yellow)]">/</span>
                </span>
                <span
                  className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-mid)]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  <span className="relative inline-flex h-[6px] w-[6px]">
                    <span className="absolute inset-0 animate-ping rounded-full bg-[var(--color-kindra-green)] opacity-70" />
                    <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-[var(--color-kindra-green)]" />
                  </span>
                  <span>knowledge graph active</span>
                </span>
              </div>
              <button
                type="button"
                data-cursor="link"
                onClick={() => setOpen(false)}
                aria-label="Close Jarvis chat"
                className="flex h-10 w-10 items-center justify-center border border-[var(--color-kindra-rule)] bg-[#111] text-[18px] text-[var(--color-kindra-meta-low)] transition-all duration-300 hover:border-[var(--color-kindra-yellow)] hover:text-white"
              >
                <span aria-hidden>&times;</span>
              </button>
            </header>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-8 pb-8 pt-2"
            >
              {messages.map((m, i) => (
                <MessageBubble
                  key={i}
                  message={m}
                  onSuggestedClick={submit}
                  disabled={loading}
                />
              ))}

              {loading && <LoadingBubble />}

              {showSuggestions && (
                <div className="flex flex-col items-start gap-3 pt-8">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)] border-b border-[var(--color-kindra-rule)] pb-2 w-full">
                    // suggested queries
                  </span>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      data-cursor="link"
                      onClick={() => submit(s)}
                      disabled={loading}
                      className="text-[12px] tracking-[0.03em] text-[var(--color-kindra-meta-mid)] transition-colors duration-300 hover:text-[var(--color-kindra-yellow)] disabled:opacity-50 text-left"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      <span className="text-[var(--color-kindra-rule-strong)] mr-2">&rarr;</span>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex-none border-t border-[var(--color-kindra-rule)] p-8 bg-[#020202]"
            >
              <div className="flex items-start gap-4">
                <span
                  aria-hidden
                  className="pt-[2px] text-[16px] text-[var(--color-kindra-yellow)] select-none font-bold"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  &gt;
                </span>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={loading}
                  placeholder="Ask anything..."
                  className="flex-1 resize-none bg-transparent text-[15px] leading-[24px] text-white outline-none placeholder:text-[#444] disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-body)' }}
                />
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="text-[9px] uppercase tracking-[0.3em] text-[#444]" style={{ fontFamily: 'var(--font-body)' }}>
                  powered by kindra.dev
                </div>
                <button
                  type="submit"
                  data-cursor="link"
                  disabled={loading || !hasInput}
                  className="text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-30"
                  style={{
                    color: hasInput && !loading ? 'var(--color-kindra-yellow)' : '#555',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  [ press enter ]
                </button>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
`;

fs.writeFileSync('src/components/chat/JarvisChat.tsx', content);
