"""Pydantic schemas for the RLM domain.

This module defines the data models used for RLM requests, responses,
and execution steps, ensuring type safety and validation.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class RLMRequest(BaseModel):
    """Schema for an RLM execution request.

    Attributes:
        query: The user's question or instruction.
        context: The background information provided for reasoning.
        enable_sub_llm: Whether to enable recursive sub-LLM calls.
    """
    query: str
    context: str
    enable_sub_llm: bool = True


class RLMResponse(BaseModel):
    """Schema for an RLM execution response.

    Attributes:
        answer: The final answer produced by the RLM.
        trajectory: A list of reasoning steps and tool calls captured.
    """
    answer: str
    trajectory: List[Dict[str, Any]] = []


class RLMStep(BaseModel):
    """Schema for a single step in the RLM reasoning trajectory.

    Attributes:
        id: Unique identifier for the step.
        parent_id: Optional ID of the parent step for tree nesting.
        type: The category of the step (e.g., 'thinking', 'tool_call').
        content: The text description or input for the step.
        output: Optional result or response from the step.
        metadata: Additional key-value pairs for step details.
    """
    id: str
    parent_id: Optional[str] = None
    type: str
    content: str
    output: Optional[str] = None
    metadata: Dict[str, Any] = {}
