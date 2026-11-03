// The order book of one round as a classic price ladder:
//   Bid | Size | Price | Size | Ask
// Only traders who actually sent an order are shown, each at their limit price.

import { useState } from 'react'

import type { RoundResult } from '../api/types'
import { panel, panelHeader, panelTitle } from '../styles'
import { InfoTooltip } from './InfoTooltip'

interface OrderBookViewProps {
  rounds: RoundResult[]
}

interface Entry {
  side: 'buy' | 'sell'
  price: number
  quantity: number
  filled: number
  mine: boolean // true for your own bid or ask
  arrival?: number // trader orders only: 1 = arrived first
}

const ORDER_BOOK_INFO =
  'Your bid and ask together with the trader orders of one round, sorted by price. A trader whose valuation lies outside your spread sends an immediate-or-cancel order at their limit price; all trades happen at your quote. Traders are filled in order of arrival (#1 first), not by price. Orders marked “Cancelled” did not trade, because your size was already used up.'

export function OrderBookView({ rounds }: OrderBookViewProps) {
  // null = always show the latest round; a number = the round the player picked.
  const [selected, setSelected] = useState<number | null>(null)

  const title = (
    <h2 className={panelTitle}>
      Order book
      <InfoTooltip text={ORDER_BOOK_INFO} />
    </h2>
  )

  if (rounds.length === 0) {
    return (
      <section className={`${panel} h-full`}>
        <div className={panelHeader}>{title}</div>
        <p className="p-4 text-sm text-muted">Submit a quote to see the order book of that round.</p>
      </section>
    )
  }

  const index = selected ?? rounds.length - 1
  const round = rounds[index]
  const { above, below } = buildLadder(round)
  const { quote } = round
  const spread = quote.bid_size > 0 && quote.ask_size > 0 ? (quote.ask - quote.bid).toFixed(2) : null

  return (
    <section className={`${panel} h-full`}>
      <div className={panelHeader}>
        {title}
        <div className="flex items-center gap-1 text-[13px]">
          <NavButton label="Previous round" disabled={index === 0} onClick={() => setSelected(index - 1)}>
            ◀
          </NavButton>
          <span className="w-[72px] text-center">
            Round <span className="font-mono">{round.round}</span>
          </span>
          <NavButton
            label="Next round"
            disabled={index === rounds.length - 1}
            onClick={() => setSelected(index + 1 === rounds.length - 1 ? null : index + 1)}
          >
            ▶
          </NavButton>
        </div>
      </div>

      {/* Scrolls inside the panel (*:shrink-0 keeps the ladder from being squeezed) */}
      <div className="flex min-h-0 flex-col gap-3 overflow-y-auto px-4 pt-2.5 pb-4 text-sm *:shrink-0">
        <p className="text-[13px] text-muted">
          {round.n_traders} {round.n_traders === 1 ? 'trader' : 'traders'} arrived · {round.trader_orders.length} sent
          an order
        </p>

        <div className="-mx-1 grid grid-cols-[minmax(0,1fr)_3.5rem_5.25rem_3.5rem_minmax(0,1fr)] items-center gap-y-1 overflow-x-auto px-1">
          <span className="text-[13px] font-semibold text-teal">Bid</span>
          <span className="pr-2.5 text-right text-xs text-muted">Size</span>
          <span className="text-center text-xs text-muted">Price</span>
          <span className="pl-2.5 text-xs text-muted">Size</span>
          <span className="text-right text-[13px] font-semibold text-pink">Ask</span>

          {above.map((entry, i) => (
            <Row key={`a${i}`} entry={entry} />
          ))}

          <div className="col-span-5 flex items-center gap-2 py-0.5 text-xs text-subtle">
            <span className="flex-1 border-t border-dashed border-line" />
            {spread ? (
              <>
                spread <span className="font-mono">{spread}</span>
              </>
            ) : (
              'one-sided quote'
            )}
            <span className="flex-1 border-t border-dashed border-line" />
          </div>

          {below.map((entry, i) => (
            <Row key={`b${i}`} entry={entry} />
          ))}
        </div>

        <FilledOrders round={round} />
      </div>
    </section>
  )
}

// Everything above the spread line: trader buy orders and your ask.
// Everything below it: your bid and trader sell orders. Highest price on top.
function buildLadder(round: RoundResult): { above: Entry[]; below: Entry[] } {
  const { quote } = round
  const soldByYou = round.trades.filter((t) => t.side === 'sell').reduce((s, t) => s + t.quantity, 0)
  const boughtByYou = round.trades.filter((t) => t.side === 'buy').reduce((s, t) => s + t.quantity, 0)

  // The backend lists trader orders in the order they arrived.
  const traders: Entry[] = round.trader_orders.map((o, i) => ({
    side: o.side,
    price: o.limit_price,
    quantity: o.quantity,
    filled: o.filled,
    mine: false,
    arrival: i + 1,
  }))

  const above = traders.filter((e) => e.side === 'buy')
  if (quote.ask_size > 0) {
    above.push({ side: 'sell', price: quote.ask, quantity: quote.ask_size, filled: soldByYou, mine: true })
  }
  const below = traders.filter((e) => e.side === 'sell')
  if (quote.bid_size > 0) {
    below.push({ side: 'buy', price: quote.bid, quantity: quote.bid_size, filled: boughtByYou, mine: true })
  }

  // Highest price first; at equal prices your own order sits closest to the spread line.
  const byPrice = (a: Entry, b: Entry) => b.price - a.price || Number(a.mine) - Number(b.mine)
  above.sort(byPrice)
  below.sort((a, b) => b.price - a.price || Number(b.mine) - Number(a.mine))
  return { above, below }
}

function Row({ entry }: { entry: Entry }) {
  const isBuy = entry.side === 'buy'
  const cancelled = entry.filled === 0 && !entry.mine
  const label = <OrderLabel entry={entry} />
  const size = <SizeCell entry={entry} />
  const priceClass = entry.mine
    ? `font-semibold ${isBuy ? 'text-teal' : 'text-pink'}`
    : cancelled
      ? 'text-muted'
      : 'text-fg'
  return (
    <>
      <div className={cancelled ? 'opacity-45' : ''}>{isBuy && label}</div>
      <div className="pr-2.5 text-right">{isBuy && size}</div>
      <div className={`text-center font-mono ${priceClass}`}>{entry.price.toFixed(2)}</div>
      <div className="pl-2.5">{!isBuy && size}</div>
      <div className={`flex justify-end ${cancelled ? 'opacity-45' : ''}`}>{!isBuy && label}</div>
    </>
  )
}

// "You", or "Trader #2" / "Cancelled #3" for trader orders, with their arrival number.
// Hover to see how much of the order was filled.
function OrderLabel({ entry }: { entry: Entry }) {
  const status =
    entry.filled === entry.quantity
      ? 'filled'
      : entry.filled === 0
        ? entry.mine
          ? 'not traded'
          : 'cancelled'
        : `${entry.filled} of ${entry.quantity} filled`
  return (
    <span
      title={status}
      className={`inline-block rounded-[3px] px-2 py-0.5 text-xs whitespace-nowrap ${
        entry.mine ? 'border border-peach font-bold text-peach' : 'bg-line-subtle font-semibold'
      }`}
    >
      {entry.mine ? 'You' : `${entry.filled === 0 ? 'Cancelled' : 'Trader'} #${entry.arrival}`}
    </span>
  )
}

// The size of the order. Trader orders are coloured by side; cancelled ones are faded.
function SizeCell({ entry }: { entry: Entry }) {
  const tone = entry.mine
    ? 'text-fg'
    : entry.filled === 0
      ? 'text-dim'
      : entry.side === 'buy'
        ? 'text-teal'
        : 'text-pink'
  return <span className={`font-mono ${tone}`}>{entry.quantity}</span>
}

interface NavButtonProps {
  label: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}

function NavButton({ label, disabled, onClick, children }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-8 w-8 place-items-center rounded border border-line text-fg-soft hover:border-muted disabled:cursor-not-allowed disabled:border-line-subtle disabled:text-dim"
    >
      {children}
    </button>
  )
}

// The trader orders that (partly) traded with you, in the order they arrived.
function FilledOrders({ round }: { round: RoundResult }) {
  const filled = round.trader_orders.filter((o) => o.filled > 0)
  return (
    <div className="border-t border-line pt-2.5">
      <p className="mb-1 text-[13px] text-muted">Filled orders</p>
      {filled.length === 0 ? (
        <p className="text-subtle">No orders were filled.</p>
      ) : (
        <ul className="space-y-0.5">
          {filled.map((o, i) => {
            const traderBought = o.side === 'buy'
            const price = traderBought ? round.quote.ask : round.quote.bid
            return (
              <li key={i}>
                <span className={traderBought ? 'text-pink' : 'text-teal'}>{traderBought ? 'Sold' : 'Bought'}</span>{' '}
                <span className="font-mono">
                  {o.filled} @ {price.toFixed(2)}
                </span>
                {o.filled < o.quantity && <span className="text-muted"> (of {o.quantity})</span>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
