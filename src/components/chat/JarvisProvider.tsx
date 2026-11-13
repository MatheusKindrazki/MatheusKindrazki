'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

interface JarvisContextValue {
  open: boolean
  setOpen: (value: boolean) => void
  toggle: () => void
  /** Whether the public edition is switched on (GET /api/ask). */
  available: boolean
}

const JarvisContext = createContext<JarvisContextValue | null>(null)

export function JarvisProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [available, setAvailable] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/ask')
      .then((res) => res.json() as Promise<{ available?: unknown }>)
      .then((data) => {
        if (!cancelled) setAvailable(data.available === true)
      })
      .catch(() => {
        // Any failure keeps the chat in its offline state.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const toggle = useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  const value = useMemo<JarvisContextValue>(
    () => ({ open, setOpen, toggle, available }),
    [open, toggle, available],
  )

  return (
    <JarvisContext.Provider value={value}>{children}</JarvisContext.Provider>
  )
}

export function useJarvis(): JarvisContextValue {
  const ctx = useContext(JarvisContext)
  if (!ctx) {
    throw new Error('useJarvis must be used inside <JarvisProvider>')
  }
  return ctx
}
