'use client'

import dynamic from 'next/dynamic'

const StarsCanvas = dynamic(() => import('@/components/canvas/StarsCanvas'), {
  ssr: false,
})

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StarsCanvas />
      {children}
    </>
  )
}
