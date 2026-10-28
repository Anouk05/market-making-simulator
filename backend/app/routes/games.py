"""The game endpoints: the URLs the frontend calls to play the game.

GET  /api/game/defaults  the default game settings
POST /api/game           start a new game (replaces the current one)
GET  /api/game           get the current state of the game
POST /api/game/quote     submit a quote and play one round
"""

from http import HTTPStatus

from fastapi import APIRouter, Depends, HTTPException

from app.schemas import GameStateOut, NewGameRequest, QuoteRequest, RoundOut
from modes.game import GameManager, NoActiveGameError

router = APIRouter(prefix="/api/game", tags=["game"])

# The one game manager for the whole server.
_manager = GameManager()


def get_manager() -> GameManager:
    """Gives endpoints access to the game manager (tests can swap it out)."""
    return _manager


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
    state = manager.new_game(request.to_config())
    return GameStateOut.model_validate(state)


@router.get("", response_model=GameStateOut)
def get_game(manager: GameManager = Depends(get_manager)) -> GameStateOut:
    """The current state of the game, e.g. after a page refresh."""
    try:
        state = manager.get_state()
    except NoActiveGameError as error:
        raise HTTPException(HTTPStatus.NOT_FOUND, str(error))
    return GameStateOut.model_validate(state)


@router.post("/quote", response_model=RoundOut)
def submit_quote(
    request: QuoteRequest,
    manager: GameManager = Depends(get_manager),
) -> RoundOut:
    """Submit a bid and ask (with sizes) and play one round."""
    try:
        result = manager.submit_quote(request.to_quote())
    except NoActiveGameError as error:  # no game started yet
        raise HTTPException(HTTPStatus.CONFLICT, str(error))
    except ValueError as error:  # invalid quote, e.g. bid >= ask
        raise HTTPException(HTTPStatus.UNPROCESSABLE_ENTITY, str(error))
    except RuntimeError as error:  # the game is already finished
        raise HTTPException(HTTPStatus.CONFLICT, str(error))
    return RoundOut.model_validate(result)
