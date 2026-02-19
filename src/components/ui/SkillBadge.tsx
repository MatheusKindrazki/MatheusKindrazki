import { getColorValue, getColorWithAlpha, type ThemeColor } from '@/lib/colors'

interface SkillBadgeProps {
  name: string
  color: ThemeColor
}

export default function SkillBadge({ name, color }: SkillBadgeProps) {
  return (
    <span
      className="inline-block text-sm px-3 py-1.5 rounded-md transition-all duration-500 hover:scale-105"
      style={{
        color: getColorValue(color),
        backgroundColor: getColorWithAlpha(color, 0.08),
        border: `1px solid ${getColorWithAlpha(color, 0.15)}`,
      }}
    >
      {name}
    </span>
  )
}
