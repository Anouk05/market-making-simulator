// A pop-up window where the player chooses the game settings before starting.
//
// The backend expects drift, volatility and the informed share as fractions
// (0.20), but people think in percentages (20%), so the form uses percentages
// and converts them when you press "Start game".

import { useEffect, useState } from 'react'

import type { GameSettings } from '../api/types'

import { InfoTooltip } from './InfoTooltip'

// The parent only renders this component while the window is open, so every
// time it opens the form starts fresh from `initial`.
interface SettingsDialogProps {
  initial: GameSettings // the values to show when the window opens
  defaults: GameSettings // used by "Reset to defaults"
  onStart: (settings: GameSettings) => void
  onClose: () => void
}

// The form keeps every field as text, so the player can type freely.
type Form = Record<FieldName, string>
type FieldName =
  | 's0'
  | 'mu'
  | 'sigma'
  | 'arrival_rate'
  | 'informed_fraction'
  | 'mean_order_size'
  | 'n_rounds'
  | 'max_inventory'
  | 'seed'

function toForm(s: GameSettings): Form {
  return {
    s0: String(s.market.s0),
    mu: String(round(s.market.mu * 100)),
    sigma: String(round(s.market.sigma * 100)),
    arrival_rate: String(s.traders.arrival_rate),
    informed_fraction: String(round(s.traders.informed_fraction * 100)),
    mean_order_size: String(s.traders.mean_order_size),
    n_rounds: String(s.n_rounds),
    max_inventory: String(s.max_inventory),
    seed: s.seed == null ? '' : String(s.seed),
  }
}

function fromForm(f: Form): GameSettings {
  return {
    market: { s0: Number(f.s0), mu: Number(f.mu) / 100, sigma: Number(f.sigma) / 100 },
    traders: {
      arrival_rate: Number(f.arrival_rate),
      informed_fraction: Number(f.informed_fraction) / 100,
      mean_order_size: Number(f.mean_order_size),
    },
    n_rounds: Number(f.n_rounds),
    max_inventory: Number(f.max_inventory),
    seed: f.seed.trim() === '' ? null : Number(f.seed),
  }
}

const round = (x: number) => Math.round(x * 1e6) / 1e6 // avoids 0.07 * 100 = 7.000000000000001

export function SettingsDialog({ initial, defaults, onStart, onClose }: SettingsDialogProps) {
  const [form, setForm] = useState<Form>(() => toForm(initial))

  // Close with the Escape key.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = (name: FieldName) => (value: string) => setForm((f) => ({ ...f, [name]: value }))
  const isComplete = Object.entries(form).every(
    ([name, v]) => (name === 'seed' && v.trim() === '') || (v.trim() !== '' && !Number.isNaN(Number(v))),
  )

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (isComplete) onStart(fromForm(form))
  }

  return (
    // The dark backdrop; clicking it closes the window.
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()} // clicks inside the window should not close it
        className="max-h-full w-full max-w-3xl space-y-6 overflow-y-auto rounded-xl bg-slate-900 p-8 shadow-xl ring-1 ring-slate-700"
      >
        <h2 className="text-lg font-semibold">Game settings</h2>

        <Group title="Price process (geometric Brownian motion)">
          <Field label="Start price" info="Initial price of the stock." value={form.s0} onChange={set('s0')} step="1" />
          <Field
            label="Drift (% per year)"
            info="Annual drift of the geometric Brownian motion that drives the price."
            value={form.mu}
            onChange={set('mu')}
            step="0.1"
          />
          <Field
            label="Volatility (% per year)"
            info="Annual volatility of the price."
            value={form.sigma}
            onChange={set('sigma')}
            step="0.1"
          />
        </Group>

        <Group title="Traders">
          <Field
            label="Arrival rate"
            info="The number of traders per round is Poisson distributed with this mean. A trader only sends an order if their valuation lies outside your bid–ask spread."
            value={form.arrival_rate}
            onChange={set('arrival_rate')}
            step="1"
          />
          <Field
            label="Informed share (%)"
            info="Probability that a trader is informed. Informed traders value the stock at next round's price plus small normal noise; uninformed (noisy) traders at the current price plus larger normal noise."
            value={form.informed_fraction}
            onChange={set('informed_fraction')}
            step="1"
          />
          <Field
            label="Average order size"
            info="Expected order size. The size is one plus a Poisson distributed number, so every order is at least one unit."
            value={form.mean_order_size}
            onChange={set('mean_order_size')}
            step="1"
          />
        </Group>

        <Group title="Game">
          <Field
            label="Rounds"
            value={form.n_rounds}
            info="Number of rounds in the game. Remaining inventory is liquidated at the final price."
            onChange={set('n_rounds')}
            step="1"
          />
          <Field
            label="Inventory limit (±)"
            info="Maximum absolute position. Quote sizes are capped so your inventory stays within this limit."
            value={form.max_inventory}
            onChange={set('max_inventory')}
            step="1"
          />
          <Field
            label="Seed (optional)"
            info="Seed of the random number generator. The same seed gives the same price path and order flow. Leave empty for a random game."
            value={form.seed}
            onChange={set('seed')}
            step="1"
            placeholder="random"
          />
        </Group>

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => setForm(toForm(defaults))}
            className="text-sm text-slate-400 hover:text-slate-200"
          >
            Reset to defaults
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isComplete}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium hover:bg-indigo-400 disabled:opacity-40"
            >
              Start game
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">{title}</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{children}</div>
    </fieldset>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  step: string
  placeholder?: string
  info?: string
}

function Field({ label, value, onChange, step, placeholder, info }: FieldProps) {
  return (
    <label className="block space-y-1">
      <span className="flex items-center gap-1.5 text-sm text-slate-300">
        {label}
        {info && <InfoTooltip text={info} />}
      </span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md bg-slate-800 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </label>
  )
}
