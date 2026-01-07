"""Central API router for the RLM Prototype.

This module aggregates routers from different domains (RLM, Datasets)
into a single API router that is mounted in the main application.
"""

from fastapi import APIRouter

from ..domains.datasets.router import router as datasets_router
from ..domains.rlm.router import router as rlm_router

api_router = APIRouter()

# Include domain-specific routers
api_router.include_router(rlm_router, prefix="/rlm", tags=["RLM"])
api_router.include_router(datasets_router, prefix="/datasets", tags=["Datasets"])
