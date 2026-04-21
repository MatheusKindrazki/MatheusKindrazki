'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { type ThemeColor, getColorValue } from '@/lib/colors'

type CursorState = 'default' | 'link' | 'drag'

/**
 * Map pathname segments to a theme color that drives the custom cursor tint.
 * Falls back to yellow for unknown routes.
 */
function routeToColor(pathname: string | null): ThemeColor | '#ffffff' {
  if (!pathname) return 'yellow'
  if (pathname === '/') return 'yellow'
  if (pathname.startsWith('/projetos')) return 'green'
  if (pathname.startsWith('/skills')) return 'blue'
  if (pathname.startsWith('/sobre')) return 'yellow'
  if (pathname.startsWith('/contato')) return 'red'
  // /now (and any other unknown future route) gets pure white for liveliness.
  if (pathname.startsWith('/now')) return '#ffffff'
  return 'yellow'
}

function resolveAccent(value: ThemeColor | '#ffffff'): string {
  if (value === '#ffffff') return '#ffffff'
  return getColorValue(value)
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Custom cursor: a tracked dot + an eased outer ring.
 * - Tracks route color via next/navigation
 * - Expands on links/buttons, contracts on drag
 * - Hidden on touch devices & under 768px
 * - Honors prefers-reduced-motion
 */
export default function CustomCursor() {
  const pathname = usePathname()
  const dotRef = useRef<HTMLDivElement | null>(null)
  const ringRef = useRef<HTMLDivElement | null>(null)

  const mouseX = useRef(0)
  const mouseY = useRef(0)
  const ringX = useRef(0)
  const ringY = useRef(0)
  const rafRef = useRef<number | null>(null)
  const hasMoved = useRef(false)

  const [enabled, setEnabled] = useState(false)
  const [visible, setVisible] = useState(false)
  const [state, setState] = useState<CursorState>('default')

  const accent = resolveAccent(routeToColor(pathname))

  // Decide if the cursor should mount at all.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouch =
      'ontouchstart' in window || window.matchMedia('(hover: none)').matches
    const tooSmall = window.innerWidth < 768

    if (reduceMotion || isTouch || tooSmall) {
      setEnabled(false)
      return
    }

    setEnabled(true)
    document.body.classList.add('custom-cursor-active')

    const handleResize = () => {
      const smallNow = window.innerWidth < 768
      if (smallNow) {
        setEnabled(false)
        document.body.classList.remove('custom-cursor-active')
      }
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      document.body.classList.remove('custom-cursor-active')
    }
  }, [])

  // Main pointer loop — refs + rAF, no re-renders per mousemove.
  useEffect(() => {
    if (!enabled) return

    const handleMove = (e: MouseEvent) => {
      mouseX.current = e.clientX
      mouseY.current = e.clientY
      if (!hasMoved.current) {
        hasMoved.current = true
        ringX.current = e.clientX
        ringY.current = e.clientY
        setVisible(true)
      }
    }

    const handleLeave = () => {
      setVisible(false)
    }
    const handleEnter = () => {
      if (hasMoved.current) setVisible(true)
    }

    const handleDown = () => setState('drag')
    const handleUp = () => {
      // After mouseup, re-evaluate whether we're still over a link.
      const el = document.elementFromPoint(mouseX.current, mouseY.current)
      if (el && isInteractive(el)) {
        setState('link')
      } else {
        setState('default')
      }
    }

    const handleOver = (e: MouseEvent) => {
      const target = e.target as Element | null
      if (!target) return
      if (isInteractive(target)) {
        setState((prev) => (prev === 'drag' ? prev : 'link'))
      } else {
        setState((prev) => (prev === 'drag' ? prev : 'default'))
      }
    }

    const tick = () => {
      const lerp = 0.15
      ringX.current += (mouseX.current - ringX.current) * lerp
      ringY.current += (mouseY.current - ringY.current) * lerp

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX.current}px, ${mouseY.current}px, 0) translate(-50%, -50%)`
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX.current}px, ${ringY.current}px, 0) translate(-50%, -50%)`
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    window.addEventListener('mousemove', handleMove, { passive: true })
    window.addEventListener('mousedown', handleDown)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('mouseover', handleOver)
    document.addEventListener('mouseleave', handleLeave)
    document.addEventListener('mouseenter', handleEnter)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mousedown', handleDown)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('mouseover', handleOver)
      document.removeEventListener('mouseleave', handleLeave)
      document.removeEventListener('mouseenter', handleEnter)
    }
  }, [enabled])

  if (!enabled) return null

  // Size + stroke per state.
  let ringSize = 28
  let dotSize = 4
  let ringOpacity = 0.4
  let ringBorderWidth = 1
  if (state === 'link') {
    ringSize = 44
    dotSize = 2
    ringOpacity = 0.7
  } else if (state === 'drag') {
    ringSize = 18
    dotSize = 4
    ringOpacity = 1
    ringBorderWidth = 1.5
  }

  const ringBorderColor =
    state === 'drag' ? accent : hexToRgba(accent, ringOpacity)

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${ringSize}px`,
          height: `${ringSize}px`,
          borderRadius: '50%',
          border: `${ringBorderWidth}px solid ${ringBorderColor}`,
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: visible ? 1 : 0,
          transition:
            'width 300ms ease, height 300ms ease, border-color 300ms ease, border-width 300ms ease, opacity 300ms ease',
          willChange: 'transform',
          mixBlendMode: 'normal',
        }}
      />
      <div
        ref={dotRef}
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${dotSize}px`,
          height: `${dotSize}px`,
          borderRadius: '50%',
          backgroundColor: accent,
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: visible ? 1 : 0,
          willChange: 'transform',
        }}
      />
    </>
  )
}

/**
 * Decide whether a given element (or one of its ancestors) should expand the cursor ring.
 */
function isInteractive(el: Element): boolean {
  const target = el.closest(
    'a, button, [role="button"], [data-cursor="link"], input, textarea, select, label',
  )
  return target !== null
}
