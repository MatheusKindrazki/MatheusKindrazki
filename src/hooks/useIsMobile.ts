'use client'

import { useState, useEffect } from 'react'

export default function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => {
      setIsMobile(
        window.innerWidth <= breakpoint ||
        navigator.maxTouchPoints > 0
      )
    }

    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])

  return isMobile
}
