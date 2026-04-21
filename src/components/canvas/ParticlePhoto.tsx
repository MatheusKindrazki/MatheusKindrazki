'use client'

import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useImageParticles from '@/hooks/useImageParticles'

/**
 * Non-react helper: read the OS reduced-motion preference synchronously.
 * Safe to call inside three/WebGL hooks where we can't reach into React state.
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

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

/**
 * Unified vertex shader for both animated (assemble/explode) and static
 * particle systems. Supports:
 *   - scatter→position assembly via uProgress
 *   - cursor repulsion via uMouse + uMouseStrength
 */
const VERTEX_SHADER = `
  attribute vec3 scatteredPos;
  attribute vec3 particleColor;
  uniform float uProgress;
  uniform float uPointSize;
  uniform vec2 uMouse;
  uniform float uMouseStrength;
  varying vec3 vColor;

  float easeInOutCubic(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    float t = easeInOutCubic(uProgress);
    vec3 pos = mix(scatteredPos, position, t);

    // Cursor magnetism — subtle repel within a radius.
    vec2 toMouse = pos.xy - uMouse;
    float dist = length(toMouse);
    float influenceRadius = 120.0;
    float push = smoothstep(influenceRadius, 0.0, dist) * 40.0 * uMouseStrength;
    vec2 dir = dist > 0.001 ? normalize(toMouse) : vec2(0.0);
    pos.xy += dir * push;

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

interface MagnetismRefs {
  /** Mouse position in world-space (canvas-centered, Y-up). */
  mouse: React.MutableRefObject<{ x: number; y: number }>
  /** Target strength (0 when cursor outside canvas, 1 when inside). */
  mouseTarget: React.MutableRefObject<number>
  /** Eased strength — what the shader actually reads. */
  mouseCurrent: React.MutableRefObject<number>
}

/**
 * Hook: shared drag-camera listeners + mouse-magnetism tracking.
 * Keeps the existing drag-to-pan behavior intact while layering on
 * world-space cursor coords for the shader.
 */
function useParticleInteraction(): MagnetismRefs {
  const { camera, gl } = useThree()
  const mouseState = useRef({ isDown: false, lastX: 0, lastY: 0 })
  const mouse = useRef({ x: 99999, y: 99999 })
  const mouseTarget = useRef(0)
  const mouseCurrent = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const canvas = gl.domElement

    const updateWorldMouse = (clientX: number, clientY: number) => {
      // Orthographic camera with zoom=1 and default frustum — screen pixels
      // map 1:1 to world units, with Y inverted relative to screen Y.
      mouse.current.x = clientX - window.innerWidth / 2
      mouse.current.y = -(clientY - window.innerHeight / 2)
    }

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
      if (!reduceMotion) {
        updateWorldMouse(e.clientX, e.clientY)
      }
    }

    const onCanvasEnter = () => {
      if (!reduceMotion) mouseTarget.current = 1
    }
    const onCanvasLeave = () => {
      mouseTarget.current = 0
    }

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseenter', onCanvasEnter)
    canvas.addEventListener('mouseleave', onCanvasLeave)

    return () => {
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseenter', onCanvasEnter)
      canvas.removeEventListener('mouseleave', onCanvasLeave)
    }
  }, [camera, gl])

  // Camera easing back to origin lives here so both particle systems share it.
  useFrame(() => {
    if (!mouseState.current.isDown) {
      camera.position.x += (0 - camera.position.x) * 0.06
      camera.position.y += (0 - camera.position.y) * 0.06
      camera.lookAt(0, 0, 0)
    }
  })

  return { mouse, mouseTarget, mouseCurrent }
}

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
  // When the OS requests reduced motion, skip the assemble animation entirely
  // and render particles at their final target positions (t = 1.0).
  const reduceMotionRef = useRef(prefersReducedMotion())
  const progressRef = useRef(animate && !reduceMotionRef.current ? 0 : 1)
  const explodingRef = useRef(false)
  const onCompleteRef = useRef(onExplodeComplete)
  onCompleteRef.current = onExplodeComplete

  const circleMap = useMemo(() => createCircleTexture(), [])
  const { mouse, mouseTarget, mouseCurrent } = useParticleInteraction()

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
    const startProgress = animate && !reduceMotionRef.current ? 0 : 1
    return new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: startProgress },
        uPointSize: { value: particleSize },
        uMap: { value: circleMap },
        uMouse: { value: new THREE.Vector2(99999, 99999) },
        uMouseStrength: { value: 0 },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
    })
  }, [animate, particleSize, circleMap])

  // Handle explode trigger. Under reduced motion, skip the 1–2s explode
  // animation entirely and fire the completion callback on the next tick so
  // navigation still happens.
  useEffect(() => {
    if (!explode) return
    if (reduceMotionRef.current) {
      const id = window.setTimeout(() => onCompleteRef.current?.(), 0)
      return () => window.clearTimeout(id)
    }
    explodingRef.current = true
  }, [explode])

  // Animation loop
  useFrame((_, delta) => {
    // Update progress
    if (explodingRef.current) {
      progressRef.current = Math.max(0, progressRef.current - delta * 0.7)
      if (progressRef.current <= 0.01) {
        explodingRef.current = false
        onCompleteRef.current?.()
      }
    } else if (animate && !reduceMotionRef.current && progressRef.current < 1) {
      progressRef.current = Math.min(1, progressRef.current + delta * 0.4)
    }

    // Ease magnetism strength toward target.
    mouseCurrent.current += (mouseTarget.current - mouseCurrent.current) * 0.1

    // Update shader uniforms
    shaderMaterial.uniforms.uProgress.value = progressRef.current
    const uMouse = shaderMaterial.uniforms.uMouse.value as THREE.Vector2
    uMouse.set(mouse.current.x, mouse.current.y)
    shaderMaterial.uniforms.uMouseStrength.value = mouseCurrent.current
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

/**
 * Static particles (no assemble/explode animation) - used by sub-pages.
 * Now also shader-backed so it gets the same cursor-magnetism treatment.
 * Progress is locked at 1.0 and scatteredPos mirrors position.
 */
function StaticParticles({
  imageSrc, maxWidth, xOffset, particleSize, edgeFade
}: Omit<ParticlesProps, 'animate' | 'explode' | 'onExplodeComplete'>) {
  const data = useImageParticles(imageSrc, 500, 2, maxWidth, xOffset, edgeFade)
  const pointsRef = useRef<THREE.Points>(null)
  const circleMap = useMemo(() => createCircleTexture(), [])
  const { mouse, mouseTarget, mouseCurrent } = useParticleInteraction()

  // scatteredPos is required by the shader; for static rendering we just
  // reuse the real positions so mix(scatter, pos, 1.0) == pos.
  const scatteredPositions = useMemo(() => {
    if (!data) return null
    return data.positions.slice()
  }, [data])

  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uProgress: { value: 1 },
        uPointSize: { value: particleSize },
        uMap: { value: circleMap },
        uMouse: { value: new THREE.Vector2(99999, 99999) },
        uMouseStrength: { value: 0 },
      },
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
    })
  }, [particleSize, circleMap])

  useFrame(() => {
    mouseCurrent.current += (mouseTarget.current - mouseCurrent.current) * 0.1
    const uMouse = shaderMaterial.uniforms.uMouse.value as THREE.Vector2
    uMouse.set(mouse.current.x, mouse.current.y)
    shaderMaterial.uniforms.uMouseStrength.value = mouseCurrent.current
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
