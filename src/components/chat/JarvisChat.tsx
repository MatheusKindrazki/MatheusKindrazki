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
import Link from 'next/link'
import { useJarvis } from './JarvisProvider'
import { useJarvisChat, type ChatMessage } from '@/hooks/useJarvisChat'
import { PUBLIC_SUGGESTIONS } from '@/lib/jarvis-public/prompt'
import { splitLinks } from '@/lib/jarvis-public/links'
import { LINK_EMAILS, LINK_TARGETS } from '@/lib/jarvis-public/site-links'
import styles from './JarvisChat.module.css'

// Only URLs the site itself publishes (and any page on the site) become
// clickable in replies; see links.ts.
const OWN_HOST = LINK_TARGETS.siteHost.replace(/^www\./, '')

function isOwnHost(href: string): boolean {
  try {
    return new URL(href).hostname.toLowerCase().replace(/^www\./, '') === OWN_HOST
  } catch {
    return false
  }
}

function LinkedText({ text }: { text: string }) {
  return (
    <>
      {splitLinks(text, LINK_TARGETS, LINK_EMAILS).map((segment, i) => {
        if (segment.type === 'text') return <span key={i}>{segment.value}</span>
        const external = segment.href.startsWith('https://') && !isOwnHost(segment.href)
        return (
          <a
            key={i}
            href={segment.href}
            data-cursor="link"
            className="underline underline-offset-4"
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {segment.value}
          </a>
        )
      })}
    </>
  )
}

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
  isFirst?: boolean
}

function MessageBubble({ message, isFirst }: MessageProps) {
  if (message.role === 'user') {
    return (
      <div className={isFirst ? '' : styles.blockGap}>
        <div className={`flex items-baseline gap-3 ${styles.labelGapSm}`}>
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

  return (
    <div className={isFirst ? '' : styles.blockGap}>
      <div className={`flex items-baseline gap-3 ${styles.labelGap}`}>
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
        <LinkedText text={message.content} />
      </p>
    </div>
  )
}

function LoadingBubble() {
  return (
    <div className={styles.blockGap}>
      <div className={`flex items-baseline gap-3 ${styles.labelGap}`}>
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
  // `available` comes from GET /api/ask: the public edition (published notes
  // only, no connection to the private Jarvis) is switched on server-side.
  // While it is off, the panel stays an explainer with contact/case links.
  const { open, setOpen, available } = useJarvis()
  const { messages, loading, send } = useJarvisChat(available)
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
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
    const previousFocus = document.activeElement as HTMLElement | null
    const frame = window.requestAnimationFrame(() =>
      available ? textareaRef.current?.focus() : closeRef.current?.focus(),
    )
    return () => {
      window.cancelAnimationFrame(frame)
      previousFocus?.focus()
    }
  }, [open, available])

  useEffect(() => {
    if (!open) return
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      if (e.key !== 'Tab') return
      const targets = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), [tabindex="0"]',
      ) ?? []).filter((el) => el.getClientRects().length > 0)
      const first = targets[0]
      const last = targets[targets.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, setOpen])

  const submit = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!available || !trimmed || loading) return
      setInput('')
      void send(trimmed)
    },
    [send, loading, available],
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
      available &&
      PUBLIC_SUGGESTIONS.length > 0 &&
      messages.length === 1 &&
      messages[0].role === 'assistant' &&
      messages[0].local === true
    )
  }, [messages, available])

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
            ref={panelRef}
            id="jarvis-panel"
            aria-label={available ? 'Ask Jarvis, public edition' : 'About Jarvis, private assistant'}
            aria-modal="true"
            initial={panelInitial}
            animate={panelAnimate}
            exit={panelExit}
            transition={panelTransition}
            className="fixed z-[70] flex flex-col bg-black inset-y-0 right-0 w-full sm:w-[520px] sm:border-l sm:border-[var(--color-kindra-rule)]"
          >
            {/* ── Header ── */}
            <header className={`flex-none ${styles.padX} ${styles.headerPad}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h2
                    className="text-[32px] font-bold text-white tracking-[-0.03em] leading-none"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Jarvis
                  </h2>
                  <p
                    className={`${styles.statusRow} flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)]`}
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    <span
                      className="relative inline-flex h-[5px] w-[5px] rounded-full"
                      style={{
                        background: available
                          ? 'var(--color-kindra-yellow)'
                          : 'var(--color-kindra-meta-low)',
                      }}
                    />
                    {available ? 'public edition · published notes' : 'private assistant · offline'}
                  </p>
                </div>
                <button
                  type="button"
                  data-cursor="link"
                  ref={closeRef}
                  onClick={() => setOpen(false)}
                  aria-label="Close Jarvis"
                  className={`${styles.closeNudge} text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)] transition-colors duration-500 hover:text-white`}
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  close
                </button>
              </div>
              <div
                aria-hidden
                className={`${styles.headerRule} h-px w-full bg-[var(--color-kindra-rule)]`}
              />
            </header>

            {/* ── Messages ── */}
            <div
              ref={scrollRef}
              className={`flex-1 overflow-y-auto ${styles.padX} ${styles.messagesPad}`}
            >
              {messages.map((m, i) => (
                <MessageBubble
                  key={i}
                  message={m}
                  isFirst={i === 0}
                />
              ))}

              {loading && <LoadingBubble />}

              {showSuggestions && (
                <div className={styles.suggestionsBlock}>
                  <p
                    className={`${styles.suggestionsCaption} text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)]`}
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    try asking
                  </p>
                  <div className="flex flex-col gap-3">
                    {PUBLIC_SUGGESTIONS.map((s) => (
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
            <div className={`flex-none ${styles.padX} ${styles.inputPad}`}>
              <div
                aria-hidden
                className={`${styles.inputDivider} h-px w-full bg-[var(--color-kindra-rule)]`}
              />
              {available ? (
              <form onSubmit={handleSubmit}>
                <div className="flex items-start gap-4">
                  <span
                    aria-hidden
                    className={`${styles.inputNudge} text-[14px] text-[var(--color-kindra-yellow)] select-none font-bold`}
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
                    readOnly={loading}
                    maxLength={800}
                    placeholder="ask about Matheus's work..."
                    className={`flex-1 resize-none bg-transparent text-[15px] leading-[26px] text-white outline-none placeholder:text-[var(--color-kindra-meta-low)] ${loading ? 'opacity-40' : ''}`}
                    style={{ fontFamily: 'var(--font-body)' }}
                  />
                  <button
                    type="submit"
                    data-cursor="link"
                    disabled={loading || !hasInput}
                    aria-label="Send"
                    className={`${styles.inputNudge} text-[14px] transition-colors duration-300 disabled:opacity-20`}
                    style={{
                      color: hasInput && !loading ? 'var(--color-kindra-yellow)' : 'var(--color-kindra-meta-low)',
                    }}
                  >
                    ↵
                  </button>
                </div>
              </form>
              ) : (
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm leading-6 text-[var(--color-kindra-text-white)]">
                  <Link href="/contato/" onClick={() => setOpen(false)}
                    className="underline underline-offset-4">Talk to Matheus ↗</Link>
                  <Link href="/projetos/?project=jarvis" onClick={() => setOpen(false)}
                    className="underline underline-offset-4">Read the case notes →</Link>
                </div>
              )}
              <p
                className={`${styles.helperGap} text-[9px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-mid)]`}
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {available
                  ? 'public edition · published notes only · enter to send · esc to close'
                  : 'private system · no public chat · esc to close'}
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
