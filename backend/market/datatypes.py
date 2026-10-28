"""Small data types that are passed between the parts of the market."""

from dataclasses import dataclass
from enum import Enum


class Side(str, Enum):
    BUY = "buy"
    SELL = "sell"


@dataclass(frozen=True)
class Quote:
    """The player's two-sided market: buy up to `bid_size` at `bid`, sell up to `ask_size` at `ask`.

    A size of 0 means the player does not quote that side.
    """

    bid: float
    ask: float
    bid_size: int = 1
    ask_size: int = 1

    def validate(self) -> None:
        if self.bid_size < 0 or self.ask_size < 0:
            raise ValueError("Sizes cannot be negative.")
        if self.bid_size > 0 and self.bid <= 0:
            raise ValueError("Bid must be positive.")
        if self.bid_size > 0 and self.ask_size > 0 and self.bid >= self.ask:
            raise ValueError("Bid must be lower than ask.")


@dataclass(frozen=True)
class Order:
    """An order sent by a simulated trader.

    `side` is from the trader's point of view: BUY means the trader wants to buy.
    `limit_price` is the worst price the trader accepts (their valuation).
    """

    side: Side
    quantity: int
    limit_price: float
    informed: bool = False  # True if the trader knows (roughly) the next price


@dataclass(frozen=True)
class Fill:
    """A match between a resting order (maker) and an incoming trader order (taker)."""

    maker: str  # owner of the resting order, e.g. "player"
    maker_side: Side  # side of the resting order
    price: float  # trades happen at the resting order's price
    quantity: int


@dataclass(frozen=True)
class Trade:
    """A trade from the player's point of view: BUY means the player bought."""

    side: Side
    price: float
    quantity: int = 1
    informed: bool = False  # whether the counterparty was an informed trader


@dataclass(frozen=True)
class OrderResult:
    """A trader order together with how much of it was filled (for the order book view)."""

    side: Side
    quantity: int
    limit_price: float
    informed: bool
    filled: int


@dataclass(frozen=True)
class RoundResult:
    """What happened in one round, as shown to the player."""

    round: int
    price: float
    quote: Quote  # the player's quote as placed in the book (sizes after the inventory cap)
    n_traders: int  # traders that arrived (including those who did not want to trade)
    trader_orders: list[OrderResult]  # all orders that arrived this round, with how much was filled
    trades: list[Trade]  # the player's trades
    cash: float
    inventory: int
    pnl: float
    done: bool


@dataclass(frozen=True)
class SessionState:
    """A snapshot of the full session, e.g. to (re)draw the screen."""

    round: int
    n_rounds: int
    max_inventory: int
    price: float
    price_history: list[float]
    cash: float
    inventory: int
    pnl: float
    done: bool
