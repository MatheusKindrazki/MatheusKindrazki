'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

interface JarvisContextValue {
  open: boolean
  setOpen: (value: boolean) => void
  toggle: () => void
}

const JarvisContext = createContext<JarvisContextValue | null>(null)

export function JarvisProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const toggle = useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  const value = useMemo<JarvisContextValue>(
    () => ({ open, setOpen, toggle }),
    [open, toggle],
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
