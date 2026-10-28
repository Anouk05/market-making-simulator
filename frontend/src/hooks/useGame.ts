// The game logic of the frontend, in one custom hook.
//
// A hook is a function whose name starts with "use" and that can hold React
// state. Components call useGame() and get back the current game data plus
// functions to change it. Whenever the state changes, React redraws every
// component that uses it.

import { useEffect, useState } from 'react'

import { ApiError, getGame, startGame, submitQuote } from '../api/client'
import type { GameState, NewGameRequest, QuoteRequest, RoundResult } from '../api/types'

export function useGame() {
  const [game, setGame] = useState<GameState | null>(null) // null = no game started yet
  const [rounds, setRounds] = useState<RoundResult[]>([]) // every round played so far, oldest first
  const [loading, setLoading] = useState(false) // true while waiting for the backend
  const [error, setError] = useState<string | null>(null) // message to show the player

  // When the page opens, pick up a game that is still running on the backend
  // (e.g. after a page refresh). The trade history of earlier rounds is not
  // stored on the backend, so only the state and price history come back.
  useEffect(() => {
    getGame()
      .then(setGame)
      .catch(() => setGame(null)) // 404: no game yet, that's fine
  }, [])

  async function newGame(settings: NewGameRequest = {}) {
    await run(async () => {
      const state = await startGame(settings)
      setGame(state)
      setRounds([])
    })
  }

  async function quote(q: QuoteRequest) {
    if (!game || game.done) return
    await run(async () => {
      const result = await submitQuote(q)
      setRounds((previous) => [...previous, result])
      setGame(
        (previous) =>
          previous && {
            ...previous,
            round: result.round,
            price: result.price,
            price_history: [...previous.price_history, result.price],
            cash: result.cash,
            inventory: result.inventory,
            pnl: result.pnl,
            done: result.done,
          },
      )
    })
  }

  // Shared wrapper: ignores clicks while a request is running, shows errors,
  // and switches the loading flag on and off.
  async function run(action: () => Promise<void>) {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      await action()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not reach the backend. Is it running?')
    } finally {
      setLoading(false)
    }
  }

  return {
    game,
    rounds,
    loading,
    error,
    newGame,
    quote,
  }
}
