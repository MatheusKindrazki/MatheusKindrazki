'use client'

import { useMemo } from 'react'

interface CosmicPortalProps {
  src: string
  alt?: string
  className?: string
  glowColor?: string
  size?: number
}

export default function CosmicPortal({
  src,
  alt = '',
  className = '',
  glowColor = 'rgba(83,162,190,0.3)',
  size = 420,
}: CosmicPortalProps) {
  // Generate orbiting particles
  const particles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => {
      const angle = (i / 40) * 360
      const radiusOffset = 48 + Math.random() * 8 // 48-56% from center
      const dotSize = 1 + Math.random() * 2
      const opacity = 0.2 + Math.random() * 0.5
      const delay = Math.random() * -20 // random start point in animation
      return { angle, radiusOffset, dotSize, opacity, delay, id: i }
    })
  }, [])

  // Secondary ring particles (outer, fainter)
  const outerParticles = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => {
      const angle = (i / 25) * 360
      const radiusOffset = 56 + Math.random() * 10
      const dotSize = 0.5 + Math.random() * 1.5
      const opacity = 0.1 + Math.random() * 0.3
      const delay = Math.random() * -30
      return { angle, radiusOffset, dotSize, opacity, delay, id: i }
    })
  }, [])

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Outer glow */}
      <div
        className="absolute inset-[-15%] rounded-full opacity-40 blur-3xl"
        style={{ background: `radial-gradient(circle, ${glowColor}, transparent 70%)` }}
      />

      {/* Orbiting ring - slow rotation */}
      <div
        className="absolute inset-0"
        style={{ animation: 'spin 60s linear infinite' }}
      >
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.dotSize,
              height: p.dotSize,
              backgroundColor: `rgba(200,220,255,${p.opacity})`,
              top: '50%',
              left: '50%',
              transform: `rotate(${p.angle}deg) translateX(${p.radiusOffset}%)`,
              transformOrigin: '0 0',
              animation: `pulse ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Counter-rotating outer ring */}
      <div
        className="absolute inset-0"
        style={{ animation: 'spin 90s linear infinite reverse' }}
      >
        {outerParticles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.dotSize,
              height: p.dotSize,
              backgroundColor: `rgba(180,200,255,${p.opacity})`,
              top: '50%',
              left: '50%',
              transform: `rotate(${p.angle}deg) translateX(${p.radiusOffset}%)`,
              transformOrigin: '0 0',
            }}
          />
        ))}
      </div>

      {/* Subtle ring border */}
      <div
        className="absolute inset-[2%] rounded-full"
        style={{
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: `0 0 40px 5px ${glowColor}, inset 0 0 40px 5px ${glowColor}`,
        }}
      />

      {/* Image with circular mask + heavy feathered edges */}
      <div
        className="absolute inset-[5%] rounded-full overflow-hidden"
        style={{
          maskImage: 'radial-gradient(circle, black 40%, rgba(0,0,0,0.6) 55%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle, black 40%, rgba(0,0,0,0.6) 55%, transparent 70%)',
        }}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover scale-110"
          draggable={false}
        />
      </div>

      {/* Scanline overlay for depth */}
      <div
        className="absolute inset-[5%] rounded-full pointer-events-none opacity-15"
        style={{
          maskImage: 'radial-gradient(circle, black 40%, transparent 65%)',
          WebkitMaskImage: 'radial-gradient(circle, black 40%, transparent 65%)',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)',
        }}
      />

      {/* CSS keyframes */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
