"""Pydantic schemas for the Datasets domain.

This module defines models for dataset metadata, random samples,
and response structures for dataset-related API endpoints.
"""

from typing import Any, Dict, List

from pydantic import BaseModel


class DatasetInfo(BaseModel):
    """Metadata for a registered dataset.

    Attributes:
        id: Unique identifier for the dataset.
        name: Human-readable name.
        hasContext: Whether the dataset provides a context field.
        description: Brief description of the dataset tasks.
    """
    id: str
    name: str
    hasContext: bool
    description: str


class DatasetRandomSample(BaseModel):
    """Schema for a random task sample from a dataset.

    Attributes:
        query: The task question.
        context: The task context (if applicable).
        answer: The ground truth answer.
        dataset: The ID of the originating dataset.
        hasContext: Flag indicating context availability.
        metadata: Additional task-specific metadata.
    """
    query: str
    context: str
    answer: str
    dataset: str
    hasContext: bool
    metadata: Dict[str, Any] = {}


class DatasetListResponse(BaseModel):
    """Response schema for listing available datasets.

    Attributes:
        datasets: List of DatasetInfo objects.
    """
    datasets: List[DatasetInfo]
