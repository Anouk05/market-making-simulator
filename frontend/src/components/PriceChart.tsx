// Price history as a stepped line, with the player's trades drawn on top.
//
// x-axis: round number. The price at round r is the price after r rounds.
// A trade made in round r happened at the quote you set when the price was
// at round r - 1, so it is drawn at x = r - 1. If the line then moves away
// from a teal dot (you bought) downwards, you were picked off.

import { useState } from 'react'
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { GameState, RoundResult } from '../api/types'
import { panel, panelHeader, panelTitle } from '../styles'
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
}

// The same colours as in index.css (SVG attributes can't use the Tailwind classes).
const C = {
  ground: '#0a181d',
  future: '#0d2026',
  grid: '#1d3e49',
  axis: '#3a6573',
  tick: '#8fa9ad',
  peach: '#ebccb0',
  teal: '#5cc6c8',
  pink: '#e5a3cb',
}
const MONO = 'Geist Mono, monospace'

const PRICE_INFO =
  'Simulated stock price per round, following a geometric Brownian motion. Teal dots are your buys and pink dots your sells, drawn at the round in which you quoted; a bigger dot means more shares.'

// The trade dot under the mouse, with its position in the chart.
interface Hovered {
  x: number
  y: number
  point: TradePoint
}

export function PriceChart({ game, rounds }: PriceChartProps) {
  const [hovered, setHovered] = useState<Hovered | null>(null)
  const prices = game.price_history.map((price, round) => ({ round, price }))

  // The x-axis starts by showing 5 rounds and zooms out as the game goes on,
  // always leaving room for the next round, up to the total number of rounds.
  const visibleRounds = Math.min(game.n_rounds, Math.max(5, game.round + 1))
  const ticks = Array.from({ length: visibleRounds + 1 }, (_, i) => i)

  // Combine all trades on the same side in the same round into one dot.
  const buys: TradePoint[] = []
  const sells: TradePoint[] = []
  for (const r of rounds) {
    for (const side of ['buy', 'sell'] as const) {
      const trades = r.trades.filter((t) => t.side === side)
      if (trades.length === 0) continue
      const quantity = trades.reduce((sum, t) => sum + t.quantity, 0)
      const point = { side, round: r.round - 1, price: trades[0].price, quantity }
      ;(side === 'buy' ? buys : sells).push(point)
    }
  }

  return (
    <section className={`${panel} h-full`}>
      <div className={`${panelHeader} flex-wrap`}>
        <h2 className={panelTitle}>
          Price
          <InfoTooltip text={PRICE_INFO} />
        </h2>
        <div className="flex gap-2 text-[13px] font-semibold">
          <span className="rounded-[3px] bg-teal-tint px-2.5 py-0.5 text-teal">● You bought</span>
          <span className="rounded-[3px] bg-pink-tint px-2.5 py-0.5 text-pink">● You sold</span>
        </div>
      </div>

      <div className="h-80 p-3 lg:h-auto lg:min-h-0 lg:flex-1">
        {/* relative: the trade popup is positioned in the chart's own coordinates */}
        <div className="relative h-full w-full" onMouseLeave={() => setHovered(null)}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 12, right: 64, bottom: 4, left: 0 }}>
              {/* Rounds still to come */}
              {!game.done && game.round < visibleRounds && (
                <ReferenceArea x1={game.round} x2={visibleRounds} fill={C.future} fillOpacity={1} strokeOpacity={0} />
              )}
              <CartesianGrid stroke={C.grid} />
              <XAxis
                dataKey="round"
                type="number"
                domain={[0, visibleRounds]}
                ticks={ticks}
                stroke={C.axis}
                tickLine={false}
                tick={{ fontSize: 12, fill: C.tick, fontFamily: MONO }}
              />
              <YAxis
                dataKey="price"
                type="number"
                domain={['auto', 'auto']}
                stroke={C.axis}
                tickLine={false}
                tick={{ fontSize: 12, fill: C.tick, fontFamily: MONO }}
                width={60}
                tickFormatter={(v: number) => v.toFixed(2)}
              />
              <Tooltip
                active={hovered ? false : undefined} // hide it while a trade popup is shown
                content={<ChartTooltip />}
                cursor={{ stroke: C.axis, strokeDasharray: '3 3' }}
              />
              {/* The current price: a dashed line with a tag on the right */}
              <ReferenceLine
                y={game.price}
                stroke={C.peach}
                strokeOpacity={0.6}
                strokeDasharray="3 4"
                label={<PriceTag value={game.price} />}
              />
              <Line
                data={prices}
                dataKey="price"
                type="stepAfter"
                stroke={C.peach}
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
              <Scatter
                data={buys}
                dataKey="price"
                shape={(props: unknown) => <TradeMarker {...(props as MarkerProps)} onHover={setHovered} />}
                isAnimationActive={false}
              />
              <Scatter
                data={sells}
                dataKey="price"
                shape={(props: unknown) => <TradeMarker {...(props as MarkerProps)} onHover={setHovered} />}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          {hovered && <TradePopup {...hovered} />}
        </div>
      </div>
    </section>
  )
}

// A trade: a teal (you bought) or pink (you sold) dot. The more shares, the bigger the dot.
interface MarkerProps {
  cx?: number
  cy?: number
  payload?: TradePoint
  onHover?: (hovered: Hovered | null) => void
}

function TradeMarker({ cx = 0, cy = 0, payload, onHover }: MarkerProps) {
  if (!payload) return <g />
  const r = Math.min(4 + 1.4 * Math.sqrt(payload.quantity), 14) // area grows with the number of shares
  return (
    <g onMouseEnter={() => onHover?.({ x: cx, y: cy, point: payload })} onMouseLeave={() => onHover?.(null)}>
      {/* an invisible, larger circle makes small dots easy to hover */}
      <circle cx={cx} cy={cy} r={Math.max(r + 6, 14)} fill="transparent" />
      <circle cx={cx} cy={cy} r={r} fill={payload.side === 'buy' ? C.teal : C.pink} stroke={C.ground} strokeWidth={2} />
    </g>
  )
}

// The popup above a hovered trade dot, e.g. "Bought 4 @ 98.67".
function TradePopup({ x, y, point }: Hovered) {
  const buy = point.side === 'buy'
  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded border border-line bg-raised px-3 py-2 text-sm whitespace-nowrap"
      style={{ left: x, top: y - 14 }}
    >
      <p className="text-muted">Round {point.round + 1}</p>
      <p>
        <span className={buy ? 'text-teal' : 'text-pink'}>{buy ? 'Bought' : 'Sold'}</span>{' '}
        <span className="font-mono">
          {point.quantity} @ {point.price.toFixed(2)}
        </span>
      </p>
    </div>
  )
}

// The current price in a peach tag on the right edge of the chart.
interface PriceTagProps {
  value: number
  viewBox?: { x?: number; y?: number; width?: number }
}

function PriceTag({ value, viewBox }: PriceTagProps) {
  if (viewBox?.x === undefined || viewBox.y === undefined || viewBox.width === undefined) return null
  const x = viewBox.x + viewBox.width + 4
  return (
    <g>
      <rect x={x} y={viewBox.y - 10} width={56} height={20} rx={2} fill={C.peach} />
      <text
        x={x + 28}
        y={viewBox.y + 4}
        textAnchor="middle"
        fill={C.ground}
        fontFamily={MONO}
        fontSize={12}
        fontWeight={600}
      >
        {value.toFixed(2)}
      </text>
    </g>
  )
}

// What appears when you hover over the chart.
interface TooltipPayloadItem {
  payload: { round: number; price: number; side?: 'buy' | 'sell'; quantity?: number }
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null
  // Prefer a trade dot over the price line when both are under the mouse.
  const point = (payload.find((item) => item.payload.side !== undefined) ?? payload[0]).payload
  const isTrade = point.side !== undefined
  return (
    <div className="rounded border border-line bg-raised px-3 py-2 text-sm">
      <p className="text-muted">Round {point.round}</p>
      {isTrade ? (
        <p>
          <span className={point.side === 'buy' ? 'text-teal' : 'text-pink'}>
            {point.side === 'buy' ? 'Bought' : 'Sold'}
          </span>{' '}
          <span className="font-mono">
            {point.quantity} @ {point.price.toFixed(2)}
          </span>
        </p>
      ) : (
        <p>
          Price <span className="font-mono">{point.price.toFixed(2)}</span>
        </p>
      )}
    </div>
  )
}
