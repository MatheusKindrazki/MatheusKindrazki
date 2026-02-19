'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Identity from '@/components/ui/Identity'
import AnimatedLink from '@/components/ui/AnimatedLink'
import { navLinks } from '@/lib/content'

export default function Navigation() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 md:px-12 md:py-6">
      <div className="flex items-center justify-between max-w-[1000px] mx-auto">
        <Link href="/" className="flex items-center gap-3 group">
          <Identity status="rest" />
          <span className="text-white font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            Kindra
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <AnimatedLink
              key={link.href}
              href={link.href}
              color={link.color}
              className={pathname === link.href ? 'opacity-100' : 'opacity-70 hover:opacity-100'}
            >
              {link.label}
            </AnimatedLink>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span className={`block w-6 h-0.5 bg-white transition-transform duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-opacity duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block w-6 h-0.5 bg-white transition-transform duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-black/95 z-40 flex flex-col items-center justify-center gap-8">
          {navLinks.map((link) => (
            <AnimatedLink
              key={link.href}
              href={link.href}
              color={link.color}
              className="text-2xl"
            >
              <span onClick={() => setMenuOpen(false)}>{link.label}</span>
            </AnimatedLink>
          ))}
        </div>
      )}
    </nav>
  )
}
