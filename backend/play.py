"""Play the market-making game in the terminal, without the frontend or API.

Useful for testing the game engine in `market/` on its own.
Run from the backend folder:  python play.py
"""

from market.config import GBMConfig, SessionConfig
from market.datatypes import Quote
from market.session import TradingSession


def read_quote() -> Quote:
    """Read 'bid ask size' (same size both sides) or 'bid ask bid_size ask_size'."""
    parts = input("Your quote (bid ask size  or  bid ask bid_size ask_size): ").split()
    if len(parts) == 3:
        bid, ask, size = float(parts[0]), float(parts[1]), int(parts[2])
        return Quote(bid=bid, ask=ask, bid_size=size, ask_size=size)
    if len(parts) == 4:
        return Quote(bid=float(parts[0]), ask=float(parts[1]), bid_size=int(parts[2]), ask_size=int(parts[3]))
    raise ValueError("Enter 3 or 4 numbers.")


def main() -> None:
    config = SessionConfig(market=GBMConfig(s0=100.0, mu=0.05, sigma=0.20), n_rounds=10)
    session = TradingSession(config)
    print(f"Market making game: {config.n_rounds} rounds.")
    print("Example quote: 99.5 100.5 5  (buy up to 5 at 99.50, sell up to 5 at 100.50)\n")

    while not session.done:
        state = session.state()
        print(
            f"Round {state.round + 1}/{state.n_rounds} | price {state.price:.2f} | "
            f"inventory {state.inventory} | cash {state.cash:.2f} | PnL {state.pnl:.2f}"
        )
        try:
            result = session.step(read_quote())
        except ValueError as error:
            print(f"Invalid quote: {error}\n")
            continue

        print(f"  {len(result.trader_orders)} trader order(s) arrived:")
        for order in sorted(result.trader_orders, key=lambda o: (o.side.value, -o.limit_price)):
            print(f"    {order.side.value:>4} {order.quantity} @ limit {order.limit_price:.2f}")
        for trade in result.trades:
            print(f"  You {trade.side.value} {trade.quantity} at {trade.price:.2f}")
        if not result.trades:
            print("  No trades")
        print(f"  New price {result.price:.2f}\n")

    print(f"Game over. Final PnL: {session.portfolio.cash:.2f}")


if __name__ == "__main__":
    main()
