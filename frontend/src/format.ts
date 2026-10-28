// Shared helpers for showing numbers.

const EPSILON = 0.005 // values closer to zero than this count as zero (they round to 0.00)

// Tailwind text colour: green for positive, red for negative, neutral for zero.
export function toneClass(value: number): string {
  if (value > EPSILON) return 'text-emerald-400'
  if (value < -EPSILON) return 'text-rose-400'
  return 'text-slate-100'
}

// The number with a + sign when positive, e.g. "+12.50".
export function signed(value: number, decimals = 2): string {
  return `${value > EPSILON ? '+' : ''}${value.toFixed(decimals)}`
}
