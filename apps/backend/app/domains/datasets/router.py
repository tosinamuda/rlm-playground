"""FastAPI router for the Datasets domain.

This module provides endpoints for listing available benchmarks and
retrieving random task samples for RLM evaluation.
"""

import random

from fastapi import APIRouter, HTTPException
from loguru import logger

from .schemas import DatasetListResponse, DatasetRandomSample, DatasetInfo
from .service import get_longbench_tasks

router = APIRouter()


@router.get("/sample", response_model=DatasetRandomSample)
async def get_random_sample() -> DatasetRandomSample:
    """Retrieves a random task sample from the LongBench-v2 dataset.

    Returns:
        DatasetRandomSample: A dictionary containing the query, context, and answer.

    Raises:
        HTTPException: If the dataset is empty or if sampling fails.
    """
    try:
        tasks = get_longbench_tasks()
        if not tasks:
            raise HTTPException(
                status_code=404,
                detail="LongBench-v2 dataset not found or empty"
            )

        sample = random.choice(tasks)

        context = sample.get("context", "")
        has_context = bool(context)

        return DatasetRandomSample(
            query=sample.get("query", ""),
            context=context,
            answer=sample.get("answer", ""),
            dataset="longbench_v2",
            hasContext=has_context,
            metadata=sample.get("metadata", {})
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting sample: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list", response_model=DatasetListResponse)
async def get_datasets() -> DatasetListResponse:
    """Lists available datasets (hardcoded to LongBench-v2).

    Returns:
        DatasetListResponse: A list containing only LongBench-v2 info.
    """
    return DatasetListResponse(datasets=[
        DatasetInfo(
            id="longbench_v2",
            name="LongBench-v2",
            hasContext=True,
            description="Long-context QA benchmark with 1M+ token contexts"
        )
    ])
