'use client'

import { useRef, useEffect, useState } from 'react'

interface BlackHoleProps {
  src: string
  alt?: string
  className?: string
  /** Horizontal offset in px for the black hole center (positive = right) */
  offsetX?: number
  /** Called once when the shockwave explosion completes */
  onFormationComplete?: () => void
}

// ── Timing (ms) ──────────────────────────────────────
const PHASE_STARS     = 2000   // Stars twinkling across viewport
const PHASE_CONVERGE  = 3000   // Stars pulled toward center
const PHASE_COLLAPSE  = 800    // Rapid collapse into singularity
const PHASE_SHOCKWAVE = 600    // Shockwave ring expanding outward
const PHASE_MEDIA     = 1200   // Video fades in from center
const TOTAL = PHASE_STARS + PHASE_CONVERGE + PHASE_COLLAPSE + PHASE_SHOCKWAVE + PHASE_MEDIA

// ── Color palette ────────────────────────────────────
const STAR_COLORS = [
  '#ffffff', '#e8e8ff', '#d0d0ff', '#b8c8ff',
  '#ffe8d0', '#ffd8a8', '#c8d8ff', '#a0b8ff',
]
const ACCRETION_WARM = ['#ffcc80', '#ffa040', '#ff8020', '#ff6000', '#e04000']
const ACCRETION_COOL = ['#53a2be', '#6bb8d4', '#80d0f0', '#40a0d0', '#2080b0']

// ── Particle ─────────────────────────────────────────
interface Star {
  // Initial scattered position (viewport-wide)
  ix: number; iy: number
  // Current position
  x: number; y: number
  vx: number; vy: number
  // Visual
  baseRadius: number
  radius: number
  color: string
  twinkleSpeed: number
  twinkleOffset: number
  opacity: number
  // Trail (for accretion phase)
  trail: { x: number; y: number }[]
  // Is this an accretion-disk particle?
  isAccretion: boolean
  // Angular velocity for orbit
  angularV: number
  consumed: boolean
}

function hex2rgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }
function clamp01(v: number) { return Math.max(0, Math.min(1, v)) }
function easeInCubic(t: number) { return t * t * t }
function easeOutQuart(t: number) { return 1 - Math.pow(1 - t, 4) }
function easeOutExpo(t: number) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t) }
function easeInOutQuad(t: number) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2 }

export default function BlackHole({ src, alt = '', className = '', offsetX = 0, onFormationComplete }: BlackHoleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const frameRef = useRef(0)
  const startRef = useRef(0)
  const shockwaveRef = useRef(0) // radius of shockwave ring
  const formationFiredRef = useRef(false)
  const [mediaReady, setMediaReady] = useState(false)
  const [mediaOpacity, setMediaOpacity] = useState(0)
  const [mediaScale, setMediaScale] = useState(0.3)

  const isVideo = src.endsWith('.mp4') || src.endsWith('.webm') || src.endsWith('.mov')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Full viewport sizing
    let W = window.innerWidth
    let H = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    function resize() {
      W = window.innerWidth
      H = window.innerHeight
      canvas!.width = W * dpr
      canvas!.height = H * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const cx = () => W / 2 + offsetX
    const cy = () => H / 2

    // ── Create initial star field ──
    const STAR_COUNT = 500
    const ACCRETION_COUNT = 200
    const stars: Star[] = []

    for (let i = 0; i < STAR_COUNT; i++) {
      const ix = Math.random() * W
      const iy = Math.random() * H
      stars.push({
        ix, iy, x: ix, y: iy,
        vx: 0, vy: 0,
        baseRadius: 0.5 + Math.random() * 2,
        radius: 0.5 + Math.random() * 2,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        twinkleSpeed: 1.5 + Math.random() * 3,
        twinkleOffset: Math.random() * Math.PI * 2,
        opacity: 0.3 + Math.random() * 0.7,
        trail: [],
        isAccretion: false,
        angularV: 0,
        consumed: false,
      })
    }

    // Accretion disk particles (spawned closer to center later)
    for (let i = 0; i < ACCRETION_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2
      const dist = 120 + Math.random() * 380
      const ix = cx() + Math.cos(angle) * dist * 1.5
      const iy = cy() + Math.sin(angle) * dist * 0.4 // Flattened ellipse
      const isWarm = Math.random() > 0.4
      const palette = isWarm ? ACCRETION_WARM : ACCRETION_COOL
      stars.push({
        ix, iy, x: ix, y: iy,
        vx: 0, vy: 0,
        baseRadius: 0.5 + Math.random() * 1.5,
        radius: 0.5 + Math.random() * 1.5,
        color: palette[Math.floor(Math.random() * palette.length)],
        twinkleSpeed: 2 + Math.random() * 4,
        twinkleOffset: Math.random() * Math.PI * 2,
        opacity: 0,
        trail: [],
        isAccretion: true,
        angularV: (0.3 + Math.random() * 0.8) * (Math.random() > 0.5 ? 1 : -1),
        consumed: false,
      })
    }

    starsRef.current = stars
    startRef.current = performance.now()

    // ── Animation loop ──
    function animate(now: number) {
      if (!ctx) return
      const elapsed = now - startRef.current
      const CX = cx()
      const CY = cy()

      ctx.clearRect(0, 0, W, H)

      // ── Determine phase ──
      const t1 = PHASE_STARS
      const t2 = t1 + PHASE_CONVERGE
      const t3 = t2 + PHASE_COLLAPSE
      const t4 = t3 + PHASE_SHOCKWAVE
      const t5 = t4 + PHASE_MEDIA

      let phase: 'stars' | 'converge' | 'collapse' | 'shockwave' | 'media' | 'done'
      let phaseProgress = 0

      if (elapsed < t1) {
        phase = 'stars'
        phaseProgress = elapsed / t1
      } else if (elapsed < t2) {
        phase = 'converge'
        phaseProgress = (elapsed - t1) / PHASE_CONVERGE
      } else if (elapsed < t3) {
        phase = 'collapse'
        phaseProgress = (elapsed - t2) / PHASE_COLLAPSE
      } else if (elapsed < t4) {
        phase = 'shockwave'
        phaseProgress = (elapsed - t3) / PHASE_SHOCKWAVE
      } else if (elapsed < t5) {
        phase = 'media'
        phaseProgress = (elapsed - t4) / PHASE_MEDIA
      } else {
        phase = 'done'
        phaseProgress = 1
      }

      // ── Global effects ──

      // Gravitational lensing glow (grows during converge/collapse)
      const glowIntensity = phase === 'stars' ? 0
        : phase === 'converge' ? easeInOutQuad(phaseProgress) * 0.6
        : 0.6 + (phase === 'collapse' ? phaseProgress * 0.4 : 0.4)

      if (glowIntensity > 0) {
        const glowR = 180 + glowIntensity * 300
        const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, glowR)
        grad.addColorStop(0, `rgba(83,162,190,${glowIntensity * 0.2})`)
        grad.addColorStop(0.3, `rgba(100,140,200,${glowIntensity * 0.1})`)
        grad.addColorStop(0.6, `rgba(224,164,88,${glowIntensity * 0.05})`)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(CX, CY, glowR, 0, Math.PI * 2)
        ctx.fill()
      }

      // ── Update & draw particles ──
      const dt = 0.016
      const maxDist = Math.sqrt(W * W + H * H) / 2

      for (const s of stars) {
        if (s.consumed) continue

        const dx = CX - s.x
        const dy = CY - s.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const ndx = dx / dist
        const ndy = dy / dist

        // ── PHASE: Stars (twinkling, gentle drift) ──
        if (phase === 'stars') {
          const twinkle = 0.5 + 0.5 * Math.sin(now * 0.001 * s.twinkleSpeed + s.twinkleOffset)
          s.radius = s.baseRadius * (0.6 + 0.4 * twinkle)

          if (s.isAccretion) {
            s.opacity = lerp(0, 0.4, easeInCubic(phaseProgress))
          } else {
            s.opacity = (0.3 + 0.7 * twinkle) * lerp(0, 1, clamp01(phaseProgress * 3))
          }
        }

        // ── PHASE: Converge (gravitational pull) ──
        if (phase === 'converge' || phase === 'collapse') {
          const pullStrength = phase === 'converge'
            ? easeInCubic(phaseProgress) * 1200
            : 3000 + phaseProgress * 8000

          // Gravitational force: F = G / r²
          const force = pullStrength / (dist * dist + 100)

          // Tangential velocity for orbital motion
          const tangentX = -ndy
          const tangentY = ndx
          const orbitalForce = s.isAccretion
            ? s.angularV * 60 / (dist + 30)
            : s.angularV * 20 / (dist + 50)

          s.vx += (ndx * force + tangentX * orbitalForce) * dt
          s.vy += (ndy * force + tangentY * orbitalForce) * dt

          // Drag
          const drag = phase === 'collapse' ? 0.99 : 0.995
          s.vx *= drag
          s.vy *= drag

          s.x += s.vx
          s.y += s.vy

          // Trail
          s.trail.push({ x: s.x, y: s.y })
          if (s.trail.length > 20) s.trail.shift()

          // Twinkle
          const twinkle = 0.5 + 0.5 * Math.sin(now * 0.001 * s.twinkleSpeed + s.twinkleOffset)
          s.radius = s.baseRadius * (0.6 + 0.4 * twinkle)

          // Accretion particles get brighter as they orbit
          if (s.isAccretion) {
            s.opacity = clamp01(0.4 + phaseProgress * 0.6) * twinkle
          } else {
            s.opacity = clamp01(1 - dist / maxDist + 0.3) * twinkle
          }

          // Give non-accretion stars initial angular velocity
          if (phase === 'converge' && phaseProgress < 0.1 && s.angularV === 0 && !s.isAccretion) {
            s.angularV = (Math.random() - 0.5) * 0.6
          }

          // Consume particles that reach the center
          const eventHorizonR = phase === 'collapse' ? 30 + phaseProgress * 60 : 12
          if (dist < eventHorizonR) {
            s.consumed = true
            continue
          }
        }

        // ── PHASE: Shockwave (particles frozen, fading) ──
        if (phase === 'shockwave' || phase === 'media' || phase === 'done') {
          s.opacity = Math.max(0, s.opacity - 0.02)
          if (s.opacity <= 0) { s.consumed = true; continue }
        }

        // ── Draw trail ──
        if (s.trail.length > 3 && (phase === 'converge' || phase === 'collapse')) {
          const [r, g, b] = hex2rgb(s.color)
          ctx.beginPath()
          ctx.moveTo(s.trail[0].x, s.trail[0].y)
          for (let t = 1; t < s.trail.length; t++) {
            ctx.lineTo(s.trail[t].x, s.trail[t].y)
          }
          const trailAlpha = s.opacity * (s.isAccretion ? 0.4 : 0.15)
          ctx.strokeStyle = `rgba(${r},${g},${b},${trailAlpha})`
          ctx.lineWidth = s.radius * 0.5
          ctx.stroke()
        }

        // ── Draw star ──
        const [r, g, b] = hex2rgb(s.color)
        if (s.radius > 1.5) {
          // Glow for larger stars
          const glowGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius * 3)
          glowGrad.addColorStop(0, `rgba(${r},${g},${b},${s.opacity})`)
          glowGrad.addColorStop(0.4, `rgba(${r},${g},${b},${s.opacity * 0.3})`)
          glowGrad.addColorStop(1, `rgba(${r},${g},${b},0)`)
          ctx.fillStyle = glowGrad
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.radius * 3, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${s.opacity})`
        ctx.fill()
      }

      // ── Accretion disk glow (during converge/collapse) ──
      if (phase === 'converge' || phase === 'collapse') {
        const diskAlpha = phase === 'converge'
          ? easeInCubic(phaseProgress) * 0.15
          : 0.15 + phaseProgress * 0.1

        ctx.save()
        ctx.translate(CX, CY)
        ctx.scale(1, 0.35) // Flatten to ellipse

        const diskR = phase === 'collapse' ? 380 - phaseProgress * 150 : 450 - phaseProgress * 70
        const diskGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, diskR)
        diskGrad.addColorStop(0, `rgba(255,160,64,${diskAlpha * 1.5})`)
        diskGrad.addColorStop(0.3, `rgba(255,120,40,${diskAlpha})`)
        diskGrad.addColorStop(0.6, `rgba(83,162,190,${diskAlpha * 0.6})`)
        diskGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = diskGrad
        ctx.beginPath()
        ctx.arc(0, 0, diskR, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      }

      // ── Event horizon (black circle) ──
      if (phase === 'collapse' || phase === 'shockwave' || phase === 'media' || phase === 'done') {
        const horizonR = phase === 'collapse'
          ? 5 + easeOutQuart(phaseProgress) * 165
          : 170

        // Photon sphere ring
        const ringAlpha = phase === 'collapse' ? phaseProgress * 0.6 : 0.6
        ctx.beginPath()
        ctx.arc(CX, CY, horizonR * 1.2, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(180,210,255,${ringAlpha * 0.4})`
        ctx.lineWidth = 2
        ctx.stroke()

        // Edge glow
        const edgeGrad = ctx.createRadialGradient(CX, CY, horizonR * 0.8, CX, CY, horizonR * 1.8)
        edgeGrad.addColorStop(0, 'transparent')
        edgeGrad.addColorStop(0.4, `rgba(83,162,190,${ringAlpha * 0.25})`)
        edgeGrad.addColorStop(0.6, `rgba(255,160,80,${ringAlpha * 0.15})`)
        edgeGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = edgeGrad
        ctx.beginPath()
        ctx.arc(CX, CY, horizonR * 1.8, 0, Math.PI * 2)
        ctx.fill()

        // Black center
        ctx.beginPath()
        ctx.arc(CX, CY, horizonR, 0, Math.PI * 2)
        ctx.fillStyle = '#000'
        ctx.fill()
      }

      // ── Shockwave ring ──
      if (phase === 'shockwave') {
        const swR = easeOutExpo(phaseProgress) * maxDist * 0.8
        shockwaveRef.current = swR
        const swAlpha = 1 - phaseProgress

        // Bright expanding ring
        ctx.beginPath()
        ctx.arc(CX, CY, swR, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(180,220,255,${swAlpha * 0.8})`
        ctx.lineWidth = 3 + (1 - phaseProgress) * 8
        ctx.stroke()

        // Inner softer ring
        ctx.beginPath()
        ctx.arc(CX, CY, swR * 0.9, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(83,162,190,${swAlpha * 0.4})`
        ctx.lineWidth = 2
        ctx.stroke()

        // Flash at the start
        if (phaseProgress < 0.15) {
          const flashAlpha = (1 - phaseProgress / 0.15) * 0.4
          const flashGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, 200)
          flashGrad.addColorStop(0, `rgba(255,255,255,${flashAlpha})`)
          flashGrad.addColorStop(0.5, `rgba(180,220,255,${flashAlpha * 0.3})`)
          flashGrad.addColorStop(1, 'transparent')
          ctx.fillStyle = flashGrad
          ctx.beginPath()
          ctx.arc(CX, CY, 200, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // ── Media fade in ──
      if (phase === 'media' || phase === 'done') {
        // Fire formation complete callback once
        if (!formationFiredRef.current) {
          formationFiredRef.current = true
          onFormationComplete?.()
        }

        const mAlpha = phase === 'media' ? easeOutQuart(phaseProgress) : 1
        const mScale = phase === 'media' ? lerp(0.3, 1, easeOutExpo(phaseProgress)) : 1
        setMediaReady(true)
        setMediaOpacity(mAlpha)
        setMediaScale(mScale)

        // Persistent gentle glow around the video
        const persistGrad = ctx.createRadialGradient(CX, CY, 130, CX, CY, 360)
        persistGrad.addColorStop(0, `rgba(83,162,190,${0.08 * mAlpha})`)
        persistGrad.addColorStop(0.5, `rgba(83,162,190,${0.04 * mAlpha})`)
        persistGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = persistGrad
        ctx.beginPath()
        ctx.arc(CX, CY, 360, 0, Math.PI * 2)
        ctx.fill()

        // Photon ring persists
        ctx.beginPath()
        ctx.arc(CX, CY, 185, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(180,210,255,${0.2 * mAlpha})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      // ── Ambient particles after done (subtle orbiting dust) ──
      if (phase === 'done') {
        const t = now * 0.0003
        for (let i = 0; i < 30; i++) {
          const angle = t + (i / 30) * Math.PI * 2
          const dist = 195 + Math.sin(angle * 3 + i) * 25
          const px = CX + Math.cos(angle) * dist
          const py = CY + Math.sin(angle) * dist * 0.35
          const alpha = 0.15 + 0.1 * Math.sin(now * 0.002 + i)
          ctx.beginPath()
          ctx.arc(px, py, 0.8, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(180,210,255,${alpha})`
          ctx.fill()
        }
      }

      frameRef.current = requestAnimationFrame(animate)
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [offsetX])

  const mediaSize = 320

  return (
    <div className={`fixed inset-0 pointer-events-none ${className}`}>
      {/* Full viewport canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Media emerging from black hole center */}
      {mediaReady && (
        <div
          className="absolute rounded-full overflow-hidden"
          style={{
            width: mediaSize,
            height: mediaSize,
            top: '50%',
            left: `calc(50% + ${offsetX}px)`,
            transform: `translate(-50%, -50%) scale(${mediaScale})`,
            opacity: mediaOpacity,
            maskImage: 'radial-gradient(circle, black 45%, rgba(0,0,0,0.5) 65%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(circle, black 45%, rgba(0,0,0,0.5) 65%, transparent 80%)',
          }}
        >
          {isVideo ? (
            <video
              src={src}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-cover"
              draggable={false}
            />
          )}
        </div>
      )}
    </div>
  )
}
