'use client'

import { useRef } from 'react'
import useStarsCanvas from '@/hooks/useStarsCanvas'
import useIsMobile from '@/hooks/useIsMobile'

export default function StarsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isMobile = useIsMobile()

  useStarsCanvas(canvasRef, isMobile ? 400 : 800)

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ display: 'block' }}
    />
  )
}
