"""Isolated Python REPL for RLM execution.

This module provides the RLMREPL class, which executes Python code in a
separate subprocess with timeouts and resource limits. It enables safe
and reliable execution of generated code with support for tool callbacks.
"""

import json
import os
import pickle
import subprocess
import tempfile
from typing import Any, Callable, Dict

from loguru import logger

# Default execution limits
DEFAULT_TIMEOUT = 60  # seconds
MAX_OUTPUT_SIZE = 100000  # characters


class RLMREPL:
    """Subprocess-based Python REPL with IPC support.

    Attributes:
        context: Data context made available in the REPL's 'context' variable.
        timeout: Execution timeout in seconds.
        variables: Persistence of variables across executions (TBD).
        tools: Registered tool functions available via IPC.
    """

    def __init__(self, context: str, timeout: int = DEFAULT_TIMEOUT):
        """Initializes the RLMREPL.

        Args:
            context: Context data for code execution.
            timeout: Maximum execution time for a code snippet.
        """
        self.context = context
        self.timeout = timeout
        self.variables: Dict[str, Any] = {}
        self.tools: Dict[str, Callable] = {}

    def add_tool(self, name: str, func: Callable):
        """Registers a tool function for use in the REPL.

        Args:
            name: The name under which the tool will be available in code.
            func: The Python callable to execute when the tool is invoked.
        """
        self.tools[name] = func

    def execute(self, code: str) -> Dict[str, Any]:
        """Executes Python code in an isolated subprocess.

        Args:
            code: The Python code snippet to run.

        Returns:
            Dict[str, Any]: Execution results including 'success', 'output',
                'error', and 'variables'.
        """
        worker_script = os.path.join(os.path.dirname(__file__), "worker.py")
        if not os.path.exists(worker_script):
            return {
                "success": False,
                "error": f"Worker script not found: {worker_script}",
                "output": ""
            }

        context_file = None
        code_file = None

        try:
            # Write context to a pickle file
            with tempfile.NamedTemporaryFile(
                mode='wb', suffix='.pkl', delete=False
            ) as f:
                pickle.dump(self.context, f)
                context_file = f.name

            # Preprocess code to handle escaped characters from LLMs
            processed_code = code
            if r'\n' in code and '\n' not in code:
                processed_code = code.encode().decode('unicode_escape')
            elif code.count(r'\n') > code.count('\n') and r'\n' in code:
                try:
                    processed_code = code.encode().decode('unicode_escape')
                except Exception:
                    processed_code = code

            # Write processed code to a temporary file
            with tempfile.NamedTemporaryFile(
                mode='w', suffix='.py', delete=False, encoding='utf-8'
            ) as f:
                f.write(processed_code)
                code_file = f.name

            tool_names = ",".join(self.tools.keys())

            # Start the worker subprocess
            process = subprocess.Popen(
                ["python3", worker_script, "--context", context_file,
                 "--code", code_file, "--tools", tool_names],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=tempfile.gettempdir(),
                env={**os.environ, "PYTHONIOENCODING": "utf-8"},
                bufsize=1
            )

            final_result = None

            # Process stdout stream for IPC messages and results
            while True:
                try:
                    if not process.stdout:
                        break
                    line = process.stdout.readline()
                except Exception:
                    break

                if not line:
                    if process.poll() is not None:
                        break
                    continue

                if line.startswith('__TOOL_CALL__:'):
                    try:
                        self._handle_tool_call(line, process)
                    except Exception as e:
                        logger.error(f"Failed to handle tool call: {e}")

                elif line.startswith('__RESULT__:'):
                    try:
                        payload = line[11:].strip()
                        final_result = json.loads(payload)
                    except json.JSONDecodeError:
                        logger.error("Failed to decode result JSON")

            # Finalize process execution
            stdout, stderr = process.communicate()
            exit_code = process.returncode

            if final_result:
                return final_result
            else:
                return {
                    "success": False,
                    "error": (f"Process exited without result (Exit code "
                             f"{exit_code}). Stderr: {stderr}"),
                    "output": ""
                }

        except subprocess.TimeoutExpired:
            if 'process' in locals():
                process.kill()
            logger.warning(f"Code execution timed out after {self.timeout}s")
            return {
                "success": False,
                "error": f"Execution timed out after {self.timeout} seconds",
                "output": ""
            }
        except Exception as e:
            logger.error(f"Subprocess execution error: {e}")
            return {
                "success": False,
                "error": str(e),
                "output": ""
            }
        finally:
            # Cleanup temporary files
            for f_path in [context_file, code_file]:
                if f_path and os.path.exists(f_path):
                    try:
                        os.unlink(f_path)
                    except Exception:
                        pass

    def _handle_tool_call(self, line: str, process: subprocess.Popen):
        """Handles a tool call request from the worker process.

        Args:
            line: The IPC message line starting with '__TOOL_CALL__:'.
            process: The active subprocess handle.
        """
        try:
            payload = line[14:].strip()
            tool_data = json.loads(payload)
            tool_name = tool_data.get("name")
            tool_args = tool_data.get("args", [])

            logger.info(f"Received tool call: {tool_name}")

            if tool_name in self.tools:
                try:
                    result = self.tools[tool_name](*tool_args)
                    response = {"status": "success", "result": result}
                except Exception as e:
                    response = {"status": "error", "error": str(e)}
            else:
                response = {"status": "error", "error": f"Unknown tool: {tool_name}"}

            if process.stdin:
                process.stdin.write(json.dumps(response) + "\n")
                process.stdin.flush()

        except Exception as e:
            logger.error(f"Tool call processing error: {e}")
            try:
                if process.stdin:
                    process.stdin.write(
                        json.dumps({"status": "error", "error": "IPC Protocol Error"}) + "\n")
                    process.stdin.flush()
            except Exception:
                pass



