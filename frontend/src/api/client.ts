// Functions that call the backend. Components use these instead of calling
// fetch() themselves, so all knowledge about URLs lives in this one file.

import type { GameSettings, GameState, NewGameRequest, QuoteRequest, RoundResult } from './types'

// An error with the message the backend sent (e.g. "Bid must be lower than ask.").
export class ApiError extends Error {}

// Sends a request and returns the parsed JSON, or throws an ApiError.
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) {
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

export function getGame(): Promise<GameState> {
  return request<GameState>('/api/game')
}

export function submitQuote(quote: QuoteRequest): Promise<RoundResult> {
  return request<RoundResult>('/api/game/quote', { method: 'POST', body: JSON.stringify(quote) })
}
