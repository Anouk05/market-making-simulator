// The form where the player enters a bid and ask (with sizes) and submits them.
// Below the inputs, a small ruler shows the quote around the current price.
// It does not call the backend itself: it hands the quote to onSubmit().

import { useEffect, useRef, useState } from 'react'

import type { QuoteRequest } from '../api/types'
import { num, parseNumber } from '../format'
import { buttonPrimary, panel, panelFooter, panelHeader, panelTitle, underlineInput } from '../styles'
import { InfoTooltip } from './InfoTooltip'

interface QuotePanelProps {
  price: number // current price, used to pre-fill and re-centre the quote
  round: number // the round this quote is for
  disabled: boolean // true while waiting for the backend
  onSubmit: (quote: QuoteRequest) => void
}

// A price as text with two decimals, e.g. 100.5 -> "100.50".
const price2 = (x: number) => (Math.round(x * 100) / 100).toFixed(2)

const QUOTE_INFO = 'The prices and sizes at which you are willing to buy (bid) and sell (ask) this round.'

export function QuotePanel({ price, round, disabled, onSubmit }: QuotePanelProps) {
  // Inputs are kept as text, so the player can type freely (e.g. "99." halfway).
  const [bid, setBid] = useState(price2(price - 0.5))
  const [ask, setAsk] = useState(price2(price + 0.5))
  const [bidSize, setBidSize] = useState('5')
  const [askSize, setAskSize] = useState('5')

  // When the price moves, move the quote along with it: the distance between
  // your bid/ask and the price (including any skew) stays the same.
  const previousPrice = useRef(price)
  useEffect(() => {
    const move = price - previousPrice.current
    previousPrice.current = price
    if (move === 0) return
    setBid((b) => price2(parseNumber(b) + move))
    setAsk((a) => price2(parseNumber(a) + move))
  }, [price])

  const quote: QuoteRequest = {
    bid: parseNumber(bid),
    ask: parseNumber(ask),
    bid_size: parseNumber(bidSize),
    ask_size: parseNumber(askSize),
  }
  const isComplete = Object.values(quote).every((v) => !Number.isNaN(v))

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault() // stop the browser from reloading the page
    if (isComplete) onSubmit(quote)
  }

  return (
    <form onSubmit={handleSubmit} className={`${panel} h-full`}>
      <div className={panelHeader}>
        <h2 className={panelTitle}>
          Your quote
          <InfoTooltip text={QUOTE_INFO} />
        </h2>
        <span className="text-[13px] text-muted">
          for round <span className="font-mono">{round}</span>
        </span>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-10 gap-y-5 px-5 pt-4 pb-2">
        <Side label="Bid" tone="teal" price={bid} onPrice={setBid} size={bidSize} onSize={setBidSize} />
        <Side label="Ask" tone="pink" price={ask} onPrice={setAsk} size={askSize} onSize={setAskSize} />
      </div>

      {isComplete && (
        <div className="px-5 pt-4">
          <QuoteRuler bid={quote.bid} ask={quote.ask} price={price} />
        </div>
      )}

      <div className={panelFooter}>
        <button type="submit" disabled={disabled || !isComplete} className={`${buttonPrimary} pr-2.5`}>
          Submit quote
          <span className="rounded-[3px] border border-peach-line px-1.5 py-0.5 font-mono text-[11px] font-normal text-[#c9b39e]">
            Enter
          </span>
        </button>
      </div>
    </form>
  )
}

// One side of the quote: a large price field with a small size field next to it.
interface SideProps {
  label: string
  tone: 'teal' | 'pink'
  price: string
  onPrice: (value: string) => void
  size: string
  onSize: (value: string) => void
}

function Side({ label, tone, price, onPrice, size, onSize }: SideProps) {
  const id = label.toLowerCase()
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={`${id}-price`}
        className={`text-[13px] font-semibold ${tone === 'teal' ? 'text-teal' : 'text-pink'}`}
      >
        {label}
      </label>
      <div className="flex items-end gap-4">
        <input
          id={`${id}-price`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={price}
          onChange={(e) => onPrice(e.target.value)}
          className={`${underlineInput} h-12 flex-1 border-b-2 text-[26px] ${tone === 'teal' ? 'border-teal' : 'border-pink'}`}
        />
        <label className="flex w-[72px] flex-col gap-0.5 text-xs text-muted">
          Size
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            aria-label={`${label} size`}
            value={size}
            onChange={(e) => onSize(e.target.value)}
            className={`${underlineInput} h-9 border-b border-line text-lg`}
          />
        </label>
      </div>
    </div>
  )
}

// A ruler with the current price (peach dot) in the middle and your bid and ask around it.
// The labels are normal HTML text, so they keep their size however wide the panel is.
function QuoteRuler({ bid, ask, price }: { bid: number; ask: number; price: number }) {
  // Keep the price in the centre and leave some room on both sides.
  const half = Math.max(Math.abs(bid - price), Math.abs(ask - price), 0.05) * 1.6
  const pct = (p: number) => 5 + ((p - (price - half)) / (2 * half)) * 90 // position in % of the width
  const spread = ask - bid
  const valid = spread > 0
  const [from, to] = [Math.min(pct(bid), pct(ask)), Math.max(pct(bid), pct(ask))]

  return (
    <div
      role="img"
      aria-label={`Your bid ${bid.toFixed(2)} and ask ${ask.toFixed(2)} around the current price ${price.toFixed(2)}, spread ${spread.toFixed(2)}`}
      className="mx-auto w-full max-w-[560px]"
    >
      <div className="relative h-5">
        <span className="absolute -translate-x-1/2 font-mono text-[13px] text-peach" style={{ left: `${pct(price)}%` }}>
          {price.toFixed(2)}
        </span>
      </div>
      <div className="relative h-8">
        <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-[#23454f]" />
        <span
          className={`absolute top-1/2 h-3.5 -translate-y-1/2 rounded-sm ${valid ? 'bg-peach-tint' : 'bg-error-tint'}`}
          style={{ left: `${from}%`, width: `${to - from}%` }}
        />
        <span className="absolute top-0 h-8 w-1 -translate-x-1/2 rounded-sm bg-teal" style={{ left: `${pct(bid)}%` }} />
        <span className="absolute top-0 h-8 w-1 -translate-x-1/2 rounded-sm bg-pink" style={{ left: `${pct(ask)}%` }} />
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-peach"
          style={{ left: `${pct(price)}%` }}
        />
      </div>
      <p className="mt-2 text-center text-sm text-muted">
        Spread{' '}
        <span className={`font-mono text-lg font-semibold ${valid ? 'text-fg' : 'text-pink'}`}>{num(spread)}</span>
      </p>
    </div>
  )
}
