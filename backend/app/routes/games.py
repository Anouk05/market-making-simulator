"""The game endpoints: the URLs the frontend calls to play the game.

GET  /api/game/defaults          the default game settings
POST /api/game                   start a new game; the response contains its game_id
GET  /api/game/{game_id}         get the current state of a game
POST /api/game/{game_id}/quote   submit a quote and play one round
"""

from dataclasses import asdict
from http import HTTPStatus

from fastapi import APIRouter, Depends, HTTPException

from app.schemas import GameStateOut, NewGameRequest, QuoteRequest, RoundOut
from market.datatypes import SessionState
from modes.game import GameManager, GameNotFoundError

router = APIRouter(prefix="/api/game", tags=["game"])

# One game manager for the whole server; it holds the games of all players.
_manager = GameManager()


def get_manager() -> GameManager:
    """Gives endpoints access to the game manager (tests can swap it out)."""
    return _manager


def _state_out(game_id: str, state: SessionState) -> GameStateOut:
    return GameStateOut.model_validate({"game_id": game_id, **asdict(state)})


@router.get("/defaults", response_model=NewGameRequest)
def get_defaults() -> NewGameRequest:
    """The default settings for a new game (from market/config.py)."""
    return NewGameRequest()


@router.post("", response_model=GameStateOut)
def start_game(
    request: NewGameRequest = NewGameRequest(),
    manager: GameManager = Depends(get_manager),
) -> GameStateOut:
    """Start a new game with the given settings. All settings are optional."""
    game_id, state = manager.new_game(request.to_config())
    return _state_out(game_id, state)


@router.get("/{game_id}", response_model=GameStateOut)
def get_game(game_id: str, manager: GameManager = Depends(get_manager)) -> GameStateOut:
    """The current state of a game, e.g. after a page refresh."""
    try:
        state = manager.get_state(game_id)
    except GameNotFoundError as error:
        raise HTTPException(HTTPStatus.NOT_FOUND, error.args[0])
    return _state_out(game_id, state)


@router.post("/{game_id}/quote", response_model=RoundOut)
def submit_quote(
    game_id: str,
    request: QuoteRequest,
    manager: GameManager = Depends(get_manager),
) -> RoundOut:
    """Submit a bid and ask (with sizes) and play one round."""
    try:
        result = manager.submit_quote(game_id, request.to_quote())
    except GameNotFoundError as error:  # unknown or expired game
        raise HTTPException(HTTPStatus.NOT_FOUND, error.args[0])
    except ValueError as error:  # invalid quote, e.g. bid >= ask
        raise HTTPException(HTTPStatus.UNPROCESSABLE_ENTITY, str(error))
    except RuntimeError as error:  # the game is already finished
        raise HTTPException(HTTPStatus.CONFLICT, str(error))
    return RoundOut.model_validate(result)
