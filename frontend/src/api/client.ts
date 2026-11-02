// Functions that call the backend. Components use these instead of calling
// fetch() themselves, so all knowledge about URLs lives in this one file.

import type { GameSettings, GameState, NewGameRequest, QuoteRequest, RoundResult } from './types'

// An error with the message the backend sent (e.g. "Bid must be lower than ask.").
export class ApiError extends Error {}

// The backend does not know the game (e.g. it was removed after an hour without play,
// or the server restarted). The player has to start a new game.
export class GameNotFoundError extends ApiError {}

// Sends a request and returns the parsed JSON, or throws an ApiError.
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 404) throw new GameNotFoundError(errorMessage(body) ?? 'Game not found.')
    throw new ApiError(errorMessage(body) ?? `Request failed (${response.status})`)
  }
  return body as T
}

// FastAPI sends errors as {"detail": "..."} or, for validation errors,
// {"detail": [{"loc": [...], "msg": "..."}]}. Turn both into one readable string.
function errorMessage(body: unknown): string | undefined {
  const detail = (body as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((d: { loc?: unknown[]; msg?: string }) => `${d.loc?.slice(1).join('.')}: ${d.msg}`).join('; ')
  }
  return undefined
}

// ----- The game endpoints --------------------------------------------------------

export function getDefaults(): Promise<GameSettings> {
  return request<GameSettings>('/api/game/defaults')
}

export function startGame(settings: NewGameRequest = {}): Promise<GameState> {
  return request<GameState>('/api/game', { method: 'POST', body: JSON.stringify(settings) })
}

export function getGame(gameId: string): Promise<GameState> {
  return request<GameState>(`/api/game/${gameId}`)
}

export function submitQuote(gameId: string, quote: QuoteRequest): Promise<RoundResult> {
  return request<RoundResult>(`/api/game/${gameId}/quote`, { method: 'POST', body: JSON.stringify(quote) })
}

// Waits until the backend answers, by asking for the default settings every few seconds.
// On Render's free plan the backend sleeps after 15 minutes without visitors and needs
// up to a minute to wake up; onSlow is called once when the first attempt fails or is slow.
export async function waitForDefaults(onSlow: () => void, signal: AbortSignal): Promise<GameSettings> {
  const slowTimer = setTimeout(onSlow, 3000)
  try {
    while (!signal.aborted) {
      try {
        return await getDefaults()
      } catch {
        onSlow()
        await new Promise((resolve) => setTimeout(resolve, 3000))
      }
    }
    throw new DOMException('Aborted', 'AbortError')
  } finally {
    clearTimeout(slowTimer)
  }
}
