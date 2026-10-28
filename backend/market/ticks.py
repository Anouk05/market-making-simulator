"""Helpers for the tick size: the smallest allowed price step (e.g. 0.01).

Prices are floats, and 0.1 + 0.2 is not exactly 0.3 in floating point. These
helpers work in whole numbers of ticks and round the result, so prices like
100.07 stay exactly 100.07 instead of 100.07000000000001.
"""

import math

_EPS = 1e-9


def _to_price(ticks: int, tick_size: float) -> float:
    return round(ticks * tick_size, 10)


def round_down_to_tick(price: float, tick_size: float) -> float:
    """Highest tick price at or below `price` (used for buy limits)."""
    return _to_price(math.floor(price / tick_size + _EPS), tick_size)


def round_up_to_tick(price: float, tick_size: float) -> float:
    """Lowest tick price at or above `price` (used for sell limits)."""
    return _to_price(math.ceil(price / tick_size - _EPS), tick_size)


def is_on_tick(price: float, tick_size: float) -> bool:
    """True if `price` is a whole number of ticks (within float rounding)."""
    ticks = price / tick_size
    return abs(ticks - round(ticks)) < 1e-6


def snap_to_tick(price: float, tick_size: float) -> float:
    """Nearest tick price, e.g. to clean up 99.53000000000001."""
    return _to_price(round(price / tick_size), tick_size)
