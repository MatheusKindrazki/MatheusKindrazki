import { type ThemeColor, getColorValue, getColorWithAlpha } from '@/lib/colors'

interface MarkProps {
  color?: ThemeColor
  children: React.ReactNode
}

export default function Mark({ color = 'yellow', children }: MarkProps) {
  return (
    <mark
      className="relative inline-block m-0 p-0 bg-transparent"
      style={{ color: getColorValue(color) }}
    >
      <span
        className="absolute left-0 right-0 bottom-0 -z-10"
        style={{
          top: '50%',
          backgroundColor: getColorWithAlpha(color, 0.14),
        }}
      />
      {children}
    </mark>
  )
}
