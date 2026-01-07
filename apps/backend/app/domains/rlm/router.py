"""FastAPI router for the RLM domain.

This module defines the HTTP and WebSocket endpoints for executing and
streaming Reasoning Language Model (RLM) queries.
"""

from fastapi import APIRouter, HTTPException, WebSocket
from loguru import logger

from .controller import RLMStreamController
from .schemas import RLMRequest, RLMResponse
from .service import RLM

router = APIRouter()


@router.post("/execute", response_model=RLMResponse)
async def execute_rlm(request: RLMRequest) -> RLMResponse:
    """Executes an RLM query without streaming.

    Args:
        request: The RLM request containing query and context.

    Returns:
        RLMResponse: The final answer and empty trajectory.

    Raises:
        HTTPException: If an error occurs during RLM execution.
    """
    try:
        logger.info(f"Executing RLM query: {request.query}")
        rlm = RLM(context=request.context)

        result = await rlm.aforward(query=request.query)

        return RLMResponse(
            answer=result.answer,
            trajectory=[]
        )
    except Exception as e:
        logger.error(f"Error in RLM execution: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/stream")
async def stream_rlm(websocket: WebSocket):
    """Streams RLM execution steps and the final answer via WebSocket.

    Args:
        websocket: The active WebSocket connection.
    """
    controller = RLMStreamController(websocket)
    await controller.handle()
