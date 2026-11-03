import { useEffect, useState } from 'react'

import { waitForDefaults } from './api/client'
import type { GameSettings, GameState } from './api/types'

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
import { buttonOutline, buttonPrimary, iconButton, panel, panelFooter, panelHeader, panelTitle } from './styles'

// Trading-terminal layout:
//   header (logo, help, new game), then your position as a full-width row,
//   then a 2x2 grid:  price chart | order book
//                     your quote  | your trades
// On large screens everything fits on one screen and only the panels scroll
// inside; on smaller screens the four panels stack.
function App() {
  const { game, rounds, loading, error, newGame, quote } = useGame()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [defaults, setDefaults] = useState<GameSettings | null>(null) // from the backend
  const [settings, setSettings] = useState<GameSettings | null>(null) // last used, null = use the defaults
  const [waking, setWaking] = useState(false) // true while the (sleeping) backend starts up

  // The default settings live in the backend (market/config.py). Fetching them also tells
  // us the backend is awake; until then, show a "waking up" message.
  useEffect(() => {
    const controller = new AbortController()
    waitForDefaults(() => setWaking(true), controller.signal)
      .then((d) => {
        setDefaults(d)
        setWaking(false)
      })
      .catch(() => {}) // only happens when the page closes
    return () => controller.abort()
  }, [])

  async function startGame(newSettings: GameSettings) {
    setSettings(newSettings) // remember them for the next time the window opens
    setSettingsOpen(false)
    await newGame(newSettings)
  }

  return (
    <main className="flex min-h-screen flex-col lg:h-screen">
      <header className="flex items-center gap-4 border-b border-line px-4 py-3 sm:px-7">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <h1 className="text-lg leading-tight font-extrabold tracking-tight sm:text-xl">
              market <span className="text-peach">maker</span>
            </h1>
            <p className="hidden text-xs text-muted sm:block">Quote a bid and ask, earn the spread, manage your risk</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setHelpOpen(true)} aria-label="How to play" title="How to play" className={iconButton}>
            ?
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            disabled={loading || !defaults}
            title={defaults ? undefined : 'Waiting for the server…'}
            className={buttonOutline}
          >
            {game ? 'New game' : 'Start game'}
          </button>
        </div>
      </header>

      {game && <PositionPanel game={game} />}

      {waking && (
        <p className="mx-4 mt-4 rounded border border-line bg-raised px-3 py-2.5 text-sm text-fg-soft sm:mx-7">
          The server is waking up. This can take up to a minute the first time…
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mx-4 mt-4 rounded border border-error-line bg-error-tint px-3 py-2.5 text-sm text-error-text sm:mx-7"
        >
          {error}
        </p>
      )}

      {!game ? (
        <div className="flex flex-1 items-center justify-center p-6 text-center">
          <div>
            <p className="text-2xl font-extrabold">Ready to make a market?</p>
            <p className="mt-1.5 text-sm text-muted">Press “Start game” to begin.</p>
          </div>
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-[minmax(0,1fr)] gap-4 p-4 sm:px-7 lg:min-h-0 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* The market */}
          <div className="lg:min-h-0">
            <PriceChart game={game} rounds={rounds} />
          </div>
          <div className="lg:min-h-0">
            <OrderBookView rounds={rounds} />
          </div>

          {/* Market making */}
          <div className="lg:min-h-0 lg:overflow-y-auto">
            {game.done ? (
              <GameOver game={game} onPlayAgain={() => setSettingsOpen(true)} />
            ) : (
              <QuotePanel
                key={game.game_id} // a new game starts with a fresh quote
                price={game.price}
                round={game.round + 1}
                disabled={loading}
                onSubmit={quote}
              />
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

// Shown instead of the quote panel once the last round has been played.
function GameOver({ game, onPlayAgain }: { game: GameState; onPlayAgain: () => void }) {
  return (
    <section className={`${panel} h-full`}>
      <div className={panelHeader}>
        <h2 className={panelTitle}>Game over</h2>
      </div>
      <div className="flex flex-col gap-1 p-5">
        <p className="text-[13px] text-muted">Final profit &amp; loss</p>
        <p className={`font-mono text-5xl font-semibold ${toneClass(game.pnl)}`}>{signed(game.pnl)}</p>
        <p className="mt-3 text-sm text-fg-soft">Your remaining inventory was closed at the final price.</p>
      </div>
      <div className={panelFooter}>
        <button onClick={onPlayAgain} className={buttonPrimary}>
          Play again
        </button>
      </div>
    </section>
  )
}

export default App
