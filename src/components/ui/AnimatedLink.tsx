'use client'

import Link from 'next/link'
import { type ThemeColor, getColorValue } from '@/lib/colors'

interface AnimatedLinkProps {
  href: string
  color?: ThemeColor
  variant?: 'default' | 'small'
  external?: boolean
  children: React.ReactNode
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

export default function AnimatedLink({
  href,
  color = 'yellow',
  variant = 'default',
  external = false,
  children,
  className = '',
  onClick,
}: AnimatedLinkProps) {
  const colorValue = getColorValue(color)

  const Component = external ? 'a' : Link

  if (variant === 'small') {
    return (
      <Component
        href={href}
        onClick={onClick}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={`group relative inline-block text-[11px] leading-[21px] text-[#aaa] transition-all duration-700 ${className}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)' }}
      >
        <span
          className="absolute left-0 right-0 bottom-[2px] h-[7px] bg-white/[0.07] -z-10 transition-all duration-700 group-hover:bottom-[-3.5px] group-hover:h-[2px]"
          style={{
            transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
          }}
        />
        <span className="group-hover:text-current">
          {children}
        </span>
      </Component>
    )
  }

  return (
    <Component
      href={href}
      onClick={onClick}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={`group relative inline-block font-bold transition-all duration-700 ${className}`}
      style={{
        color: colorValue,
        transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
      }}
    >
      <span
        className="absolute left-0 bottom-0 h-[2px] w-[21px] -z-10 transition-all duration-700 group-hover:w-full"
        style={{
          backgroundColor: colorValue,
          transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
        }}
      />
      {children}
    </Component>
  )
}
