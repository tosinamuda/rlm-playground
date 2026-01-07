"""Custom status message provider for DSPy streaming in RLM.

This module implements a StatusMessageProvider that captures the reasoning
trajectory of a ReAct agent, including LM calls, tool executions, and module
nesting, and emits them via a callback for real-time frontend updates.
"""

import re
import time
from typing import Any, Dict, List, Optional, Callable

import dspy
import dspy.streaming
from loguru import logger


class RLMStatusMessageProvider(dspy.streaming.StatusMessageProvider):
    """Provider for real-time status updates during RLM execution.

    This class intercepts DSPy execution events to build a tree-structured
    reasoning trajectory.

    Attributes:
        callback: Function invoked for each emitted status step.
        loop: Asyncio event loop for thread-safe callback invocation.
        step_times: Dictionary tracking the start time of active steps.
        step_id: Internal counter for generating unique step IDs.
        module_stack: Stack of active module/tool IDs for parent tracking.
    """

    def __init__(self, callback: Callable, loop=None):
        """Initializes the provider.

        Args:
            callback: The callback function for status updates.
            loop: Optional asyncio event loop.
        """
        self.callback = callback
        self.loop = loop
        self.step_times: Dict[str, float] = {}
        self.step_id = 0
        self.module_stack: List[int] = []

    def _next_id(self) -> int:
        """Generates the next unique step ID.

        Returns:
            int: The incremented step ID.
        """
        self.step_id += 1
        return self.step_id

    def _current_parent(self) -> Optional[int]:
        """Gets the ID of the current parent module.

        Returns:
            Optional[int]: The active parent ID or None if at root.
        """
        return self.module_stack[-1] if self.module_stack else None

    def _emit(self, step_data: Dict[str, Any]):
        """Emits step data via the callback in a thread-safe manner.

        Args:
            step_data: Dictionary containing step information.
        """
        if not self.callback:
            return

        if self.loop:
            try:
                self.loop.call_soon_threadsafe(self.callback, step_data)
            except Exception as e:
                logger.warning(f"Failed to emit step: {e}")
        else:
            self.callback(step_data)

    def lm_start_status_message(self, instance: Any, inputs: Any) -> str:
        """Called when an LM call starts.

        Args:
            instance: The LM instance.
            inputs: The inputs to the LM call.

        Returns:
            str: A status message for the DSPy stream.
        """
        self.step_times['lm'] = time.time()
        step_id = self._next_id()
        prompt_preview = str(inputs)

        self._emit({
            "id": step_id,
            "parent_id": self._current_parent(),
            "type": "lm_call_start",
            "content": prompt_preview,
            "metadata": {
                "model": getattr(instance, 'model', 'unknown'),
            }
        })
        
        return "Thinking..."

    def lm_end_status_message(self, outputs: Any) -> str:
        """Called when an LM call ends to capture reasoning and actions.

        Args:
            outputs: The outputs from the LM call.

        Returns:
            str: A status message for the DSPy stream.
        """
        duration = time.time() - self.step_times.get('lm', time.time())
        step_id = self._next_id()
        output_str = str(outputs)

        # Extract structured ReAct components
        thought = ""
        tool_name = ""
        tool_args = ""

        thought_match = re.search(
            r"next_thought['\"]?\s*[:=]\s*['\"]([^'\"]+)['\"]", output_str)
        if thought_match:
            thought = thought_match.group(1)

        tool_match = re.search(
            r"next_tool_name['\"]?\s*[:=]\s*['\"]([^'\"]+)['\"]", output_str)
        if tool_match:
            tool_name = tool_match.group(1)

        args_match = re.search(
            r"next_tool_args['\"]?\s*[:=]\s*(\{[^}]+\}|['\"][^'\"]+['\"])",
            output_str)
        if args_match:
            tool_args = args_match.group(1)

        if thought or tool_name:
            content = f"Thought: {thought}\n\nAction: {tool_name}"
            if tool_args:
                content += f"\nArgs: {tool_args}"
        else:
            content = output_str

        self._emit({
            "id": step_id,
            "parent_id": self._current_parent(),
            "type": "lm_call_end",
            "content": content,
            "output": output_str,
            "metadata": {"time": duration, "tool_name": tool_name}
        })
        return "Decision made."

    def tool_start_status_message(self, instance: Any, inputs: Any) -> str:
        """Called when a tool execution starts.

        Args:
            instance: The tool instance.
            inputs: The inputs to the tool.

        Returns:
            str: A status message for the DSPy stream.
        """
        self.step_times['tool'] = time.time()
        step_id = self._next_id()
        tool_name = getattr(instance, 'name', 'unknown_tool')

        self._emit({
            "id": step_id,
            "parent_id": self._current_parent(),
            "type": "tool_call_start",
            "content": f"Calling {tool_name}",
            "metadata": {"tool": tool_name, "args": str(inputs)[:200]}
        })

        self.module_stack.append(step_id)
        return f"Executing {tool_name}..."

    def tool_end_status_message(self, outputs: Any) -> str:
        """Called when a tool execution ends.

        Args:
            outputs: The outputs from the tool.

        Returns:
            str: A status message for the DSPy stream.
        """
        duration = time.time() - self.step_times.get('tool', time.time())
        tool_id = self.module_stack.pop() if self.module_stack else None
        step_id = self._next_id()

        self._emit({
            "id": step_id,
            "parent_id": self._current_parent(),
            "type": "tool_call_end",
            "output": str(outputs),
            "metadata": {"time": duration, "tool_id": tool_id}
        })
        return "Tool complete."

    def module_start_status_message(self, instance: Any, inputs: Any) -> str:
        """Called when a DSPy module execution starts.

        Args:
            instance: The module instance.
            inputs: The inputs to the module.

        Returns:
            str: A status message for the DSPy stream.
        """
        module_name = instance.__class__.__name__
        self.step_times['module'] = time.time()
        step_id = self._next_id()

        self._emit({
            "id": step_id,
            "parent_id": self._current_parent(),
            "type": "module_start",
            "content": f"Starting {module_name}",
            "metadata": {"module": module_name}
        })

        self.module_stack.append(step_id)
        return f"Running {module_name}..."

    def module_end_status_message(self, outputs: Any) -> str:
        """Called when a DSPy module execution ends.

        Args:
            outputs: The outputs from the module.

        Returns:
            str: A status message for the DSPy stream.
        """
        duration = time.time() - self.step_times.get('module', time.time())
        module_id = self.module_stack.pop() if self.module_stack else None
        step_id = self._next_id()

        self._emit({
            "id": step_id,
            "parent_id": self._current_parent(),
            "type": "module_end",
            "output": str(outputs),
            "metadata": {"time": duration, "module_id": module_id}
        })
        return "Module complete."
