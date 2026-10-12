'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useJarvis } from './JarvisProvider'
import styles from './JarvisTrigger.module.css'

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

function StatusDot() {
  return <span className="relative inline-flex h-[5px] w-[5px] rounded-full bg-[var(--color-kindra-meta-low)]" />
}

export default function JarvisTrigger({
  variant = 'floating',
  className,
}: JarvisTriggerProps) {
  const { open, setOpen } = useJarvis()
  const reduceMotion = useReducedMotion()
  const pathname = usePathname()

  // Keep the invoker mounted so the dialog can restore keyboard focus.
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
        aria-label="Meet Jarvis, private assistant (offline for visitors)"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? 'jarvis-panel' : undefined}
        tabIndex={open ? -1 : undefined}
        initial={{ opacity: 0 }}
        animate={{ opacity: open ? 0 : 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.2 }}
        className={`inline-flex items-center gap-2 ${className ?? ''}`}
        style={{ pointerEvents: open ? 'none' : undefined }}
      >
        <StatusDot />
        <span>jarvis</span>
        <span className="text-[var(--color-kindra-rule-strong)]">·</span>
        <span>private</span>
      </motion.button>
    )
  }

  return (
    <motion.button
      type="button"
      data-cursor="link"
      onClick={() => setOpen(true)}
      aria-label="Meet Jarvis, private assistant (offline for visitors)"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? 'jarvis-panel' : undefined}
      tabIndex={open ? -1 : undefined}
      initial={{ opacity: 0 }}
      animate={{ opacity: open ? 0 : 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
      className={`${styles.floating} touch-target group/trigger fixed bottom-10 right-10 z-[60] flex flex-col items-end gap-1.5`}
      style={{ fontFamily: 'var(--font-body)', pointerEvents: open ? 'none' : undefined }}
    >
      {/* Label row */}
      <span className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)] transition-colors duration-500 group-hover/trigger:text-white">
        <StatusDot />
        <span>jarvis</span>
        <span className="text-[var(--color-kindra-rule-strong)]">·</span>
        <span className="text-[var(--color-kindra-meta-low)]">private</span>
      </span>

      {/* Underline that expands on hover */}
      <span
        aria-hidden
        className="h-px w-0 bg-[var(--color-kindra-yellow)] transition-all duration-500 group-hover/trigger:w-full"
      />
    </motion.button>
  )
}
