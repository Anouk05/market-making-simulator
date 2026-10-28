// The order book of one round as a classic price ladder:
//   Bid | Size | Price | Size | Ask
// Only traders who actually sent an order are shown, each at their limit price.

import { useState } from 'react'

import type { RoundResult } from '../api/types'
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
}

const ORDER_BOOK_INFO =
  'Your bid and ask together with the trader orders of one round, sorted by price. A trader whose valuation lies outside your spread sends an immediate-or-cancel order at their limit price; all trades happen at your quote, in order of arrival, until your size is used up.'

export function OrderBookView({ rounds }: OrderBookViewProps) {
  // null = always show the latest round; a number = the round the player picked.
  const [selected, setSelected] = useState<number | null>(null)

  if (rounds.length === 0) {
    return (
      <section className="h-full rounded-xl bg-slate-900 p-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          Order book
          <InfoTooltip text={ORDER_BOOK_INFO} />
        </h2>
        <p className="mt-2 text-sm text-slate-400">Submit a quote to see the order book of that round.</p>
      </section>
    )
  }

  const index = selected ?? rounds.length - 1
  const round = rounds[index]
  const { above, below } = buildLadder(round)
  const { quote } = round
  const spread = quote.bid_size > 0 && quote.ask_size > 0 ? (quote.ask - quote.bid).toFixed(2) : null

  return (
    <section className="min-h-full space-y-3 rounded-xl bg-slate-900 p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          Order book
          <InfoTooltip text={ORDER_BOOK_INFO} />
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <NavButton label="◀" disabled={index === 0} onClick={() => setSelected(index - 1)} />
          <span className="w-20 text-center tabular-nums">Round {round.round}</span>
          <NavButton
            label="▶"
            disabled={index === rounds.length - 1}
            onClick={() => setSelected(index + 1 === rounds.length - 1 ? null : index + 1)}
          />
        </div>
      </div>

      <p className="text-sm text-slate-400">
        {round.n_traders} {round.n_traders === 1 ? 'trader' : 'traders'} arrived · {round.trader_orders.length} sent an
        order
      </p>

      <div className="-mx-1 grid grid-cols-[1fr_auto_auto_auto_1fr] overflow-x-auto px-1 text-sm tabular-nums">
        <span className="pb-1 text-slate-400">Bid</span>
        <span className="pb-1 pr-3 text-right text-slate-400">Size</span>
        <span className="px-3 pb-1 text-center text-slate-400">Price</span>
        <span className="pb-1 pl-3 text-slate-400">Size</span>
        <span className="pb-1 text-right text-slate-400">Ask</span>

        {above.map((entry, i) => (
          <Row key={`a${i}`} entry={entry} />
        ))}

        <div className="col-span-5 flex items-center gap-2 py-1.5 text-xs text-slate-500">
          <span className="h-px flex-1 border-t border-dashed border-slate-700" />
          {spread ? `spread ${spread}` : 'one-sided quote'}
          <span className="h-px flex-1 border-t border-dashed border-slate-700" />
        </div>

        {below.map((entry, i) => (
          <Row key={`b${i}`} entry={entry} />
        ))}
      </div>

      <FilledOrders round={round} />

      <p className="text-xs text-slate-500">
        Orders are shown at their limit price; all trades happen at your bid or ask. Dimmed orders were cancelled
        because your size was used up.
      </p>
    </section>
  )
}

// Everything above the spread line: trader buy orders and your ask.
// Everything below it: your bid and trader sell orders. Highest price on top.
function buildLadder(round: RoundResult): { above: Entry[]; below: Entry[] } {
  const { quote } = round
  const soldByYou = round.trades.filter((t) => t.side === 'sell').reduce((s, t) => s + t.quantity, 0)
  const boughtByYou = round.trades.filter((t) => t.side === 'buy').reduce((s, t) => s + t.quantity, 0)

  const traders: Entry[] = round.trader_orders.map((o) => ({
    side: o.side,
    price: o.limit_price,
    quantity: o.quantity,
    filled: o.filled,
    mine: false,
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
  const label = <OrderLabel entry={entry} />
  const size = <SizeCell entry={entry} />
  const priceClass = entry.mine ? `font-semibold ${isBuy ? 'text-emerald-400' : 'text-rose-400'}` : 'text-slate-300'
  return (
    <>
      <div className="py-1">{isBuy && label}</div>
      <div className="py-1 pr-3 text-right">{isBuy && size}</div>
      <div className={`px-3 py-1 text-center ${priceClass}`}>{entry.price.toFixed(2)}</div>
      <div className="py-1 pl-3">{!isBuy && size}</div>
      <div className="flex justify-end py-1">{!isBuy && label}</div>
    </>
  )
}

// "You" or "Trader". Trader orders that did not trade at all are dimmed.
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
      className={`inline-block whitespace-nowrap rounded-md px-2 py-0.5 font-medium ${
        entry.mine ? 'bg-indigo-500/20 ring-1 ring-indigo-400' : 'bg-slate-800'
      } ${entry.filled === 0 && !entry.mine ? 'opacity-50' : ''}`}
    >
      {entry.mine ? 'You' : 'Trader'}
    </span>
  )
}

// The size of the order as a plain number. Trader orders that did not trade
// at all are dimmed; what was filled is listed below the ladder.
function SizeCell({ entry }: { entry: Entry }) {
  const tone = entry.filled === 0 && !entry.mine ? 'text-slate-500' : ''
  return <span className={tone}>{entry.quantity}</span>
}

function NavButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-md bg-slate-800 px-2 py-1 hover:bg-slate-700 disabled:opacity-30"
    >
      {label}
    </button>
  )
}

// The trader orders that (partly) traded with you, in the order they arrived.
function FilledOrders({ round }: { round: RoundResult }) {
  const filled = round.trader_orders.filter((o) => o.filled > 0)
  return (
    <div className="border-t border-slate-800 pt-3 text-sm">
      <p className="mb-1 text-slate-400">Filled orders</p>
      {filled.length === 0 ? (
        <p className="text-slate-500">No orders were filled.</p>
      ) : (
        <ul className="space-y-0.5 tabular-nums">
          {filled.map((o, i) => {
            const traderBought = o.side === 'buy'
            const price = traderBought ? round.quote.ask : round.quote.bid
            const partly = o.filled < o.quantity ? ` (of ${o.quantity})` : ''
            return (
              <li key={i} className={traderBought ? 'text-rose-400' : 'text-emerald-400'}>
                {traderBought ? 'Sold' : 'Bought'} {o.filled} @ {price.toFixed(2)}
                {partly}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
