'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Grid() {
  const pointsRef = useRef<THREE.Points>(null)
  const timeRef = useRef(0)

  const { positions, count } = useMemo(() => {
    const spacing = 20
    const cols = 40
    const rows = 30
    const count = cols * rows
    const positions = new Float32Array(count * 3)

    let idx = 0
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        positions[idx * 3] = (col - cols / 2) * spacing
        positions[idx * 3 + 1] = (row - rows / 2) * spacing
        positions[idx * 3 + 2] = 0
        idx++
      }
    }

    return { positions, count }
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    timeRef.current += delta

    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array
    const spacing = 20
    const cols = 40
    const rows = 30

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = (row * cols + col) * 3
        const baseX = (col - cols / 2) * spacing
        const baseY = (row - rows / 2) * spacing

        posArr[idx] = baseX + Math.sin(timeRef.current + col * 0.3) * 3
        posArr[idx + 1] = baseY + Math.cos(timeRef.current + row * 0.3) * 3
        posArr[idx + 2] = Math.sin(timeRef.current * 0.5 + col * 0.2 + row * 0.2) * 10
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#419d78"
        transparent
        opacity={0.3}
        size={2}
        sizeAttenuation={false}
        depthWrite={false}
      />
    </points>
  )
}

export default function ParticleGrid({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        orthographic
        camera={{ position: [0, 0, 100], zoom: 1, near: 1, far: 1000 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <Grid />
      </Canvas>
    </div>
  )
}
