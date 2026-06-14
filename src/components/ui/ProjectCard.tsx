'use client'

import { motion } from 'framer-motion'
import { FiArrowUpRight } from 'react-icons/fi'
import { getColorValue, getColorWithAlpha, type ThemeColor } from '@/lib/colors'

interface ProjectCardProps {
  title: string
  description: string
  tags: string[]
  color: ThemeColor
  link?: string
  /** Optional zero-padded index shown top-left (e.g. "01"). */
  index?: string
  /** Optional status label shown top-right (e.g. "current", "past", "side"). */
  status?: 'current' | 'past' | 'side'
  /** Optional pre-computed year marker. If absent, one is resolved by title. */
  year?: string
}

// Hardcoded year map — kept here so content.ts stays untouched.
const YEAR_MAP: Record<string, string> = {
  'Jarvis — Personal AI Operating System': '2024-2025',
  'MokLabs Venture Studio': '2024-2025',
  'Lugui.ai': '2024-2025',
  'Remindr.AI': '2024-2025',
  'Arco Educação Platform': '2020-2024',
  'AI Education Tools': '2020-2024',
  Lofiever: '2019',
  'Café com Código': '2021',
}

function resolveYear(title: string): string {
  return YEAR_MAP[title] ?? '2017 — now'
}

export default function ProjectCard({
  title,
  description,
  tags,
  color,
  link,
  index,
  status,
  year,
}: ProjectCardProps) {
  const accent = getColorValue(color)
  const displayYear = year ?? resolveYear(title)

  return (
    <motion.div
      className="group/card relative min-h-[220px] overflow-hidden rounded-lg border border-[#222] bg-[#0c0c0c]/70 p-6 pl-7 backdrop-blur-md transition-all duration-500 hover:shadow-xl"
      style={{
        transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
      }}
      whileHover={{
        y: -2,
        borderColor: getColorWithAlpha(color, 0.35),
      }}
    >
      {/* Left accent bar — fills color on hover */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[2px] opacity-0 transition-opacity duration-700 group-hover/card:opacity-100"
        style={{
          backgroundColor: accent,
          transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
        }}
      />

      {/* Top meta row — index + year + status */}
      {(index || status || displayYear) && (
        <div
          className="mb-3 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.2em]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {index ? (
            <span
              style={{ color: accent, fontVariantNumeric: 'tabular-nums' }}
            >
              {index}
            </span>
          ) : (
            <span />
          )}
          <div className="ml-auto flex items-center gap-3">
            <span
              className="text-[9.5px] tracking-[0.3em] text-[var(--color-kindra-meta-low)]"
              style={{
                fontFamily: 'var(--font-body)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {displayYear}
            </span>
            {status && (
              <span className="inline-flex items-center gap-1.5 text-[var(--color-kindra-meta-low)]">
                <span
                  className="inline-block h-[5px] w-[5px] rounded-full"
                  style={{
                    backgroundColor:
                      status === 'current' ? accent : 'transparent',
                    border: `1px solid ${accent}`,
                  }}
                />
                <span>/ {status}</span>
              </span>
            )}
          </div>
        </div>
      )}

      <h3
        className="mb-3 text-xl font-bold text-white transition-colors duration-700 group-hover/card:text-white"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        {title}
      </h3>
      <p className="mb-4 text-sm leading-relaxed text-[#888] transition-colors duration-700 group-hover/card:text-[#aaa]">
        {description}
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded px-2 py-1 text-xs"
            style={{
              color: accent,
              backgroundColor: getColorWithAlpha(color, 0.1),
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="group/link inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] transition-colors duration-700"
          style={{
            color: accent,
            transitionTimingFunction: 'cubic-bezier(0.19, 1, 0.22, 1)',
            fontFamily: 'var(--font-body)',
          }}
        >
          <span>view project</span>
          <FiArrowUpRight className="-translate-x-0.5 transition-transform duration-700 group-hover/link:translate-x-0" />
        </a>
      )}
    </motion.div>
  )
}
