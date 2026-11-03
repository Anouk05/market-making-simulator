// Your position, as a full-width row under the header: round, price, inventory,
// cash and profit & loss. Every cell has the same three lines (label, value,
// detail), so the values line up. On small screens the cells wrap.

import type { GameState } from '../api/types'
import { num, signed, toneClass } from '../format'

interface PositionPanelProps {
  game: GameState
}

export function PositionPanel({ game }: PositionPanelProps) {
  const history = game.price_history
  const previousPrice = history.length > 1 ? history[history.length - 2] : null
  const priceChange = previousPrice === null ? null : game.price - previousPrice
  const pnlTint = game.pnl > 0.005 ? 'bg-profit-tint' : game.pnl < -0.005 ? 'bg-pink-tint' : ''
  const position = game.inventory > 0 ? 'long' : game.inventory < 0 ? 'short' : 'flat'

  return (
    <section
      aria-label="Your position"
      className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] border-b border-line bg-surface"
    >
      <Cell label="Round" detail={<ProgressBar share={game.round / game.n_rounds} />}>
        {game.round}
        <span className="text-dim"> / {game.n_rounds}</span>
      </Cell>

      <Cell label="Price" detail={priceChange !== null && <ChangeChip change={priceChange} />}>
        {game.price.toFixed(2)}
      </Cell>

      <Cell
        label={
          <>
            Inventory <span className="text-dim">· limit ±{game.max_inventory}</span>
          </>
        }
        detail={<InventoryBar inventory={game.inventory} max={game.max_inventory} />}
      >
        <span className={toneClass(game.inventory)}>{signed(game.inventory, 0)}</span>
        <span className="ml-2 font-sans text-[13px] font-normal text-muted">{position}</span>
      </Cell>

      <Cell label="Cash">{num(game.cash)}</Cell>

      <Cell label="Profit & loss" className={pnlTint} strong>
        <span className={toneClass(game.pnl)}>{signed(game.pnl)}</span>
      </Cell>
    </section>
  )
}

// One figure: label, value and an optional detail line (kept at a fixed height).
interface CellProps {
  label: React.ReactNode
  children: React.ReactNode
  detail?: React.ReactNode
  className?: string
  strong?: boolean
}

function Cell({ label, children, detail, className = '', strong = false }: CellProps) {
  return (
    <div className={`flex flex-col gap-1 border-r border-line-subtle px-4 py-3 last:border-r-0 sm:px-7 ${className}`}>
      <span className="text-xs text-muted">{label}</span>
      <span
        className={`whitespace-nowrap font-mono text-[22px] leading-tight ${strong ? 'font-semibold' : 'font-medium'}`}
      >
        {children}
      </span>
      <span className="flex h-4 items-center">{detail}</span>
    </div>
  )
}

// The price change since the previous round.
function ChangeChip({ change }: { change: number }) {
  const up = change >= 0
  return (
    <span className={`font-mono text-xs font-medium ${up ? 'text-teal' : 'text-pink'}`}>
      {up ? '▲' : '▼'} {Math.abs(change).toFixed(2)}
    </span>
  )
}

// How far the game has progressed.
function ProgressBar({ share }: { share: number }) {
  return (
    <span className="h-1 flex-1 bg-line-subtle">
      <span className="block h-1 bg-peach" style={{ width: `${Math.min(share, 1) * 100}%` }} />
    </span>
  )
}

// A bar centred at zero: grows right (teal) when long, left (pink) when short.
function InventoryBar({ inventory, max }: { inventory: number; max: number }) {
  const share = Math.min(Math.abs(inventory) / max, 1) * 50 // percent of the full bar width
  return (
    <span className="relative h-1 flex-1 bg-line-subtle" title={`Limit: ±${max}`}>
      <span className="absolute -top-[3px] left-1/2 h-2.5 w-px bg-subtle" />
      <span
        className={`absolute top-0 h-1 ${inventory >= 0 ? 'bg-teal' : 'bg-pink'}`}
        style={inventory >= 0 ? { left: '50%', width: `${share}%` } : { right: '50%', width: `${share}%` }}
      />
    </span>
  )
}
