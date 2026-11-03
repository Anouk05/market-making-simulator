"""The FastAPI application: creates the app and connects all the parts.

Start the server from the backend folder with:

    uvicorn app.main:app --reload

Then open http://localhost:8000/docs to try the endpoints in your browser.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import games

app = FastAPI(
    title="Market-Making Simulator",
    description="Quote a bid and ask, trade against simulated traders, and track your PnL.",
    version="0.1.0",
)

# Lets a frontend on another address call the API directly (browsers block this by default).
# Normally not needed: the Vite dev server and Render both forward /api, so requests come
# from the same address. Set ALLOWED_ORIGINS to allow other addresses.
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in allowed_origins],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(games.router)


@app.get("/api/health", tags=["health"])
def health() -> dict[str, str]:
    """Simple check that the server is running."""
    return {"status": "ok"}
