'use client'

import dynamic from 'next/dynamic'
import { JarvisProvider } from '@/components/chat/JarvisProvider'
import PageTransition from '@/components/layout/PageTransition'

const StarsCanvas = dynamic(() => import('@/components/canvas/StarsCanvas'), {
  ssr: false,
})

const CustomCursor = dynamic(() => import('@/components/ui/CustomCursor'), {
  ssr: false,
})

const JarvisTrigger = dynamic(
  () => import('@/components/chat/JarvisTrigger'),
  { ssr: false },
)

const JarvisChat = dynamic(() => import('@/components/chat/JarvisChat'), {
  ssr: false,
})

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <JarvisProvider>
      <StarsCanvas />
      <CustomCursor />
      {/* Galactic Aperture — three-phase signature transition between routes.
          Wraps children so the overlay sits above the route tree but below
          the Jarvis surface (z-[55] vs Jarvis's z-[65]+ layer). */}
      <PageTransition>{children}</PageTransition>
      <JarvisTrigger />
      <JarvisChat />
    </JarvisProvider>
  )
}
