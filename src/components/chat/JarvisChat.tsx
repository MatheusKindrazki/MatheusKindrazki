'use client'

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

/* ────────────────────────────────────────────────────────────────────
   Message rendering
   ──────────────────────────────────────────────────────────────────── */

interface MessageProps {
  message: ChatMessage
  onSuggestedClick: (text: string) => void
  disabled: boolean
  isFirst?: boolean
}

function MessageBubble({ message, onSuggestedClick, disabled, isFirst }: MessageProps) {
  if (message.role === 'user') {
    return (
      <div className={isFirst ? '' : 'mt-10'}>
        <div className="flex items-baseline gap-3 mb-2">
          <span className="h-px flex-1 bg-[var(--color-kindra-rule)]" />
          <span
            className="text-[9px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            you
          </span>
        </div>
        <p
          className="text-[15px] leading-[26px] text-white"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {message.content}
        </p>
      </div>
    )
  }

  const hasSources = !!message.sources && message.sources.length > 0
  const hasSuggested = !!message.suggestedButtons && message.suggestedButtons.length > 0

  return (
    <div className={isFirst ? '' : 'mt-10'}>
      <div className="flex items-baseline gap-3 mb-3">
        <span
          aria-hidden
          className="inline-block"
          style={{
            width: '0.45em',
            height: '0.45em',
            backgroundColor: 'var(--color-kindra-yellow)',
            transform: 'translateY(-1px)',
          }}
        />
        <span
          className="text-[9px] uppercase tracking-[0.3em] text-[var(--color-kindra-yellow)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          jarvis
        </span>
        <span className="h-px flex-1 bg-[var(--color-kindra-rule)]" />
      </div>
      <p
        className="text-[15px] leading-[28px] text-[var(--color-kindra-meta-high)] whitespace-pre-wrap"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {message.content}
      </p>
      {hasSources && (
        <p
          className="mt-5 text-[10px] tracking-[0.2em] uppercase text-[var(--color-kindra-meta-low)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <span className="text-[var(--color-kindra-rule-strong)]">//</span>{' '}
          grounded on &middot; {message.sources!.join(' · ')}
        </p>
      )}
      {hasSuggested && (
        <div className="mt-6 flex flex-wrap gap-2">
          {message.suggestedButtons!.map((b: SuggestedButton, i) => (
            <button
              key={`${b.text}-${i}`}
              type="button"
              data-cursor="link"
              onClick={() => onSuggestedClick(b.text)}
              disabled={disabled}
              className="rounded-full border border-[var(--color-kindra-rule)] px-4 py-2 text-[11px] tracking-[0.02em] text-[var(--color-kindra-meta-mid)] transition-all duration-300 hover:border-[var(--color-kindra-yellow)] hover:text-white disabled:opacity-40"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {b.text}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function LoadingBubble() {
  return (
    <div className="mt-10">
      <div className="flex items-baseline gap-3 mb-3">
        <span
          aria-hidden
          className="inline-block"
          style={{
            width: '0.45em',
            height: '0.45em',
            backgroundColor: 'var(--color-kindra-yellow)',
            transform: 'translateY(-1px)',
          }}
        />
        <span
          className="text-[9px] uppercase tracking-[0.3em] text-[var(--color-kindra-yellow)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          jarvis
        </span>
        <span className="h-px flex-1 bg-[var(--color-kindra-rule)]" />
      </div>
      <div className="flex items-center gap-2 h-[28px]">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-kindra-yellow)] animate-pulse" />
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-kindra-yellow)] animate-pulse"
          style={{ animationDelay: '200ms' }}
        />
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-kindra-yellow)] animate-pulse"
          style={{ animationDelay: '400ms' }}
        />
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────────
   Main panel
   ──────────────────────────────────────────────────────────────────── */

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
    const maxHeight = 24 * 4 + 16
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`
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

  const panelInitial = reduceMotion
    ? { opacity: 0 }
    : isNarrow
      ? { y: '100%', opacity: 0 }
      : { x: '100%', opacity: 0 }
  const panelAnimate = reduceMotion
    ? { opacity: 1 }
    : isNarrow
      ? { y: 0, opacity: 1 }
      : { x: 0, opacity: 1 }
  const panelExit = reduceMotion
    ? { opacity: 0 }
    : isNarrow
      ? { y: '100%', opacity: 0 }
      : { x: '100%', opacity: 0 }
  const panelTransition = reduceMotion
    ? { duration: 0.2 }
    : { type: 'spring' as const, stiffness: 300, damping: 32 }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="jarvis-backdrop"
            aria-hidden
            className="fixed inset-0 z-[65] bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <motion.aside
            key="jarvis-panel"
            role="dialog"
            aria-label="Jarvis chat"
            aria-modal="true"
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={panelTransition}
            className="fixed z-[70] flex flex-col bg-black inset-y-0 right-0 w-full sm:w-[520px] sm:border-l sm:border-[var(--color-kindra-rule)]"
          >
            {/* ── Header ── */}
            <header className="flex-none px-8 pt-10 pb-8 sm:px-12">
              <div className="flex items-start justify-between">
                <div>
                  <h2
                    className="text-[32px] font-bold text-white tracking-[-0.03em] leading-none"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Jarvis
                  </h2>
                  <p
                    className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    <span className="relative inline-flex h-[5px] w-[5px]">
                      <span className="absolute inset-0 animate-ping rounded-full bg-[var(--color-kindra-green)] opacity-60" />
                      <span className="relative inline-flex h-[5px] w-[5px] rounded-full bg-[var(--color-kindra-green)]" />
                    </span>
                    knowledge graph · active
                  </p>
                </div>
                <button
                  type="button"
                  data-cursor="link"
                  onClick={() => setOpen(false)}
                  aria-label="Close Jarvis"
                  className="mt-1 text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)] transition-colors duration-500 hover:text-white"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  close
                </button>
              </div>
              <div
                aria-hidden
                className="mt-8 h-px w-full bg-[var(--color-kindra-rule)]"
              />
            </header>

            {/* ── Messages ── */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-8 pb-10 sm:px-12"
            >
              {messages.map((m, i) => (
                <MessageBubble
                  key={i}
                  message={m}
                  onSuggestedClick={submit}
                  disabled={loading}
                  isFirst={i === 0}
                />
              ))}

              {loading && <LoadingBubble />}

              {showSuggestions && (
                <div className="mt-12">
                  <p
                    className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)] mb-5"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    try asking
                  </p>
                  <div className="flex flex-col gap-3">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        data-cursor="link"
                        onClick={() => submit(s)}
                        disabled={loading}
                        className="group/sug flex items-center gap-3 text-left text-[13px] text-[var(--color-kindra-meta-mid)] transition-colors duration-300 hover:text-white disabled:opacity-40"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        <span className="text-[var(--color-kindra-rule-strong)] transition-colors duration-300 group-hover/sug:text-[var(--color-kindra-yellow)]">
                          →
                        </span>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Input ── */}
            <div className="flex-none px-8 pb-8 pt-6 sm:px-12 sm:pb-10">
              <div
                aria-hidden
                className="mb-6 h-px w-full bg-[var(--color-kindra-rule)]"
              />
              <form onSubmit={handleSubmit}>
                <div className="flex items-start gap-4">
                  <span
                    aria-hidden
                    className="mt-[3px] text-[14px] text-[var(--color-kindra-yellow)] select-none font-bold"
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
                    placeholder="ask anything..."
                    className="flex-1 resize-none bg-transparent text-[15px] leading-[26px] text-white outline-none placeholder:text-[var(--color-kindra-meta-low)] disabled:opacity-40"
                    style={{ fontFamily: 'var(--font-body)' }}
                  />
                  <button
                    type="submit"
                    data-cursor="link"
                    disabled={loading || !hasInput}
                    aria-label="Send"
                    className="mt-[3px] text-[14px] transition-colors duration-300 disabled:opacity-20"
                    style={{
                      color: hasInput && !loading ? 'var(--color-kindra-yellow)' : 'var(--color-kindra-meta-low)',
                    }}
                  >
                    ↵
                  </button>
                </div>
              </form>
              <p
                className="mt-5 text-[9px] uppercase tracking-[0.3em] text-[#333]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                esc to close · enter to send · shift+enter for new line
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
