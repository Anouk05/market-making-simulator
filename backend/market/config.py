"""Settings for a trading session, chosen by the user before the game starts."""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class GBMConfig:
    """Parameters of the geometric Brownian motion for the stock price."""

    s0: float = 100.0  # starting price
    mu: float = 0.05  # annual drift
    sigma: float = 0.20  # annual volatility
    dt: float = 1 / 252  # time per round in years (1/252 = one trading day)


@dataclass(frozen=True)
class TraderConfig:
    """How the simulated traders behave."""

    arrival_rate: float = 4.0  # average number of traders per round
    informed_fraction: float = 0.3  # share of traders who know where the price is going
    informed_noise: float = 0.001  # std of informed valuations around the NEXT price (fraction of price)
    uninformed_noise: float = 0.01  # std of uninformed valuations around the CURRENT price (fraction of price)
    mean_order_size: float = 3.0  # average number of units per trader order (at least 1)


@dataclass(frozen=True)
class SessionConfig:
    """All settings for one game."""

    market: GBMConfig = field(default_factory=GBMConfig)
    traders: TraderConfig = field(default_factory=TraderConfig)
    n_rounds: int = 10
    max_inventory: int = 50  # quote sizes are capped so the position stays within +/- this
    tick_size: float = 0.01  # smallest price step; all quotes and orders are on this grid
    seed: int | None = None  # same seed = same game
