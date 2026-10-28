// The form where the player enters a bid and ask (with sizes) and submits them.
//
// Props are the inputs a component receives from its parent, like function
// arguments. This component does not talk to the backend itself: it calls
// onSubmit() and lets the parent (App) decide what to do with the quote.

import { useEffect, useRef, useState } from 'react'

import type { QuoteRequest } from '../api/types'
import { InfoTooltip } from './InfoTooltip'

interface QuotePanelProps {
  price: number // current price, used to pre-fill and re-centre the quote
  disabled: boolean // true while waiting for the backend or when the game is over
  onSubmit: (quote: QuoteRequest) => void
}

const round2 = (x: number) => Math.round(x * 100) / 100

const QUOTE_INFO = 'The prices and sizes at which you are willing to buy (bid) and sell (ask) this round.'

export function QuotePanel({ price, disabled, onSubmit }: QuotePanelProps) {
  // Inputs are kept as text, so the player can type freely (e.g. "99." halfway).
  const [bid, setBid] = useState(String(round2(price - 0.5)))
  const [ask, setAsk] = useState(String(round2(price + 0.5)))
  const [bidSize, setBidSize] = useState('5')
  const [askSize, setAskSize] = useState('5')

  // When the price moves, move the quote along with it: the distance between
  // your bid/ask and the price (including any skew) stays the same.
  const previousPrice = useRef(price)
  useEffect(() => {
    const move = price - previousPrice.current
    previousPrice.current = price
    if (move === 0) return
    setBid((b) => String(round2(Number(b) + move)))
    setAsk((a) => String(round2(Number(a) + move)))
  }, [price])

  const quote: QuoteRequest = {
    bid: Number(bid),
    ask: Number(ask),
    bid_size: Number(bidSize),
    ask_size: Number(askSize),
  }
  const isComplete = [bid, ask, bidSize, askSize].every((v) => v.trim() !== '' && !Number.isNaN(Number(v)))
  const spread = quote.ask - quote.bid

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault() // stop the browser from reloading the page
    if (isComplete) onSubmit(quote)
  }

  return (
    <form onSubmit={handleSubmit} className="h-full rounded-xl bg-slate-900 p-4 space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        Your quote
        <InfoTooltip text={QUOTE_INFO} />
      </h2>

      {/* Small screens: prices on the first row, sizes below.
          Large screens: one row in order-book order: bid size | bid | ask | ask size. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Field
          label="Bid price"
          value={bid}
          onChange={setBid}
          step="0.01"
          accent="text-emerald-400"
          className="lg:order-2"
        />
        <Field
          label="Ask price"
          value={ask}
          onChange={setAsk}
          step="0.01"
          accent="text-rose-400"
          className="lg:order-3"
        />
        <Field label="Bid size" value={bidSize} onChange={setBidSize} step="1" min="0" className="lg:order-1" />
        <Field label="Ask size" value={askSize} onChange={setAskSize} step="1" min="0" className="lg:order-4" />
      </div>

      <p className="text-sm text-slate-400">
        Spread: {isComplete ? spread.toFixed(2) : '–'} · Mid:{' '}
        {isComplete ? ((quote.bid + quote.ask) / 2).toFixed(2) : '–'}
      </p>

      <button
        type="submit"
        disabled={disabled || !isComplete}
        className="w-full rounded-lg bg-indigo-500 py-2 font-medium hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Submit quote
      </button>
    </form>
  )
}

// A small labelled number input, used four times above.
interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  step: string
  min?: string
  accent?: string // Tailwind text colour for the label
  className?: string // extra classes, e.g. to change the position in the grid
}

function Field({ label, value, onChange, step, min, accent = 'text-slate-300', className = '' }: FieldProps) {
  return (
    <label className={`block space-y-1 ${className}`}>
      <span className={`text-sm ${accent}`}>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        step={step}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </label>
  )
}
