'use client'

import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useImageParticles from '@/hooks/useImageParticles'

/** Create a circular particle sprite texture */
function createCircleTexture(): THREE.Texture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  const gradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  )
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.8)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

const VERTEX_SHADER = `
  attribute vec3 scatteredPos;
  attribute vec3 particleColor;
  uniform float uProgress;
  uniform float uPointSize;
  varying vec3 vColor;

  float easeInOutCubic(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    float t = easeInOutCubic(uProgress);
    vec3 pos = mix(scatteredPos, position, t);
    vColor = particleColor;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uPointSize;
  }
`

const FRAGMENT_SHADER = `
  uniform sampler2D uMap;
  varying vec3 vColor;

  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    if (tex.a < 0.01) discard;
    gl_FragColor = vec4(vColor * tex.rgb, tex.a);
  }
`

interface ParticlesProps {
  imageSrc: string
  maxWidth: number
  xOffset: number
  particleSize: number
  edgeFade: number
  animate: boolean
  explode: boolean
  onExplodeComplete?: () => void
}

function AnimatedParticles({
  imageSrc, maxWidth, xOffset, particleSize, edgeFade,
  animate, explode, onExplodeComplete
}: ParticlesProps) {
  const data = useImageParticles(imageSrc, 500, 2, maxWidth, xOffset, edgeFade)
  const pointsRef = useRef<THREE.Points>(null)
  const { camera } = useThree()
  const mouseState = useRef({ isDown: false, lastX: 0, lastY: 0 })
  const progressRef = useRef(animate ? 0 : 1)
  const explodingRef = useRef(false)
  const onCompleteRef = useRef(onExplodeComplete)
  onCompleteRef.current = onExplodeComplete

  const circleMap = useMemo(() => createCircleTexture(), [])

  // Generate scattered positions (particles from all directions)
  const scatteredPositions = useMemo(() => {
    if (!data) return null
    const scattered = new Float32Array(data.count * 3)
    for (let i = 0; i < data.count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const dist = 400 + Math.random() * 800
      scattered[i * 3] = data.positions[i * 3] + Math.sin(phi) * Math.cos(theta) * dist
      scattered[i * 3 + 1] = data.positions[i * 3 + 1] + Math.sin(phi) * Math.sin(theta) * dist
      scattered[i * 3 + 2] = data.positions[i * 3 + 2] - Math.random() * 400
    }
    return scattered
  }, [data])

  // ShaderMaterial
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: animate ? 0 : 1 },
        uPointSize: { value: particleSize },
        uMap: { value: circleMap },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
    })
  }, [animate, particleSize, circleMap])

  // Handle explode trigger
  useEffect(() => {
    if (explode) {
      explodingRef.current = true
    }
  }, [explode])

  // Mouse handlers
  useMemo(() => {
    if (typeof window === 'undefined') return

    const onMouseDown = (e: MouseEvent) => {
      mouseState.current = { isDown: true, lastX: e.clientX, lastY: e.clientY }
    }
    const onMouseUp = () => {
      mouseState.current.isDown = false
    }
    const onMouseMove = (e: MouseEvent) => {
      if (mouseState.current.isDown) {
        camera.position.x += (e.clientX - mouseState.current.lastX) / 100
        camera.position.y -= (e.clientY - mouseState.current.lastY) / 100
        camera.lookAt(0, 0, 0)
        mouseState.current.lastX = e.clientX
        mouseState.current.lastY = e.clientY
      }
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)

    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [camera])

  // Animation loop
  useFrame((_, delta) => {
    // Update progress
    if (explodingRef.current) {
      progressRef.current = Math.max(0, progressRef.current - delta * 0.7)
      if (progressRef.current <= 0.01) {
        explodingRef.current = false
        onCompleteRef.current?.()
      }
    } else if (animate && progressRef.current < 1) {
      progressRef.current = Math.min(1, progressRef.current + delta * 0.4)
    }

    // Update shader uniform
    shaderMaterial.uniforms.uProgress.value = progressRef.current

    // Camera easing back to origin
    if (!mouseState.current.isDown) {
      camera.position.x += (0 - camera.position.x) * 0.06
      camera.position.y += (0 - camera.position.y) * 0.06
      camera.lookAt(0, 0, 0)
    }
  })

  if (!data || !scatteredPositions) return null

  return (
    <points ref={pointsRef} material={shaderMaterial}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-scatteredPos" args={[scatteredPositions, 3]} />
        <bufferAttribute attach="attributes-particleColor" args={[data.colors, 3]} />
      </bufferGeometry>
    </points>
  )
}

/** Static particles (no assemble/explode animation) - used by sub-pages */
function StaticParticles({
  imageSrc, maxWidth, xOffset, particleSize, edgeFade
}: Omit<ParticlesProps, 'animate' | 'explode' | 'onExplodeComplete'>) {
  const data = useImageParticles(imageSrc, 500, 2, maxWidth, xOffset, edgeFade)
  const pointsRef = useRef<THREE.Points>(null)
  const { camera } = useThree()
  const mouseState = useRef({ isDown: false, lastX: 0, lastY: 0 })
  const circleMap = useMemo(() => createCircleTexture(), [])

  useMemo(() => {
    if (typeof window === 'undefined') return
    const onMouseDown = (e: MouseEvent) => {
      mouseState.current = { isDown: true, lastX: e.clientX, lastY: e.clientY }
    }
    const onMouseUp = () => { mouseState.current.isDown = false }
    const onMouseMove = (e: MouseEvent) => {
      if (mouseState.current.isDown) {
        camera.position.x += (e.clientX - mouseState.current.lastX) / 100
        camera.position.y -= (e.clientY - mouseState.current.lastY) / 100
        camera.lookAt(0, 0, 0)
        mouseState.current.lastX = e.clientX
        mouseState.current.lastY = e.clientY
      }
    }
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [camera])

  useFrame(() => {
    if (!mouseState.current.isDown) {
      camera.position.x += (0 - camera.position.x) * 0.06
      camera.position.y += (0 - camera.position.y) * 0.06
      camera.lookAt(0, 0, 0)
    }
  })

  if (!data) return null

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[data.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors transparent sizeAttenuation={false}
        size={particleSize} depthWrite={false}
        map={circleMap} alphaTest={0.01}
      />
    </points>
  )
}

interface ParticlePhotoProps {
  imageSrc?: string
  maxWidth?: number
  xOffset?: number
  particleSize?: number
  edgeFade?: number
  animate?: boolean
  explode?: boolean
  onExplodeComplete?: () => void
}

export default function ParticlePhoto({
  imageSrc = '/images/kindra-photo.png',
  maxWidth = 700,
  xOffset = 250,
  particleSize = 1.8,
  edgeFade = 0.15,
  animate = false,
  explode = false,
  onExplodeComplete,
}: ParticlePhotoProps) {
  return (
    <Canvas
      orthographic
      camera={{
        position: [0, -20, 4],
        zoom: 1,
        near: 1,
        far: 1000,
      }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%', background: 'transparent' }}
      onCreated={({ camera }) => {
        camera.lookAt(0, 0, 0)
      }}
    >
      {animate ? (
        <AnimatedParticles
          imageSrc={imageSrc}
          maxWidth={maxWidth}
          xOffset={xOffset}
          particleSize={particleSize}
          edgeFade={edgeFade}
          animate={animate}
          explode={explode}
          onExplodeComplete={onExplodeComplete}
        />
      ) : (
        <StaticParticles
          imageSrc={imageSrc}
          maxWidth={maxWidth}
          xOffset={xOffset}
          particleSize={particleSize}
          edgeFade={edgeFade}
        />
      )}
    </Canvas>
  )
}
