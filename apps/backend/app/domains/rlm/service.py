"""Service layer for Reasoning Language Model (RLM) orchestration.

This module defines the RLM class, which integrates DSPy modules,
isolated code execution (REPL), and real-time status tracking to
answer complex queries using provided context.
"""

import time
from typing import Any, Callable, Optional

import dspy
from loguru import logger

from .dspy import RLMStatusMessageProvider, create_rlm_signature
from .repl import RLMREPL


class RLM(dspy.Module):
    """Orchestrator for the Reasoning Language Model.

    This class manages the lifecycle of an RLM execution, including tool
    definition, ReAct loop configuration, and asynchronous streaming of
    reasoning steps.

    Attributes:
        repl: Isolated REPL instance for code execution.
        step_callback: Optional callback for real-time step capture.
        loop: Optional asyncio event loop for thread-safe callbacks.
        status_provider: Custom provider for DSPy execution status.
        execute_python_tool: DSPy-wrapped tool for REPL interaction.
        react: The core ReAct agent module.
    """

    def __init__(self,
                 context: str,
                 enable_sub_llm: bool = True,
                 step_callback: Optional[Callable[[dict], Any]] = None,
                 loop=None):
        """Initializes the RLM instance.

        Args:
            context: Background information for the reasoning task.
            enable_sub_llm: Whether to enable recursive sub-LLM calls.
            step_callback: Function to invoke for reasoning trajectory updates.
            loop: Optional asyncio event loop.
        """
        super().__init__()
        self.repl = RLMREPL(context)
        self.step_callback = step_callback
        self.loop = loop
        self.enable_sub_llm = enable_sub_llm
        self.context_length = len(context)

        # Create status provider for shared callback logic
        self.status_provider = RLMStatusMessageProvider(
            step_callback, loop=loop) if step_callback else None

        def llm_query(prompt: str) -> str:
            """Recursively calls a sub-LM on parts of the context.

            Args:
                prompt: The query string for the sub-LM.

            Returns:
                str: The generated response from the sub-LM.
            """
            start_time = time.time()
            logger.info(f"Recursive LLM Query: {prompt[:100]}...")

            sub_agent = dspy.Predict("prompt -> response")
            result = sub_agent(prompt=prompt)

            duration = time.time() - start_time

            if self.step_callback and self.status_provider:
                step_id = self.status_provider._next_id()
                step_data = {
                    "id": step_id,
                    "parent_id": self.status_provider._current_parent(),
                    "type": "sub_llm_call",
                    "content": prompt,
                    "output": result.response,
                    "metadata": {
                        "time": duration,
                        "tokens":
                            len(prompt.split()) + len(result.response.split())
                    }
                }
                if self.loop:
                    self.loop.call_soon_threadsafe(self.step_callback,
                                                  step_data)
                else:
                    self.step_callback(step_data)

            return result.response

        # Store llm_query function for later conditional registration
        self._llm_query_func = llm_query

        def execute_python(code: str) -> str:
            """Executes Python code in the RLM REPL.

            Args:
                code: The Python snippet to execute.

            Returns:
                str: Formatted output or error message from the REPL.
            """
            logger.info(
                f"REPL execute_python called with code: {code[:100]}...")
            start_time = time.time()
            result = self.repl.execute(code)
            duration = time.time() - start_time
            logger.info(
                f"REPL result: success={result['success']}, "
                f"output={str(result.get('output', ''))[:50]}...")

            # Emit code execution step
            if self.step_callback and self.status_provider:
                step_id = self.status_provider._next_id()
                step_data = {
                    "id": step_id,
                    "parent_id": self.status_provider._current_parent(),
                    "type": "code_execution",
                    "content": code,
                    "output":
                        result["output"] if result["success"] else
                        result["error"],
                    "metadata": {"time": duration}
                }
                try:
                    if self.loop:
                        self.loop.call_soon_threadsafe(self.step_callback,
                                                      step_data)
                    else:
                        self.step_callback(step_data)
                except Exception as e:
                    logger.error(f"Failed to emit code_execution: {e}")

            if result["success"]:
                return (f"Output: {result['output']}\n"
                        f"Variables: {list(result['variables'].keys())}")
            else:
                return f"Error: {result['error']}"

        self.execute_python_tool = dspy.Tool(
            execute_python,
            name="execute_python",
            desc=(
                "Execute Python code in an isolated REPL. The REPL has access "
                "to the document via a variable called 'context'. Use this to "
                "read, search, and analyze the document before answering."
            )
        )

        # Only register llm_query if sub-LLM is enabled
        if self.enable_sub_llm:
            self.repl.add_tool("llm_query", self._llm_query_func)

        # Create signature with context metadata
        RLMSignature = create_rlm_signature(
            context_total_length=self.context_length,
            enable_sub_llm=self.enable_sub_llm
        )

        self.react = dspy.ReAct(RLMSignature,
                                tools=[self.execute_python_tool])

    async def aforward(self, query: str) -> dspy.Prediction:
        """Executes the RLM asynchronously using streaming.

        Args:
            query: The user query string to process.

        Returns:
            dspy.Prediction: The final prediction containing the answer.

        Raises:
            Exception: If an error occurs during reasoning recovery or streaming.
        """
        start_time = time.time()

        # Emit initial thinking status
        if self.step_callback and self.status_provider:
            step_id = self.status_provider._next_id()
            step_data = {
                "id": step_id,
                "parent_id": None,
                "type": "thinking",
                "content": f"Processing query: {query}",
                "metadata": {"time": 0}
            }
            if self.loop:
                self.loop.call_soon_threadsafe(self.step_callback, step_data)
            else:
                self.step_callback(step_data)

        # Configure streaming with the custom status provider
        status_provider = self.status_provider
        stream_listeners = [
            dspy.streaming.StreamListener(signature_field_name="answer"),
        ]

        streamed_react = dspy.streamify(
            self.react,
            stream_listeners=stream_listeners,
            status_message_provider=status_provider,
            async_streaming=True
        )

        final_prediction = None

        try:
            async for chunk in streamed_react(query=query):  # type: ignore # dspy dynamic typing
                if isinstance(chunk, dspy.streaming.StatusMessage):
                    logger.debug(f"Status: {chunk.message}")
                elif isinstance(chunk, dspy.Prediction):
                    final_prediction = chunk

        except Exception as e:
            # Unwrap ExceptionGroup to get actual root cause
            actual_error = e
            # ExceptionGroup check using getattr for python < 3.11 compat and typing
            if hasattr(e, 'exceptions'):
                for sub_exc in getattr(e, 'exceptions', []):
                    # Use comma to avoid f-string formatting of exception message containing braces
                    logger.error(f"Streaming sub-exception: {type(sub_exc).__name__}", sub_exc)
                    actual_error = sub_exc

            # Check if this is a recoverable parsing error (common DSPy issue)
            # We explicitly exclude RateLimitError/AuthenticationError as those should fail hard
            error_str = str(actual_error).lower()
            is_parsing_error = (
                (isinstance(actual_error, KeyError) or "error" in error_str)
                and "ratelimit" not in error_str
                and "authentication" not in error_str
            )

            if is_parsing_error:
                logger.warning(f"DSPy parsing error (recovering): {actual_error}")
                # Try to recover - the ReAct loop may have completed even if parsing failed
                # We'll return a fallback prediction
                if final_prediction is None:
                    final_prediction = dspy.Prediction(
                        answer="Analysis completed but response parsing failed. Please try again with a different query."
                    )
            else:
                logger.error("Streaming error", exc_info=True)
                if self.step_callback and self.status_provider:
                    step_id = self.status_provider._next_id()
                    step_data = {
                        "id": step_id,
                        "parent_id": None,
                        "type": "error",
                        "content": f"Streaming failed: {str(actual_error)}",
                        "metadata": {}
                    }
                    if self.loop:
                        self.loop.call_soon_threadsafe(self.step_callback,
                                                      step_data)
                    else:
                        self.step_callback(step_data)
                raise

        # Emit completion data
        duration = time.time() - start_time
        if self.step_callback and self.status_provider:
            step_id = self.status_provider._next_id()
            step_data = {
                "id": step_id,
                "parent_id": None,
                "type": "complete",
                "content": f"Completed in {duration:.2f}s",
                "output": final_prediction.answer if final_prediction else "",
                "metadata": {"time": duration}
            }
            if self.loop:
                self.loop.call_soon_threadsafe(self.step_callback, step_data)
            else:
                self.step_callback(step_data)

        if final_prediction is None:
            final_prediction = dspy.Prediction(
                answer="Error: No prediction returned")

        return final_prediction
