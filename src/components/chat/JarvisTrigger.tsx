'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useJarvis } from './JarvisProvider'

export default function JarvisTrigger() {
  const { open, setOpen } = useJarvis()
  const reduceMotion = useReducedMotion()

  if (open) return null

  return (
    <motion.button
      type="button"
      data-cursor="link"
      onClick={() => setOpen(true)}
      aria-label="Open Jarvis chat"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 1.2 }}
      className="group/trigger fixed bottom-10 right-10 z-[60] flex flex-col items-end gap-1.5"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Label row */}
      <span className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-[var(--color-kindra-meta-low)] transition-colors duration-500 group-hover/trigger:text-white">
        <span className="relative inline-flex h-[5px] w-[5px]">
          {!reduceMotion && (
            <span className="absolute inset-0 animate-ping rounded-full bg-[var(--color-kindra-green)] opacity-60" />
          )}
          <span className="relative inline-flex h-[5px] w-[5px] rounded-full bg-[var(--color-kindra-green)]" />
        </span>
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
