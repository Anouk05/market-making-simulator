"""A limit order book with price-time priority.

Resting orders sit in the book. Incoming trader orders take
liquidity: they trade against the best resting prices first (at the resting
order's price) and can be partially filled. Trader orders are
immediate-or-cancel, so whatever part cannot be filled is simply dropped.
"""

from dataclasses import dataclass

from .datatypes import Fill, Order, Side


@dataclass
class RestingOrder:
    owner: str  # who placed it, e.g. "player"
    side: Side
    price: float
    quantity: int
    sequence: int  # arrival order, used for time priority at the same price


class OrderBook:
    def __init__(self) -> None:
        self._bids: list[RestingOrder] = []  # best (highest) price first
        self._asks: list[RestingOrder] = []  # best (lowest) price first
        self._sequence = 0

    def add_limit_order(self, owner: str, side: Side, price: float, quantity: int) -> None:
        """Place a resting order. Orders with quantity 0 are ignored."""
        if quantity <= 0:
            return
        order = RestingOrder(owner, side, price, quantity, self._sequence)
        self._sequence += 1
        if side == Side.BUY:
            self._bids.append(order)
            self._bids.sort(key=lambda o: (-o.price, o.sequence))  # price, then time priority
        else:
            self._asks.append(order)
            self._asks.sort(key=lambda o: (o.price, o.sequence))

    def match(self, order: Order) -> list[Fill]:
        """Match one incoming (immediate-or-cancel) order and return the fills.

        The unfilled part of the order is not placed in the book.
        """
        resting_side = self._asks if order.side == Side.BUY else self._bids
        remaining = order.quantity
        fills = []
        while remaining > 0 and resting_side and self._crosses(order, resting_side[0].price):
            best = resting_side[0]
            quantity = min(remaining, best.quantity)
            fills.append(Fill(best.owner, best.side, best.price, quantity))
            remaining -= quantity
            best.quantity -= quantity
            if best.quantity == 0:
                resting_side.pop(0)
        return fills

    @staticmethod
    def _crosses(order: Order, resting_price: float) -> bool:
        if order.side == Side.BUY:
            return order.limit_price >= resting_price
        return order.limit_price <= resting_price

    def best_bid(self) -> float | None:
        return self._bids[0].price if self._bids else None

    def best_ask(self) -> float | None:
        return self._asks[0].price if self._asks else None
