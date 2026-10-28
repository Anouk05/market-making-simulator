// Price history with the player's trades drawn on top.
//
// x-axis: round number. The price at round r is the price after r rounds.
// A trade made in round r happened at the quote you set when the price was
// at round r - 1, so it is drawn at x = r - 1. If the line then moves away
// from a green dot (you bought) downwards, you were picked off.

import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts'

import type { GameState, RoundResult } from '../api/types'
import { InfoTooltip } from './InfoTooltip'

interface PriceChartProps {
  game: GameState
  rounds: RoundResult[]
}

interface TradePoint {
  side: 'buy' | 'sell' // from your point of view
  round: number
  price: number
  quantity: number
  informed: number // number of units traded with informed traders
}

const PRICE_INFO =
  'Simulated stock price per round, following a geometric Brownian motion. Green dots are your buys and red dots your sells, drawn at the round in which you quoted. If the price then moves away from a dot, that trade lost money.'

export function PriceChart({ game, rounds }: PriceChartProps) {
  const prices = game.price_history.map((price, round) => ({ round, price }))

  // The x-axis starts by showing 5 rounds and zooms out as the game goes on,
  // always leaving room for the next round, up to the total number of rounds.
  const visibleRounds = Math.min(game.n_rounds, Math.max(5, game.round + 1))

  // Combine all trades on the same side in the same round into one dot.
  const buys: TradePoint[] = []
  const sells: TradePoint[] = []
  for (const r of rounds) {
    for (const side of ['buy', 'sell'] as const) {
      const trades = r.trades.filter((t) => t.side === side)
      if (trades.length === 0) continue
      const quantity = trades.reduce((sum, t) => sum + t.quantity, 0)
      const informed = trades.filter((t) => t.informed).reduce((sum, t) => sum + t.quantity, 0)
      const point = { side, round: r.round - 1, price: trades[0].price, quantity, informed }
      ;(side === 'buy' ? buys : sells).push(point)
    }
  }

  return (
    <section className="flex h-full flex-col rounded-xl bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          Price
          <InfoTooltip text={PRICE_INFO} />
        </h2>
        <div className="flex gap-4 text-sm text-slate-400">
          <Legend colour="bg-emerald-500" label="You bought" />
          <Legend colour="bg-rose-500" label="You sold" />
        </div>
      </div>

      <div className="h-72 lg:h-auto lg:min-h-0 lg:flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid stroke="#1e293b" />
            <XAxis
              dataKey="round"
              type="number"
              domain={[0, visibleRounds]}
              allowDecimals={false}
              stroke="#64748b"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              dataKey="price"
              type="number"
              domain={['auto', 'auto']}
              stroke="#64748b"
              tick={{ fontSize: 12 }}
              width={55}
              tickFormatter={(v: number) => v.toFixed(1)}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              data={prices}
              dataKey="price"
              stroke="#818cf8"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Scatter data={buys} dataKey="price" fill="#10b981" isAnimationActive={false} />
            <Scatter data={sells} dataKey="price" fill="#f43f5e" isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

function Legend({ colour, label }: { colour: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${colour}`} />
      {label}
    </span>
  )
}

// What appears when you hover over the chart.
interface TooltipPayloadItem {
  payload: { round: number; price: number; side?: 'buy' | 'sell'; quantity?: number; informed?: number }
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null
  // Prefer a trade dot over the price line when both are under the mouse.
  const point = (payload.find((item) => item.payload.side !== undefined) ?? payload[0]).payload
  const isTrade = point.side !== undefined
  return (
    <div className="rounded-md bg-slate-800 px-3 py-2 text-sm shadow-lg">
      <p className="text-slate-400">Round {point.round}</p>
      {isTrade ? (
        <p>
          {point.side === 'buy' ? 'Bought' : 'Sold'} {point.quantity} at {point.price.toFixed(2)}
          {point.informed ? <span className="text-amber-400"> ({point.informed} vs informed)</span> : null}
        </p>
      ) : (
        <p>Price {point.price.toFixed(2)}</p>
      )}
    </div>
  )
}
