"""Simulated traders: who arrives each round and what they send to the order book."""

import numpy as np

from .config import TraderConfig
from .datatypes import Order, Side
from .ticks import round_down_to_tick, round_up_to_tick


def generate_orders(
    rng: np.random.Generator,
    current_price: float,
    next_price: float,
    config: TraderConfig,
    best_bid: float | None,
    best_ask: float | None,
    tick_size: float,
) -> tuple[list[Order], int]:
    """Draw the traders that arrive this round and the orders they send.

    Returns (orders, number of traders that arrived).

    The number of traders is Poisson distributed. Each trader has a valuation:
    - informed (probability `informed_fraction`): close to the NEXT price, so
      they mostly trade when the price is about to move against the player
      (adverse selection);
    - uninformed (noise trader): around the CURRENT price plus noise. These
      traders earn the player the spread.

    Traders can see the quotes in the book, so each one simply decides:
    - valuation at or above the best ask  -> buy at that ask,
    - valuation at or below the best bid  -> sell at that bid,
    - in between                          -> send nothing.
    Orders are immediate-or-cancel with the valuation (rounded to the tick
    grid on the safe side) as limit price. Size is 1 + Poisson(mean_order_size - 1).

    Every trader draws the same random numbers whether or not they trade, so
    the player's quote never changes the random numbers used later in the game.
    """
    n_traders = int(rng.poisson(config.arrival_rate))
    orders = []
    for _ in range(n_traders):
        informed = rng.random() < config.informed_fraction
        if informed:
            value = next_price * (1 + config.informed_noise * rng.standard_normal())
        else:
            value = current_price * (1 + config.uninformed_noise * rng.standard_normal())
        quantity = 1 + int(rng.poisson(max(config.mean_order_size - 1, 0)))

        buy_limit = round_down_to_tick(value, tick_size)
        sell_limit = round_up_to_tick(value, tick_size)
        if best_ask is not None and buy_limit >= best_ask:
            orders.append(Order(Side.BUY, quantity, buy_limit, informed))
        elif best_bid is not None and sell_limit <= best_bid:
            orders.append(Order(Side.SELL, quantity, sell_limit, informed))
    return orders, n_traders
