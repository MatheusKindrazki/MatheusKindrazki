'use client'

import { useState } from 'react'
import { getColorValue, getColorWithAlpha, type ThemeColor } from '@/lib/colors'

interface SkillBadgeProps {
  name: string
  color: ThemeColor
}

export default function SkillBadge({ name, color }: SkillBadgeProps) {
  const [hover, setHover] = useState(false)
  const accent = getColorValue(color)

  return (
    <span
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="inline-flex items-center rounded-md px-3 py-1.5 text-xs transition-all duration-700"
      style={{
        color: accent,
        backgroundColor: hover
          ? getColorWithAlpha(color, 0.1)
          : 'transparent',
        border: `1px solid ${getColorWithAlpha(color, hover ? 0.35 : 0.18)}`,
        transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
        fontFamily: 'var(--font-body)',
        letterSpacing: '0.02em',
      }}
    >
      {name}
    </span>
  )
}
