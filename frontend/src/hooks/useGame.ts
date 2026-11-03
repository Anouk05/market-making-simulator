// The game state of the frontend in one hook: the current game, the rounds
// played so far, and the actions to start a game and submit a quote.

import { useEffect, useState } from 'react'

import { ApiError, GameNotFoundError, getGame, startGame, submitQuote } from '../api/client'
import type { GameState, NewGameRequest, QuoteRequest, RoundResult } from '../api/types'

// The ID of the current game is kept in the browser (localStorage), so a page refresh
// continues the same game. Storage can be unavailable (e.g. private mode), hence try/catch.
const STORAGE_KEY = 'mms-game-id'

function loadGameId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function saveGameId(gameId: string | null) {
  try {
    if (gameId) localStorage.setItem(STORAGE_KEY, gameId)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // not stored: a refresh simply starts without a game
  }
}

export function useGame() {
  const [game, setGame] = useState<GameState | null>(null) // null = no game started yet
  const [rounds, setRounds] = useState<RoundResult[]>([]) // every round played so far, oldest first
  const [loading, setLoading] = useState(false) // true while waiting for the backend
  const [error, setError] = useState<string | null>(null) // message to show the player

  // When the page opens, pick up the game this browser was playing (e.g. after a page
  // refresh). The trade history of earlier rounds is not stored on the backend, so only
  // the state and price history come back.
  useEffect(() => {
    const gameId = loadGameId()
    if (!gameId) return
    getGame(gameId)
      .then(setGame)
      .catch(() => saveGameId(null)) // the game no longer exists (or the backend is unreachable)
  }, [])

  async function newGame(settings: NewGameRequest = {}) {
    await run(async () => {
      const state = await startGame(settings)
      saveGameId(state.game_id)
      setGame(state)
      setRounds([])
    })
  }

  async function quote(q: QuoteRequest) {
    if (!game || game.done) return
    await run(async () => {
      const result = await submitQuote(game.game_id, q)
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
      if (e instanceof GameNotFoundError) {
        saveGameId(null) // forget the game, so the player sees the start screen again
        setGame(null)
        setRounds([])
      }
      setError(e instanceof ApiError ? e.message : 'Could not reach the server. Please try again in a moment.')
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
