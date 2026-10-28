// TypeScript versions of the backend schemas (backend/app/schemas.py).
// They describe the shape of the JSON, so the editor can autocomplete fields
// and warn you when you use a field that does not exist.
// If you change a schema in the backend, change it here too.

export type Side = 'buy' | 'sell'

// ----- Requests: what we send -----------------------------------------------

export interface GBMParams {
  s0?: number // starting price
  mu?: number // annual drift
  sigma?: number // annual volatility
}

export interface TraderParams {
  arrival_rate?: number // average number of traders per round
  informed_fraction?: number // share of informed traders (0 to 1)
  mean_order_size?: number // average trader order size
}

// All fields are optional: the backend fills in defaults.
export interface NewGameRequest {
  market?: GBMParams
  traders?: TraderParams
  n_rounds?: number
  max_inventory?: number
  seed?: number | null
}

// A complete set of settings, as returned by GET /api/game/defaults.
export interface GameSettings {
  market: Required<GBMParams>
  traders: Required<TraderParams>
  n_rounds: number
  max_inventory: number
  seed: number | null
}

export interface QuoteRequest {
  bid: number
  ask: number
  bid_size: number
  ask_size: number
}

// ----- Responses: what we get back -------------------------------------------

export interface TraderOrder {
  side: Side // from the trader's point of view
  quantity: number
  limit_price: number // the worst price the trader accepted (their valuation, on the tick grid)
  informed: boolean
  filled: number // how many units of this order traded with you
}

export interface Trade {
  side: Side // from the player's point of view: 'buy' = you bought
  price: number
  quantity: number
  informed: boolean
}

export interface GameState {
  round: number
  n_rounds: number
  max_inventory: number
  price: number
  price_history: number[]
  cash: number
  inventory: number
  pnl: number
  done: boolean
}

export interface RoundResult {
  round: number
  price: number
  quote: QuoteRequest // your quote as placed in the book (sizes after the inventory cap)
  n_traders: number // traders that arrived, including those who did not want to trade
  trader_orders: TraderOrder[]
  trades: Trade[]
  cash: number
  inventory: number
  pnl: number
  done: boolean
}
