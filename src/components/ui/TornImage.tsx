'use client'

import { useRef, useEffect } from 'react'

interface TornImageProps {
  src: string
  alt?: string
  className?: string
}

export default function TornImage({ src, alt = '', className = '' }: TornImageProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Generate random torn edge mask on mount
    if (!containerRef.current) return

    const w = 100
    const steps = 30
    const jag = 4 // how jagged the edges are (%)

    // Build random jagged polygon points for mask
    const top: string[] = []
    const bottom: string[] = []
    const left: string[] = []
    const right: string[] = []

    // Top edge: left to right
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * w
      const y = i === 0 || i === steps ? 0 : Math.random() * jag
      top.push(`${x}% ${y}%`)
    }

    // Right edge: top to bottom
    for (let i = 1; i < steps; i++) {
      const y = (i / steps) * w
      const x = w - Math.random() * jag
      right.push(`${x}% ${y}%`)
    }

    // Bottom edge: right to left
    for (let i = steps; i >= 0; i--) {
      const x = (i / steps) * w
      const y = i === 0 || i === steps ? w : w - Math.random() * jag
      bottom.push(`${x}% ${y}%`)
    }

    // Left edge: bottom to top
    for (let i = steps - 1; i > 0; i--) {
      const y = (i / steps) * w
      const x = Math.random() * jag
      left.push(`${x}% ${y}%`)
    }

    const points = [...top, ...right, ...bottom, ...left].join(', ')
    containerRef.current.style.clipPath = `polygon(${points})`
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        maskImage: 'radial-gradient(ellipse 70% 70% at center, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at center, black 40%, transparent 100%)',
      }}
    >
      {/* Main image */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
        }}
      />

      {/* Noise grain overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
