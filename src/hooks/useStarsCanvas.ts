'use client'

import { useEffect, useRef, useCallback } from 'react'
import { starsColors } from '@/lib/colors'

interface Circle {
  x: number
  y: number
  dx: number
  dy: number
  radius: number
  minRadius: number
  color: string
}

export default function useStarsCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  particleCount = 800,
  mouseDistance = 50,
  maxRadius = 1.5,
  baseRadius = 0.5
) {
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const circlesRef = useRef<Circle[]>([])
  const animFrameRef = useRef<number>(0)

  const prepare = useCallback((width: number, height: number) => {
    const circles: Circle[] = []
    for (let i = 0; i < particleCount; i++) {
      const radius = baseRadius
      const x = Math.random() * (width - radius * 2) + radius
      const y = Math.random() * (height - radius * 2) + radius
      const dx = (Math.random() - 0.5) * 1.5
      const dy = (Math.random() - 1) * 1.5
      const color = starsColors[Math.floor(Math.random() * starsColors.length)]
      circles.push({ x, y, dx, dy, radius, minRadius: radius, color })
    }
    circlesRef.current = circles
  }, [particleCount, baseRadius])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const mouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    resize()
    prepare(canvas.width, canvas.height)

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const mouse = mouseRef.current
      const circles = circlesRef.current

      for (let i = 0; i < circles.length; i++) {
        const c = circles[i]

        // Bounce off edges
        if (c.x + c.radius > canvas.width || c.x - c.radius < 0) c.dx = -c.dx
        if (c.y + c.radius > canvas.height || c.y - c.radius < 0) c.dy = -c.dy

        c.x += c.dx
        c.y += c.dy

        // Mouse proximity interaction
        const distX = mouse.x - c.x
        const distY = mouse.y - c.y
        if (
          distX < mouseDistance && distX > -mouseDistance &&
          distY < mouseDistance && distY > -mouseDistance
        ) {
          if (c.radius < maxRadius) c.radius += 1
        } else if (c.radius > c.minRadius) {
          c.radius -= 1
        }

        // Draw
        ctx.beginPath()
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2, false)
        ctx.fillStyle = c.color
        ctx.fill()
      }
    }

    animate()

    window.addEventListener('mousemove', mouseMove)
    window.addEventListener('resize', () => {
      resize()
      prepare(canvas.width, canvas.height)
    })

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('mousemove', mouseMove)
      window.removeEventListener('resize', resize)
    }
  }, [canvasRef, prepare, mouseDistance, maxRadius])
}
