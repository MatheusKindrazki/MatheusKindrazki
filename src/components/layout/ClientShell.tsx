'use client'

import dynamic from 'next/dynamic'
import { JarvisProvider } from '@/components/chat/JarvisProvider'
import PageTransition from '@/components/layout/PageTransition'
import { PixiSceneProvider } from '@/pixi/PixiSceneContext'
import PixiBackgroundStage from '@/pixi/PixiBackgroundStage'
import PixiOverlayStage from '@/pixi/PixiOverlayStage'

const JarvisTrigger = dynamic(
  () => import('@/components/chat/JarvisTrigger'),
  { ssr: false },
)

const JarvisChat = dynamic(() => import('@/components/chat/JarvisChat'), {
  ssr: false,
})

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <PixiSceneProvider>
      <JarvisProvider>
        <PixiBackgroundStage />
        <PageTransition>{children}</PageTransition>
        <JarvisTrigger />
        <JarvisChat />
        <PixiOverlayStage />
      </JarvisProvider>
    </PixiSceneProvider>
  )
}
