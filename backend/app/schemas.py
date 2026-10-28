"""The shape of the JSON messages between the frontend and the backend.

Pydantic checks every incoming message against these models. If a field has
the wrong type or is out of range, FastAPI answers with an error (status 422)
before our code runs.

The frontend fetches the default values through `GET /api/game/defaults`.
"""

from pydantic import BaseModel, ConfigDict, Field

from market.config import GBMConfig, SessionConfig, TraderConfig
from market.datatypes import Quote, Side

_GBM = GBMConfig()
_TRADERS = TraderConfig()
_SESSION = SessionConfig()


# ----- Requests: what the frontend sends ------------------------------------


class GBMParams(BaseModel):
    s0: float = Field(default=_GBM.s0, gt=0, description="Starting price")
    mu: float = Field(default=_GBM.mu, ge=-1, le=1, description="Annual drift")
    sigma: float = Field(default=_GBM.sigma, gt=0, le=2, description="Annual volatility")


class TraderParams(BaseModel):
    arrival_rate: float = Field(
        default=_TRADERS.arrival_rate, ge=0, le=50, description="Average number of traders per round"
    )
    informed_fraction: float = Field(
        default=_TRADERS.informed_fraction, ge=0, le=1, description="Share of informed traders"
    )
    mean_order_size: float = Field(
        default=_TRADERS.mean_order_size, ge=1, le=100, description="Average trader order size"
    )


class NewGameRequest(BaseModel):
    market: GBMParams = Field(default_factory=GBMParams)
    traders: TraderParams = Field(default_factory=TraderParams)
    n_rounds: int = Field(default=_SESSION.n_rounds, ge=1, le=500)
    max_inventory: int = Field(default=_SESSION.max_inventory, ge=1, le=10_000)
    seed: int | None = _SESSION.seed

    def to_config(self) -> SessionConfig:
        """Translate the validated request into the engine's settings."""
        return SessionConfig(
            market=GBMConfig(**self.market.model_dump()),
            traders=TraderConfig(**self.traders.model_dump()),
            n_rounds=self.n_rounds,
            max_inventory=self.max_inventory,
            seed=self.seed,
        )


class QuoteRequest(BaseModel):
    bid: float = Field(gt=0)
    ask: float = Field(gt=0)
    bid_size: int = Field(default=1, ge=0, le=10_000)
    ask_size: int = Field(default=1, ge=0, le=10_000)

    def to_quote(self) -> Quote:
        return Quote(**self.model_dump())


# ----- Responses: what the backend sends back -------------------------------
# `from_attributes=True` lets Pydantic read the fields straight from our
# dataclasses, e.g. RoundOut.model_validate(round_result).


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    side: Side
    quantity: int
    limit_price: float
    informed: bool
    filled: int


class QuoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    bid: float
    ask: float
    bid_size: int
    ask_size: int


class TradeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    side: Side
    price: float
    quantity: int
    informed: bool


class GameStateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    round: int
    n_rounds: int
    max_inventory: int
    price: float
    price_history: list[float]
    cash: float
    inventory: int
    pnl: float
    done: bool


class RoundOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    round: int
    price: float
    quote: QuoteOut
    n_traders: int
    trader_orders: list[OrderOut]
    trades: list[TradeOut]
    cash: float
    inventory: int
    pnl: float
    done: bool
