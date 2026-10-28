"""Geometric Brownian motion price process."""

import numpy as np

from ..config import GBMConfig
from .base import PriceProcess


class GBMProcess(PriceProcess):
    """Stock price following a GBM, simulated with:

    S_{t+dt} = S_t * exp((mu - sigma^2 / 2) * dt + sigma * sqrt(dt) * Z),  Z ~ N(0, 1)
    """

    def __init__(self, config: GBMConfig, rng: np.random.Generator):
        if config.s0 <= 0:
            raise ValueError("Starting price must be positive.")
        if config.sigma < 0:
            raise ValueError("Volatility cannot be negative.")
        self.config = config
        self.rng = rng
        self._price = config.s0

    def current_price(self) -> float:
        return self._price

    def step(self) -> float:
        c = self.config
        z = self.rng.standard_normal()
        drift = (c.mu - 0.5 * c.sigma**2) * c.dt
        shock = c.sigma * np.sqrt(c.dt) * z
        self._price = float(self._price * np.exp(drift + shock))
        return self._price

    def settlement_price(self) -> float:
        return self._price
