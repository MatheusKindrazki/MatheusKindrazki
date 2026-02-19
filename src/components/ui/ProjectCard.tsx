'use client'

import { motion } from 'framer-motion'
import AnimatedLink from '@/components/ui/AnimatedLink'
import { getColorValue, getColorWithAlpha, type ThemeColor } from '@/lib/colors'

interface ProjectCardProps {
  title: string
  description: string
  tags: string[]
  color: ThemeColor
  link?: string
}

export default function ProjectCard({ title, description, tags, color, link }: ProjectCardProps) {
  return (
    <motion.div
      className="border border-[#222] rounded-lg p-6 hover:border-opacity-50 transition-all duration-500 group"
      style={{ '--hover-border': getColorWithAlpha(color, 0.3) } as React.CSSProperties}
      whileHover={{ borderColor: getColorWithAlpha(color, 0.3) }}
    >
      <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
        {title}
      </h3>
      <p className="text-[#888] text-sm mb-4 leading-relaxed">{description}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag) => (
          <span
            key={tag}
            className="text-xs px-2 py-1 rounded"
            style={{
              color: getColorValue(color),
              backgroundColor: getColorWithAlpha(color, 0.1),
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      {link && (
        <AnimatedLink href={link} color={color} external>
          Ver projeto
        </AnimatedLink>
      )}
    </motion.div>
  )
}
