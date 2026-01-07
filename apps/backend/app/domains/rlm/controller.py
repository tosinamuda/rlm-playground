"""Controller for RLM WebSocket streaming.

This module implements the RLMStreamController which orchestrates
the WebSocket flow with explicit, readable steps:

1. Accept connection
2. Receive and validate request
3. Create producer-consumer pipeline
4. Run pipeline (producer emits steps, consumer sends them)
5. Send final result
6. Close connection
"""

import asyncio
from dataclasses import dataclass
from typing import Any, Dict, Optional

from fastapi import WebSocket
from loguru import logger

from .schemas import RLMRequest
from .service import RLM

# Sentinel to signal queue completion
_DONE = object()


@dataclass
class StreamContext:
    """Holds shared state during a WebSocket stream session."""
    websocket: WebSocket
    queue: asyncio.Queue
    result: Optional[Any] = None
    error: Optional[Exception] = None


class RLMStreamController:
    """Orchestrates the RLM WebSocket streaming flow.
    
    This controller makes the flow explicit and readable:
    - Each step is a named method
    - Producer-consumer pattern with sentinel-based completion
    - No polling loops or timeout hacks
    """

    def __init__(self, websocket: WebSocket):
        self._websocket = websocket
        self._ctx: Optional[StreamContext] = None

    async def handle(self) -> None:
        """Main entry point — orchestrates the 6 steps."""
        try:
            await self._accept_connection()

            request = await self._receive_and_validate()
            if request is None:
                return

            await self._run_pipeline(request)

            await self._send_final_result()

        except Exception as e:
            await self._handle_error(e)
        finally:
            await self._close_connection()

    # ─────────────────────────────────────────────────────────────
    # Step 1: Accept Connection
    # ─────────────────────────────────────────────────────────────

    async def _accept_connection(self) -> None:
        """Accepts the WebSocket connection."""
        await self._websocket.accept()
        self._ctx = StreamContext(
            websocket=self._websocket,
            queue=asyncio.Queue()
        )

    # ─────────────────────────────────────────────────────────────
    # Step 2: Receive and Validate Request
    # ─────────────────────────────────────────────────────────────

    async def _receive_and_validate(self) -> Optional[RLMRequest]:
        """Receives JSON and validates the request.
        
        Returns:
            RLMRequest if valid, None if invalid (error already sent).
        """
        data = await self._websocket.receive_json()
        query = data.get("query")
        context = data.get("context")
        enable_sub_llm = data.get("enable_sub_llm", True)

        if not query or not context:
            await self._websocket.send_json({"error": "Missing query or context"})
            return None

        return RLMRequest(query=query, context=context, enable_sub_llm=enable_sub_llm)

    # ─────────────────────────────────────────────────────────────
    # Step 3 & 4: Run Producer-Consumer Pipeline
    # ─────────────────────────────────────────────────────────────

    async def _run_pipeline(self, request: RLMRequest) -> None:
        """Runs producer and consumer concurrently using TaskGroup.
        
        Producer: Executes RLM, emits steps to queue
        Consumer: Reads from queue, sends to WebSocket
        """
        loop = asyncio.get_running_loop()

        async with asyncio.TaskGroup() as tg:  # type: ignore # py311 feature
            tg.create_task(self._produce(request, loop))
            tg.create_task(self._consume())

    async def _produce(self, request: RLMRequest, loop: asyncio.AbstractEventLoop) -> None:
        """Producer: runs RLM and signals completion via sentinel."""
        if not self._ctx:
            return

        def on_step(step_data: Dict[str, Any]) -> None:
            """Callback to enqueue steps (thread-safe)."""
            if self._ctx:
                self._ctx.queue.put_nowait(step_data)

        try:
            rlm = RLM(
                context=request.context,
                enable_sub_llm=request.enable_sub_llm,
                step_callback=on_step,
                loop=loop
            )
            self._ctx.result = await rlm.aforward(query=request.query)
        except KeyError as e:
            # DSPy parsing error - recover gracefully
            import traceback
            logger.warning(f"DSPy KeyError (recovering): {e}")
            logger.warning(f"KeyError traceback:\n{traceback.format_exc()}")
            import dspy
            if self._ctx:
                self._ctx.result = dspy.Prediction(
                    answer="Analysis completed but response parsing failed. The steps above show the reasoning process."
                )
        except Exception as e:
            if self._ctx:
                self._ctx.error = e
            raise
        finally:
            # Signal consumer to stop
            if self._ctx:
                self._ctx.queue.put_nowait(_DONE)

    async def _consume(self) -> None:
        """Consumer: reads steps from queue and sends to WebSocket."""
        if not self._ctx:
            return

        while True:
            step = await self._ctx.queue.get()

            if step is _DONE:
                break

            await self._send_step(step)

    async def _send_step(self, step: Dict[str, Any]) -> None:
        """Sends a single step to the WebSocket."""
        try:
            await self._websocket.send_json({
                "type": "step",
                "step": step
            })
        except Exception as e:
            logger.error(f"Error sending step: {e}")

    # ─────────────────────────────────────────────────────────────
    # Step 5: Send Final Result
    # ─────────────────────────────────────────────────────────────

    async def _send_final_result(self) -> None:
        """Sends the final answer to the WebSocket."""
        if self._ctx is None or self._ctx.result is None:
            return

        await self._websocket.send_json({
            "type": "final",
            "answer": self._ctx.result.answer
        })

    # ─────────────────────────────────────────────────────────────
    # Step 6: Close Connection
    # ─────────────────────────────────────────────────────────────

    async def _close_connection(self) -> None:
        """Closes the WebSocket connection gracefully."""
        try:
            await self._websocket.close()
        except Exception:
            pass  # Already closed or connection lost

    # ─────────────────────────────────────────────────────────────
    # Error Handling
    # ─────────────────────────────────────────────────────────────

    async def _handle_error(self, error: Exception) -> None:
        """Sends error to client and logs it, unwrapping ExceptionGroup if needed."""
        # Unwrap ExceptionGroup to get actual root cause
        actual_error = error
        if hasattr(error, 'exceptions'):  # ExceptionGroup
            for sub_exc in getattr(error, 'exceptions', []):
                logger.error(f"WebSocket sub-exception: {type(sub_exc).__name__}: {sub_exc}", exc_info=sub_exc)
                actual_error = sub_exc

        logger.error(f"WebSocket Error: {actual_error}", exc_info=actual_error)
        try:
            await self._websocket.send_json({"error": str(actual_error)})
        except Exception:
            pass  # Connection may be closed
