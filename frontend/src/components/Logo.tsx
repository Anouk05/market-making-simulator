// The app logo: a tiny order book in an outlined square. Teal buy orders (bids)
// on the left, pink sell orders (asks) on the right, with the best prices nearest
// the middle. 

export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="0.5" y="0.5" width="23" height="23" rx="3" fill="none" className="stroke-peach" />
      <rect x="4" y="6" width="8" height="2.5" className="fill-teal" />
      <rect x="4" y="10.5" width="5" height="2.5" className="fill-teal" />
      <rect x="12" y="10.5" width="8" height="2.5" className="fill-pink" />
      <rect x="12" y="15" width="5" height="2.5" className="fill-pink" />
    </svg>
  )
}
