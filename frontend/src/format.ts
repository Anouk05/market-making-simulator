// Shared helpers for showing numbers.

const EPSILON = 0.005 // values closer to zero than this count as zero (they round to 0.00)

// Tailwind text colour: teal for positive, pink for negative, neutral for zero.
export function toneClass(value: number): string {
  if (value > EPSILON) return 'text-teal-bright'
  if (value < -EPSILON) return 'text-pink'
  return 'text-fg'
}

// The number with a real minus sign (−) instead of a hyphen, e.g. "−689.21".
export function num(value: number, decimals = 2): string {
  const rounded = Math.abs(value) < 0.5 * 10 ** -decimals ? 0 : value // avoid "−0.00"
  return rounded.toFixed(decimals).replace('-', '−')
}

// The number with a + sign when positive, e.g. "+12.50".
export function signed(value: number, decimals = 2): string {
  return `${value > EPSILON ? '+' : ''}${num(value, decimals)}`
}

// Parse what the player typed. Accepts a decimal comma too ("99,5"), as used in many countries.
export function parseNumber(text: string): number {
  return text.trim() === '' ? NaN : Number(text.trim().replace(',', '.'))
}
