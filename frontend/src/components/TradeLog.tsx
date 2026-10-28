// A table of all the player's trades, newest first, with the markout of each.
//
// Markout = how much a trade gained or lost once the price had moved:
//   bought q at p, price afterwards P  ->  (P - p) * q
//   sold   q at p, price afterwards P  ->  (p - P) * q
// Trades against uninformed traders usually have a positive markout (you earn
// the spread); trades against informed traders usually a negative one (you
// were picked off).

import type { RoundResult } from '../api/types'
import { signed, toneClass } from '../format'
import { InfoTooltip } from './InfoTooltip'

interface TradeLogProps {
  rounds: RoundResult[]
}

interface Row {
  round: number
  side: 'buy' | 'sell'
  quantity: number
  price: number
  informed: boolean
  priceAfter: number
  markout: number
}

const TRADES_INFO =
  'Overview of your filled trades. The markout of a trade is its profit measured at the price after that round. Your PnL also includes the gains and losses on the inventory you keep.'

export function TradeLog({ rounds }: TradeLogProps) {
  const rows: Row[] = rounds.flatMap((r) =>
    r.trades.map((t) => {
      const direction = t.side === 'buy' ? 1 : -1
      return {
        round: r.round,
        side: t.side,
        quantity: t.quantity,
        price: t.price,
        informed: t.informed,
        priceAfter: r.price, // the price revealed at the end of that round
        markout: direction * (r.price - t.price) * t.quantity,
      }
    }),
  )

  const total = (filter: (row: Row) => boolean) => rows.filter(filter).reduce((sum, row) => sum + row.markout, 0)
  const volume = rows.reduce((sum, row) => sum + row.quantity, 0)

  return (
    <section className="flex h-full flex-col gap-3 rounded-xl bg-slate-900 p-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        Trades
        <InfoTooltip text={TRADES_INFO} />
      </h2>

      <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Stat label="Volume" sublabel="shares traded" value={String(volume)} />
        <Stat label="Markout" sublabel="total" value={signed(total(() => true))} tone={total(() => true)} />
        <Stat
          label="Markout"
          sublabel="vs. uninformed"
          value={signed(total((r) => !r.informed))}
          tone={total((r) => !r.informed)}
        />
        <Stat
          label="Markout"
          sublabel="vs. informed"
          value={signed(total((r) => r.informed))}
          tone={total((r) => r.informed)}
        />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">No trades yet.</p>
      ) : (
        <div className="max-h-80 overflow-auto lg:max-h-none lg:min-h-0 lg:flex-1">
          <table className="w-full min-w-[28rem] text-sm tabular-nums [&_td]:px-1.5 [&_th]:px-1.5">
            <thead className="sticky top-0 bg-slate-900 text-left text-slate-400">
              <tr>
                <th className="py-2 font-normal">Round</th>
                <th className="font-normal">Side</th>
                <th className="text-right font-normal">Qty</th>
                <th className="text-right font-normal">Price</th>
                <th className="text-right font-normal">Price after</th>
                <th className="pl-4 font-normal">Counterparty</th>
                <th className="text-right font-normal">Markout</th>
              </tr>
            </thead>
            <tbody>
              {[...rows].reverse().map((row, i) => (
                <tr key={i} className="border-t border-slate-800">
                  <td className="py-1.5">{row.round}</td>
                  <td className={row.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'}>
                    {row.side === 'buy' ? 'Bought' : 'Sold'}
                  </td>
                  <td className="text-right">{row.quantity}</td>
                  <td className="text-right">{row.price.toFixed(2)}</td>
                  <td className="text-right text-slate-400">{row.priceAfter.toFixed(2)}</td>
                  <td className="pl-4">
                    {row.informed ? (
                      <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-amber-400">informed</span>
                    ) : (
                      <span className="text-slate-400">uninformed</span>
                    )}
                  </td>
                  <td className={`text-right ${toneClass(row.markout)}`}>{signed(row.markout)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

interface StatProps {
  label: string
  sublabel: string // second line under the label, e.g. "total"
  value: string
  tone?: number
}

function Stat({ label, sublabel, value, tone = 0 }: StatProps) {
  return (
    <div className="flex flex-col rounded-lg bg-slate-800/60 px-2.5 py-2">
      <p className="text-sm font-medium text-slate-200">{label}</p>
      <p className="text-sm leading-tight text-slate-400">{sublabel}</p>
      {/* mt-auto pushes the number to the bottom, so the numbers line up even if a label wraps */}
      <p className={`mt-auto pt-1 text-lg font-semibold tabular-nums ${toneClass(tone)}`}>{value}</p>
    </div>
  )
}
