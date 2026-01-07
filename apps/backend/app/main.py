"""Main entry point for the RLM Prototype FastAPI application.

This module initializes the FastAPI app, configures middleware, and integrates
domain-specific routers. It also handles the application lifespan events.
"""

from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables
load_dotenv()

from .api.router import api_router
from .domains.datasets.service import ensure_datasets_cached
from .domains.rlm.dspy.setup import setup_dspy


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages the lifecycle of the FastAPI application.

    Args:
        app: The FastAPI application instance.
    """
    import asyncio

    # Startup: setup DSPy (blocking, required before serving)
    setup_dspy()

    # Cache datasets in background (non-blocking)
    loop = asyncio.get_running_loop()
    loop.run_in_executor(None, ensure_datasets_cached)

    yield
    # Shutdown logic (if any) could go here


app = FastAPI(title="RLM Prototype API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,  # type: ignore # starlette middleware factory typing issue
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.get("/health")
def health_check():
    """Returns the health status of the application.

    Returns:
        dict: A dictionary containing the status "ok".
    """
    return {"status": "ok"}
