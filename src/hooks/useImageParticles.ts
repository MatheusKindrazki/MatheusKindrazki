'use client'

import { useState, useEffect } from 'react'

interface ParticleData {
  positions: Float32Array
  colors: Float32Array
  count: number
}

/**
 * Extracts particle data from an image.
 * @param edgeFade - fraction of image dimensions for edge fade (0.15 = 15% fade zone on each side)
 */
export default function useImageParticles(
  imageSrc: string,
  depthScale = 500,
  step = 2,
  maxWidth = 700,
  xOffset = 0,
  edgeFade = 0.15
): ParticleData | null {
  const [data, setData] = useState<ParticleData | null>(null)

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      // Scale image down to maxWidth to keep particle count reasonable
      const scale = Math.min(1, maxWidth / img.width)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.drawImage(img, 0, 0, w, h)
      const imageData = ctx.getImageData(0, 0, w, h)
      const pixels = imageData.data

      // Edge fade zones (in pixels)
      const fadeX = w * edgeFade
      const fadeY = h * edgeFade

      // Count non-transparent pixels first (accounting for fade-based skip)
      let count = 0
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const i = (x + y * w) * 4
          if (pixels[i + 3] > 0) {
            const fade = getEdgeFade(x, y, w, h, fadeX, fadeY)
            // Skip particles that would be fully transparent
            if (fade > 0.01) count++
          }
        }
      }

      const positions = new Float32Array(count * 3)
      const colors = new Float32Array(count * 3)
      let idx = 0

      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const i = (x + y * w) * 4
          if (pixels[i + 3] > 0) {
            const fade = getEdgeFade(x, y, w, h, fadeX, fadeY)
            if (fade <= 0.01) continue

            // Position: center the image + optional x offset
            positions[idx * 3] = x - w / 2 + xOffset
            positions[idx * 3 + 1] = -(y - h / 2)
            positions[idx * 3 + 2] = -Math.random() * depthScale

            // Color: normalize RGB to 0-1 and multiply by edge fade
            // On black background, darkening = visual transparency
            colors[idx * 3] = (pixels[i] / 255) * fade
            colors[idx * 3 + 1] = (pixels[i + 1] / 255) * fade
            colors[idx * 3 + 2] = (pixels[i + 2] / 255) * fade

            idx++
          }
        }
      }

      setData({ positions, colors, count })
    }

    img.src = imageSrc

    return () => {
      img.onload = null
    }
  }, [imageSrc, depthScale, step, maxWidth, xOffset, edgeFade])

  return data
}

/** Calculate edge fade factor (0 at edge, 1 at interior) with smooth easing */
function getEdgeFade(
  x: number, y: number,
  w: number, h: number,
  fadeX: number, fadeY: number
): number {
  let fx = 1
  let fy = 1

  // Horizontal fade
  if (x < fadeX) {
    fx = x / fadeX
  } else if (x > w - fadeX) {
    fx = (w - x) / fadeX
  }

  // Vertical fade
  if (y < fadeY) {
    fy = y / fadeY
  } else if (y > h - fadeY) {
    fy = (h - y) / fadeY
  }

  // Smooth easing (ease-in-out)
  fx = fx * fx * (3 - 2 * fx)
  fy = fy * fy * (3 - 2 * fy)

  return fx * fy
}
