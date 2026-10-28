// The app logo: a tiny order book. Green buy orders (bids) on the left, red
// sell orders (asks) on the right, with the best prices nearest the middle.
// It is an inline SVG, so it stays sharp at any size and needs no image file.

export function Logo({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
      <rect width="36" height="36" rx="9" fill="#1e293b" />
      <rect x="7" y="8" width="9" height="3" rx="1.5" fill="#10b981" opacity="0.55" />
      <rect x="5" y="13" width="11" height="3" rx="1.5" fill="#10b981" opacity="0.8" />
      <rect x="9" y="18" width="7" height="3" rx="1.5" fill="#10b981" />
      <rect x="20" y="15" width="8" height="3" rx="1.5" fill="#f43f5e" />
      <rect x="20" y="20" width="11" height="3" rx="1.5" fill="#f43f5e" opacity="0.8" />
      <rect x="20" y="25" width="6" height="3" rx="1.5" fill="#f43f5e" opacity="0.55" />
    </svg>
  )
}
