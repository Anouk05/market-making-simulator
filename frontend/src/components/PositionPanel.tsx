// Status strip for the top bar: round, price, inventory, cash and PnL.
// On large screens the figures sit side by side, separated by thin lines;
// on small screens they wrap into a grid.

import type { GameState } from '../api/types'
import { signed, toneClass } from '../format'

interface PositionPanelProps {
  game: GameState
}

export function PositionPanel({ game }: PositionPanelProps) {
  const history = game.price_history
  const previousPrice = history.length > 1 ? history[history.length - 2] : null
  const priceChange = previousPrice === null ? null : game.price - previousPrice

  return (
    <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-slate-800 ring-1 ring-slate-800 sm:grid-cols-3 lg:flex">
      <Stat label="Round">
        <span>
          {game.round}
          <span className="text-slate-500"> / {game.n_rounds}</span>
        </span>
        <ProgressBar share={game.round / game.n_rounds} />
      </Stat>

      <Stat label="Price">
        <span>{game.price.toFixed(2)}</span>
        {priceChange !== null && <ChangeChip change={priceChange} />}
      </Stat>

      <Stat label="Inventory">
        <span>
          <span className={toneClass(game.inventory)}>{signed(game.inventory, 0)}</span>
          <span className="ml-1.5 text-xs font-normal text-slate-500">
            {game.inventory > 0 ? 'long' : game.inventory < 0 ? 'short' : 'flat'}
          </span>
        </span>
        <InventoryBar inventory={game.inventory} max={game.max_inventory} />
      </Stat>

      <Stat label="Cash">
        <span>{game.cash.toFixed(2)}</span>
      </Stat>

      <Stat label="PnL" highlight={game.pnl} className="col-span-2 sm:col-span-1">
        <span className={`text-lg ${toneClass(game.pnl)}`}>{signed(game.pnl)}</span>
      </Stat>
    </section>
  )
}

// One figure: a small label above the value. `highlight` tints the background
// green or red (used for PnL).
interface StatProps {
  label: string
  children: React.ReactNode
  highlight?: number
  className?: string
}

function Stat({ label, children, highlight, className = '' }: StatProps) {
  const tint =
    highlight === undefined || highlight === 0 ? 'bg-slate-900' : highlight > 0 ? 'bg-emerald-950' : 'bg-rose-950'
  return (
    <div className={`flex flex-col justify-center px-4 py-2 lg:min-w-[8.5rem] ${tint} ${className}`}>
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <div className="flex items-center gap-2 whitespace-nowrap font-semibold tabular-nums">{children}</div>
    </div>
  )
}

// Small coloured chip with the price change since the previous round.
function ChangeChip({ change }: { change: number }) {
  const up = change >= 0
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-medium ${
        up ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
      }`}
    >
      {up ? '▲' : '▼'} {Math.abs(change).toFixed(2)}
    </span>
  )
}

// How far the game has progressed.
function ProgressBar({ share }: { share: number }) {
  return (
    <div className="h-1 w-12 rounded-full bg-slate-800">
      <div className="h-full rounded-full bg-indigo-400" style={{ width: `${Math.min(share, 1) * 100}%` }} />
    </div>
  )
}

// A bar centred at zero: grows right (green) when long, left (red) when short.
function InventoryBar({ inventory, max }: { inventory: number; max: number }) {
  const share = Math.min(Math.abs(inventory) / max, 1) * 50 // percent of the full bar width
  return (
    <div className="relative h-1 w-12 rounded-full bg-slate-800" title={`Limit: ±${max}`}>
      <div className="absolute left-1/2 top-0 h-full w-px bg-slate-600" />
      <div
        className={`absolute top-0 h-full rounded-full ${inventory >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
        style={inventory >= 0 ? { left: '50%', width: `${share}%` } : { right: '50%', width: `${share}%` }}
      />
    </div>
  )
}
