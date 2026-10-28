import { useEffect, useState } from 'react'

import { getDefaults } from './api/client'
import type { GameSettings } from './api/types'

import { HelpDialog } from './components/HelpDialog'
import { Logo } from './components/Logo'
import { OrderBookView } from './components/OrderBookView'
import { PositionPanel } from './components/PositionPanel'
import { PriceChart } from './components/PriceChart'
import { QuotePanel } from './components/QuotePanel'
import { SettingsDialog } from './components/SettingsDialog'
import { TradeLog } from './components/TradeLog'
import { signed, toneClass } from './format'
import { useGame } from './hooks/useGame'

// Trading-terminal layout as a 2x2 grid:
//   top row (the market):        price chart   | order book
//   bottom row (market making):  your quote    | your trades
// On large screens everything fits on one screen and only the panels scroll
// inside; on smaller screens the four panels stack.
function App() {
  const { game, rounds, loading, error, newGame, quote } = useGame()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [defaults, setDefaults] = useState<GameSettings | null>(null) // from the backend
  const [settings, setSettings] = useState<GameSettings | null>(null) // last used, null = use the defaults

  // The default settings live in the backend (market/config.py); fetch them once.
  useEffect(() => {
    getDefaults()
      .then(setDefaults)
      .catch(() => setDefaults(null))
  }, [])

  async function startGame(newSettings: GameSettings) {
    setSettings(newSettings) // remember them for the next time the window opens
    setSettingsOpen(false)
    await newGame(newSettings)
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-slate-100 lg:h-screen">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-slate-800 bg-slate-900/40 px-6 py-3">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="font-semibold leading-tight">Market-Making Simulator</h1>
            <p className="hidden text-xs text-slate-400 sm:block">
              Quote a bid and ask, earn the spread, manage your risk
            </p>
          </div>
        </div>

        {/* Small screens: full-width row below the title. Large screens: centred between title and button. */}
        <div className="order-last w-full lg:order-none lg:flex lg:w-auto lg:flex-1 lg:justify-center">
          {game && <PositionPanel game={game} />}
        </div>

        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          <button
            onClick={() => setHelpOpen(true)}
            aria-label="How to play"
            title="How to play"
            className="grid h-9 w-9 place-items-center rounded-full border border-slate-600 text-base font-semibold text-slate-300 hover:border-slate-400 hover:text-white"
          >
            ?
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            disabled={loading || !defaults}
            title={defaults ? undefined : 'Waiting for the backend…'}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium hover:bg-indigo-400 disabled:opacity-40"
          >
            {game ? 'New game' : 'Start game'}
          </button>
        </div>
      </header>

      {error && <p className="mx-4 mt-4 rounded-lg bg-rose-950 px-4 py-2 text-rose-300">{error}</p>}

      {!game ? (
        <div className="flex flex-1 items-center justify-center text-slate-400">Press "Start game" to begin.</div>
      ) : (
        <div className="grid flex-1 grid-cols-[minmax(0,1fr)] gap-4 p-4 lg:min-h-0 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:grid-rows-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* The market */}
          <div className="lg:min-h-0">
            <PriceChart game={game} rounds={rounds} />
          </div>
          <div className="lg:min-h-0 lg:overflow-y-auto">
            <OrderBookView rounds={rounds} />
          </div>

          {/* Market making */}
          <div className="lg:min-h-0 lg:overflow-y-auto">
            {game.done ? (
              <div className="h-full rounded-xl bg-slate-900 p-4">
                <p className="text-slate-400">Game over</p>
                <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass(game.pnl)}`}>{signed(game.pnl)}</p>
                <p className="mt-2 text-sm text-slate-400">Press "New game" to play again.</p>
              </div>
            ) : (
              <QuotePanel price={game.price} disabled={loading} onSubmit={quote} />
            )}
          </div>
          <div className="lg:min-h-0">
            <TradeLog rounds={rounds} />
          </div>
        </div>
      )}

      {settingsOpen && defaults && (
        <SettingsDialog
          initial={settings ?? defaults}
          defaults={defaults}
          onStart={startGame}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {helpOpen && <HelpDialog onClose={() => setHelpOpen(false)} />}
    </main>
  )
}

export default App
