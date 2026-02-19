'use client'

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function OrbitParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  const timeRef = useRef(0)

  const { positions, colors, count } = useMemo(() => {
    const orbitCount = 5
    const particlesPerOrbit = 60
    const count = orbitCount * particlesPerOrbit
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    const orbitColors = [
      [0.325, 0.616, 0.471],  // green
      [0.878, 0.643, 0.345],  // yellow
      [0.851, 0.349, 0.298],  // red
      [0.325, 0.635, 0.745],  // blue
      [0.4, 0.4, 0.4],        // gray
    ]

    for (let orbit = 0; orbit < orbitCount; orbit++) {
      const radiusX = 100 + orbit * 50
      const radiusY = 60 + orbit * 30
      const tilt = orbit * 0.3

      for (let p = 0; p < particlesPerOrbit; p++) {
        const idx = (orbit * particlesPerOrbit + p)
        const angle = (p / particlesPerOrbit) * Math.PI * 2

        positions[idx * 3] = Math.cos(angle) * radiusX
        positions[idx * 3 + 1] = Math.sin(angle) * radiusY * Math.cos(tilt)
        positions[idx * 3 + 2] = Math.sin(angle) * radiusY * Math.sin(tilt)

        const c = orbitColors[orbit]
        colors[idx * 3] = c[0]
        colors[idx * 3 + 1] = c[1]
        colors[idx * 3 + 2] = c[2]
      }
    }

    return { positions, colors, count }
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    timeRef.current += delta * 0.3

    const posArr = pointsRef.current.geometry.attributes.position.array as Float32Array
    const orbitCount = 5
    const particlesPerOrbit = 60

    for (let orbit = 0; orbit < orbitCount; orbit++) {
      const radiusX = 100 + orbit * 50
      const radiusY = 60 + orbit * 30
      const tilt = orbit * 0.3
      const speed = 1 - orbit * 0.15

      for (let p = 0; p < particlesPerOrbit; p++) {
        const idx = (orbit * particlesPerOrbit + p)
        const angle = (p / particlesPerOrbit) * Math.PI * 2 + timeRef.current * speed

        posArr[idx * 3] = Math.cos(angle) * radiusX
        posArr[idx * 3 + 1] = Math.sin(angle) * radiusY * Math.cos(tilt)
        posArr[idx * 3 + 2] = Math.sin(angle) * radiusY * Math.sin(tilt)
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
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        transparent
        opacity={0.6}
        size={3}
        sizeAttenuation={false}
        depthWrite={false}
      />
    </points>
  )
}

export default function ParticleOrbit({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        orthographic
        camera={{ position: [0, 0, 300], zoom: 1, near: 1, far: 1000 }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
        style={{ background: 'transparent' }}
      >
        <OrbitParticles />
      </Canvas>
    </div>
  )
}
