"""One trading session: the round-by-round game loop."""

import numpy as np

from .config import SessionConfig
from .datatypes import OrderResult, Quote, RoundResult, SessionState, Side, Trade
from .order_book import OrderBook
from .order_flow import generate_orders
from .portfolio import Portfolio
from .price_processes import GBMProcess, PriceProcess
from .ticks import is_on_tick, snap_to_tick


class TradingSession:
    """Plays one game. Each round:

    1. the player sees the current price and submits a quote (prices and sizes),
       which is placed in a fresh order book,
    2. traders look at the quote and only send an order if they want to trade
       at it; the orders arrive one by one and trade against the quote until
       its size is used up (the rest is cancelled); informed traders already
       know (roughly) the next price, uninformed (noise) traders only the
       current one,
    3. the new price is revealed and cash, inventory and PnL are updated.

    The next price is drawn before the traders arrive (informed traders need it),
    but the player only sees it after the round.

    After the last round any remaining inventory is closed at the final price.
    """

    def __init__(self, config: SessionConfig):
        if config.n_rounds <= 0:
            raise ValueError("Number of rounds must be positive.")
        self.config = config
        self.rng = np.random.default_rng(config.seed)
        self.process: PriceProcess = GBMProcess(config.market, self.rng)
        self.portfolio = Portfolio()
        self.round = 0
        self.price_history = [self.process.current_price()]

    @property
    def done(self) -> bool:
        return self.round >= self.config.n_rounds

    def step(self, quote: Quote) -> RoundResult:
        if self.done:
            raise RuntimeError("The game is already finished.")
        quote.validate()
        tick = self.config.tick_size
        if not (is_on_tick(quote.bid, tick) and is_on_tick(quote.ask, tick)):
            raise ValueError(f"Prices must be on the tick grid of {tick}.")
        quote = Quote(snap_to_tick(quote.bid, tick), snap_to_tick(quote.ask, tick), quote.bid_size, quote.ask_size)

        current_price = self.process.current_price()
        price = self.process.step()

        book = OrderBook()
        bid_size, ask_size = self._capped_sizes(quote)
        book.add_limit_order("player", Side.BUY, quote.bid, bid_size)
        book.add_limit_order("player", Side.SELL, quote.ask, ask_size)

        # Traders look at the quote and only send an order if they want to trade at it.
        # The orders are drawn independently, so the list is already in random arrival order.
        orders, n_traders = generate_orders(
            self.rng,
            current_price,
            price,
            self.config.traders,
            book.best_bid(),
            book.best_ask(),
            self.config.tick_size,
        )
        trades = []
        order_results = []
        for order in orders:
            fills = book.match(order)  # immediate-or-cancel: any unfilled part is dropped
            for fill in fills:
                if fill.maker == "player":
                    trade = Trade(fill.maker_side, fill.price, fill.quantity, order.informed)
                    self.portfolio.apply(trade)
                    trades.append(trade)
            filled = sum(f.quantity for f in fills)
            order_results.append(OrderResult(order.side, order.quantity, order.limit_price, order.informed, filled))

        self.round += 1
        self.price_history.append(price)
        if self.done:
            self.portfolio.liquidate(self.process.settlement_price())

        return RoundResult(
            round=self.round,
            price=price,
            quote=Quote(quote.bid, quote.ask, bid_size, ask_size),
            n_traders=n_traders,
            trader_orders=order_results,
            trades=trades,
            cash=self.portfolio.cash,
            inventory=self.portfolio.inventory,
            pnl=self.portfolio.mark_to_market(price),
            done=self.done,
        )

    def _capped_sizes(self, quote: Quote) -> tuple[int, int]:
        """Limit quote sizes so the position can never exceed +/- max_inventory."""
        limit = self.config.max_inventory
        inventory = self.portfolio.inventory
        bid_size = min(quote.bid_size, max(limit - inventory, 0))
        ask_size = min(quote.ask_size, max(limit + inventory, 0))
        return bid_size, ask_size

    def state(self) -> SessionState:
        price = self.process.current_price()
        return SessionState(
            round=self.round,
            n_rounds=self.config.n_rounds,
            max_inventory=self.config.max_inventory,
            price=price,
            price_history=list(self.price_history),
            cash=self.portfolio.cash,
            inventory=self.portfolio.inventory,
            pnl=self.portfolio.mark_to_market(price),
            done=self.done,
        )
