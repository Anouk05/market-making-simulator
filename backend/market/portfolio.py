"""Bookkeeping of the player's cash and inventory."""

from dataclasses import dataclass

from .datatypes import Side, Trade


@dataclass
class Portfolio:
    cash: float = 0.0
    inventory: int = 0

    def apply(self, trade: Trade) -> None:
        """Update cash and inventory for an executed trade."""
        if trade.side == Side.BUY:
            self.inventory += trade.quantity
            self.cash -= trade.price * trade.quantity
        else:
            self.inventory -= trade.quantity
            self.cash += trade.price * trade.quantity

    def mark_to_market(self, price: float) -> float:
        """Profit and loss if the inventory were valued at this price."""
        return self.cash + self.inventory * price

    def liquidate(self, price: float) -> None:
        """Close the remaining position at the given price."""
        self.cash += self.inventory * price
        self.inventory = 0
