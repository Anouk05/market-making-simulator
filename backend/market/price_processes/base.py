"""The interface every price process (GBM, later dice) must follow."""

from abc import ABC, abstractmethod


class PriceProcess(ABC):
    """Base class for price processes."""

    @abstractmethod
    def current_price(self) -> float:
        """The price the player sees now."""

    @abstractmethod
    def step(self) -> float:
        """Move one round forward and return the new price."""

    @abstractmethod
    def settlement_price(self) -> float:
        """The price at which remaining inventory is closed at the end."""
