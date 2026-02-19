export const colors = {
  green: '#419d78',
  yellow: '#e0a458',
  red: '#d9594c',
  blue: '#53a2be',
  grayscale: '#666666',
} as const

export const starsColors = [
  '#4c1a22', '#4c1a23', '#5d6268', '#1f2e37',
  '#474848', '#542619', '#ead8cf', '#4c241f',
  '#d6b9b1', '#964a47',
] as const

export type ThemeColor = keyof typeof colors

export const pageColors: Record<string, ThemeColor> = {
  home: 'yellow',
  projetos: 'green',
  skills: 'blue',
  sobre: 'yellow',
  contato: 'red',
}

export function getColorValue(color: ThemeColor): string {
  return colors[color]
}

export function getColorWithAlpha(color: ThemeColor, alpha: number): string {
  const hex = colors[color]
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
