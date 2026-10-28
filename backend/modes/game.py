"""Game mode: holds the one game that is currently being played.

The backend keeps a single `TradingSession` in memory. Starting a new game
replaces the previous one, and nothing is saved: when the server stops, the
game is gone. This is meant for playing on your own laptop; if several people
used the same server, they would share this one game.

A lock makes sure two requests never change the game at the same time
(e.g. when the player double-clicks "Next round").
"""

import threading

from market.config import SessionConfig
from market.datatypes import Quote, RoundResult, SessionState
from market.session import TradingSession


class NoActiveGameError(RuntimeError):
    """Raised when a quote or state is requested before a game was started."""


class GameManager:
    def __init__(self) -> None:
        self._session: TradingSession | None = None
        self._lock = threading.Lock()

    def new_game(self, config: SessionConfig) -> SessionState:
        """Start a new game (replacing any current one) and return its starting state."""
        with self._lock:
            self._session = TradingSession(config)
            return self._session.state()

    def submit_quote(self, quote: Quote) -> RoundResult:
        """Play one round of the current game with the player's quote."""
        with self._lock:
            return self._current().step(quote)

    def get_state(self) -> SessionState:
        """The current state, e.g. to redraw the screen after a page refresh."""
        with self._lock:
            return self._current().state()

    def _current(self) -> TradingSession:
        if self._session is None:
            raise NoActiveGameError("No game has been started yet.")
        return self._session
