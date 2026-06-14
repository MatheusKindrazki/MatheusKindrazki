'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useJarvis } from './JarvisProvider'

interface JarvisTriggerProps {
  /**
   * `floating` (default) — the fixed bottom-right chrome badge rendered
   * globally by ClientShell. `inline` — the same status pill in document
   * flow, used by the home footer lane so the stamp and the badge share
   * one row instead of colliding in the viewport corner.
   */
  variant?: 'floating' | 'inline'
  /** Extra classes (the inline variant inherits footer typography here). */
  className?: string
}

function StatusDot({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <span className="relative inline-flex h-[5px] w-[5px]">
      {!reduceMotion && (
        <span className="absolute inset-0 animate-ping rounded-full bg-[var(--color-kindra-green)] opacity-60" />
      )}
      <span className="relative inline-flex h-[5px] w-[5px] rounded-full bg-[var(--color-kindra-green)]" />
    </span>
  )
}

export default function JarvisTrigger({
  variant = 'floating',
  className,
}: JarvisTriggerProps) {
  const { open, setOpen } = useJarvis()
  const reduceMotion = useReducedMotion()
  const pathname = usePathname()

  if (open) return null
  // The home footer renders this trigger inline next to the "last update"
  // stamp (same corner, one flex row) — the floating badge would sit on
  // top of that stamp at shell-hugging viewport widths, so it yields.
  if (variant === 'floating' && pathname === '/') return null

  if (variant === 'inline') {
    return (
      <motion.button
        type="button"
        data-cursor="link"
        onClick={() => setOpen(true)}
        aria-label="Open Jarvis chat"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        className={`inline-flex items-center gap-2 ${className ?? ''}`}
      >
        <StatusDot reduceMotion={reduceMotion} />
        <span>jarvis</span>
        <span className="text-[var(--color-kindra-rule-strong)]">·</span>
        <span>online</span>
      </motion.button>
    )
  }

  return (
    <motion.button
      type="button"
      data-cursor="link"
      onClick={() => setOpen(true)}
      aria-label="Open Jarvis chat"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 1.2 }}
      className="touch-target group/trigger fixed bottom-10 right-10 z-[60] flex flex-col items-end gap-1.5"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Label row */}
      <span className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)] transition-colors duration-500 group-hover/trigger:text-white">
        <StatusDot reduceMotion={reduceMotion} />
        <span>jarvis</span>
        <span className="text-[var(--color-kindra-rule-strong)]">·</span>
        <span className="text-[var(--color-kindra-meta-low)]">online</span>
      </span>

      {/* Underline that expands on hover */}
      <span
        aria-hidden
        className="h-px w-0 bg-[var(--color-kindra-yellow)] transition-all duration-500 group-hover/trigger:w-full"
      />
    </motion.button>
  )
}
