import logging
import time
from typing import Dict, Callable

import dspy

logger = logging.getLogger(__name__)


class RLMStatusMessageProvider(dspy.streaming.StatusMessageProvider):
    """
    Custom status message provider for ReAct trajectory display with tree structure.
    
    Each step emits:
    - id: Unique step identifier
    - parent_id: ID of parent module for tree nesting
    - type: Step type (module_start, lm_call_start, etc.)
    
    This allows the frontend to build a proper nested tree view.
    """

    def __init__(self, callback: Callable, loop=None):
        self.callback = callback
        self.loop = loop
        self.step_times: Dict[str, float] = {}
        self.step_id = 0
        self.module_stack: list[int] = []  # Stack of module IDs for parent tracking

    def _next_id(self) -> int:
        """Generate next unique step ID."""
        self.step_id += 1
        return self.step_id

    def _current_parent(self) -> int | None:
        """Get current parent module ID."""
        return self.module_stack[-1] if self.module_stack else None

    def _emit(self, step_data: dict):
        """Thread-safe callback emission."""
        if not self.callback:
            return

        if self.loop:
            try:
                self.loop.call_soon_threadsafe(self.callback, step_data)
            except Exception as e:
                logger.warning(f"Failed to emit step: {e}")
        else:
            self.callback(step_data)

    def lm_start_status_message(self, instance, inputs):
        """Called when LM invoked - capture the prompt."""
        self.step_times['lm'] = time.time()
        step_id = self._next_id()

        prompt_preview = str(inputs)  # Full prompt, no truncation

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

    def lm_end_status_message(self, outputs):
        """Called when LM finishes - capture the thought and action (fires BEFORE tool execution)."""
        duration = time.time() - self.step_times.get('lm', time.time())
        step_id = self._next_id()

        output_str = str(outputs)

        # Try to extract structured ReAct output
        thought = ""
        tool_name = ""
        tool_args = ""

        import re

        # Extract next_thought
        thought_match = re.search(r"next_thought['\"]?\s*[:=]\s*['\"]([^'\"]+)['\"]", output_str)
        if thought_match:
            thought = thought_match.group(1)

        # Extract next_tool_name
        tool_match = re.search(r"next_tool_name['\"]?\s*[:=]\s*['\"]([^'\"]+)['\"]", output_str)
        if tool_match:
            tool_name = tool_match.group(1)

        # Extract next_tool_args (could be dict or code string)
        args_match = re.search(r"next_tool_args['\"]?\s*[:=]\s*(\{[^}]+\}|['\"][^'\"]+['\"])", output_str)
        if args_match:
            tool_args = args_match.group(1)  # Full args

        # Build a clean display of the decision
        if thought or tool_name:
            content = f"Thought: {thought}\n\nAction: {tool_name}"
            if tool_args:
                content += f"\nArgs: {tool_args}"
        else:
            # Fallback to raw output
            content = output_str  # Full output

        self._emit({
            "id": step_id,
            "parent_id": self._current_parent(),
            "type": "lm_call_end",
            "content": content,
            "output": output_str,  # Full output, no truncation
            "metadata": {"time": duration, "tool_name": tool_name}
        })
        return "Decision made."


    def tool_start_status_message(self, instance, inputs):
        """Called when tool starts - start a tool scope."""
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

        # Push onto stack so code_execution becomes child
        self.module_stack.append(step_id)
        return f"Executing {tool_name}..."

    def tool_end_status_message(self, outputs):
        """Called when tool finishes - close tool scope."""
        duration = time.time() - self.step_times.get('tool', time.time())

        # Pop the tool from stack
        tool_id = self.module_stack.pop() if self.module_stack else None

        step_id = self._next_id()
        self._emit({
            "id": step_id,
            "parent_id": self._current_parent(),  # Parent is now the module above
            "type": "tool_call_end",
            "output": str(outputs),  # Full output
            "metadata": {"time": duration, "tool_id": tool_id}
        })
        return "Tool complete."

    def module_start_status_message(self, instance, inputs):
        """Called when module starts - push onto parent stack."""
        module_name = instance.__class__.__name__
        logger.info(f"STATUS: module_start called for {module_name}")
        self.step_times['module'] = time.time()
        step_id = self._next_id()

        self._emit({
            "id": step_id,
            "parent_id": self._current_parent(),
            "type": "module_start",
            "content": f"Starting {module_name}",
            "metadata": {"module": module_name}
        })

        # Push this module onto stack - children will have this as parent
        self.module_stack.append(step_id)
        return f"Running {module_name}..."

    def module_end_status_message(self, outputs):
        """Called when module ends - pop from parent stack."""
        logger.info("STATUS: module_end called")
        duration = time.time() - self.step_times.get('module', time.time())

        # Pop the module from stack
        module_id = self.module_stack.pop() if self.module_stack else None


        step_id = self._next_id()
        self._emit({
            "id": step_id,
            "parent_id": self._current_parent(),  # Parent is now the module above
            "type": "module_end",
            "output": str(outputs),  # Full output
            "metadata": {"time": duration, "module_id": module_id}
        })
        return "Module complete."
