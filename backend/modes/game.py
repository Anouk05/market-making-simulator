"""Game mode: keeps track of the games that are being played.

Every player gets their own `TradingSession`, stored in memory under a random
game ID. The frontend receives the ID when a game starts and sends it with
every request. Nothing is saved: when the server restarts, all games are gone.

To keep memory in check, games that have not been used for `max_idle_seconds`
are removed, and there is a cap on the number of games. A lock makes sure two
requests never change the games at the same time.
"""

import threading
import time
import uuid
from dataclasses import dataclass, field

from market.config import SessionConfig
from market.datatypes import Quote, RoundResult, SessionState
from market.session import TradingSession


class GameNotFoundError(KeyError):
    """Raised when a game ID is unknown: it never existed, or it was cleaned up."""


@dataclass
class _StoredGame:
    session: TradingSession
    last_active: float = field(default_factory=time.monotonic)


class GameManager:
    def __init__(self, max_games: int = 500, max_idle_seconds: float = 3600) -> None:
        self.max_games = max_games
        self.max_idle_seconds = max_idle_seconds
        self._games: dict[str, _StoredGame] = {}
        self._lock = threading.Lock()

    def new_game(self, config: SessionConfig) -> tuple[str, SessionState]:
        """Start a new game and return its ID and starting state."""
        with self._lock:
            self._remove_idle_games()
            if len(self._games) >= self.max_games:
                self._remove_least_recently_used()
            game_id = uuid.uuid4().hex
            session = TradingSession(config)
            self._games[game_id] = _StoredGame(session)
            return game_id, session.state()

    def submit_quote(self, game_id: str, quote: Quote) -> RoundResult:
        """Play one round of a game with the player's quote."""
        with self._lock:
            game = self._get(game_id)
            game.last_active = time.monotonic()
            return game.session.step(quote)

    def get_state(self, game_id: str) -> SessionState:
        """The current state of a game, e.g. to redraw the screen after a page refresh."""
        with self._lock:
            return self._get(game_id).session.state()

    def _get(self, game_id: str) -> _StoredGame:
        try:
            return self._games[game_id]
        except KeyError:
            raise GameNotFoundError("This game no longer exists. Please start a new game.") from None

    def _remove_idle_games(self) -> None:
        now = time.monotonic()
        for game_id in [gid for gid, g in self._games.items() if now - g.last_active > self.max_idle_seconds]:
            del self._games[game_id]

    def _remove_least_recently_used(self) -> None:
        oldest = min(self._games, key=lambda gid: self._games[gid].last_active)
        del self._games[oldest]
