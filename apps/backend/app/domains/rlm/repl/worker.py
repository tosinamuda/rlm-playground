"""Worker script for isolated RLM code execution.

This script runs in a subprocess and provides an environment for executing
Python code. It handles loading context, capturing print output, and proxying
tool calls back to the parent process via a text-based IPC protocol.
"""

import argparse
import builtins
import json
import pickle
import sys
import traceback
from typing import Any, Dict, List, Callable


def send_message(msg_type: str, data: Dict[str, Any]):
    """Sends a structured IPC message to the parent process via stdout.

    Args:
        msg_type: The category of the message (e.g., 'TOOL_CALL', 'RESULT').
        data: The payload to be JSON-encoded.
    """
    payload = json.dumps(data)
    sys.stdout.write(f"__{msg_type}__:{payload}\n")
    sys.stdout.flush()


def read_message() -> Any:
    """Reads a JSON response line from stdin sent by the parent process.

    Returns:
        Any: The decoded JSON payload.

    Raises:
        EOFError: If the parent process closes the connection.
    """
    line = sys.stdin.readline()
    if not line:
        raise EOFError("Parent process closed connection")
    return json.loads(line)


def create_tool_proxy(tool_name: str) -> Callable:
    """Creates a proxy function for a tool available in the parent process.

    Args:
        tool_name: The name of the tool to proxy.

    Returns:
        callable: A function that triggers an IPC request when called.
    """
    def proxy_func(*args):
        # 1. Send Request
        send_message("TOOL_CALL", {"name": tool_name, "args": args})

        # 2. Wait for Response
        response = read_message()

        # 3. Handle Result
        if response.get("status") == "success":
            return response.get("result")
        else:
            raise RuntimeError(
                f"Tool '{tool_name}' failed: {response.get('error')}")

    proxy_func.__name__ = tool_name
    return proxy_func


class OutputBuffer:
    """Captures and stores output from print() calls.

    Attributes:
        buffer: List of captured output strings.
    """

    def __init__(self):
        """Initializes the output buffer."""
        self.buffer: List[str] = []

    def print(self, *args, **kwargs):
        """Custom print implementation to buffer output instead of writing to stdout.

        Args:
            *args: Positional arguments to print.
            **kwargs: Keyword arguments for print (sep, end).
        """
        sep = kwargs.get('sep', ' ')
        end = kwargs.get('end', '\n')
        text = sep.join(str(arg) for arg in args) + end
        self.buffer.append(text)

    def get_output(self) -> str:
        """Joins and returns all captured output.

        Returns:
            str: The complete captured stdout.
        """
        return "".join(self.buffer)


def main():
    """Main execution loop for the worker script."""
    parser = argparse.ArgumentParser()
    parser.add_argument("--context", required=True)
    parser.add_argument("--code", required=True)
    parser.add_argument("--tools", default="")
    args = parser.parse_args()

    # 1. Load context data
    try:
        with open(args.context, "rb") as f:
            context_data = pickle.load(f)
    except Exception as e:
        send_message("RESULT", {
            "success": False,
            "error": f"Failed to load context: {e}",
            "output": ""
        })
        return

    # 2. Setup execution namespace
    output_buffer = OutputBuffer()
    usage_globals = {
        "context": context_data,
        "print": output_buffer.print,
        "__builtins__": builtins.__dict__.copy()
    }

    # Inject tool proxies into the namespace
    if args.tools:
        for tool_name in args.tools.split(","):
            tool_name = tool_name.strip()
            if tool_name:
                usage_globals[tool_name] = create_tool_proxy(tool_name)

    # 3. Load user code
    try:
        with open(args.code, "r", encoding="utf-8") as f:
            user_code = f.read()
    except Exception as e:
        send_message("RESULT", {
            "success": False,
            "error": f"Failed to load code: {e}",
            "output": ""
        })
        return

    # 4. Execute user code
    try:
        exec(user_code, usage_globals)

        # Build execution result
        result_data = {
            "success": True,
            "output": output_buffer.get_output(),
            "variables": {
                k: str(v) for k, v in usage_globals.items()
                if k not in ["context", "print", "__builtins__"]
                and not callable(v)
            }
        }
        send_message("RESULT", result_data)

    except Exception as e:
        err_msg = f"{str(e)}\n{traceback.format_exc()}"
        result_data = {
            "success": False,
            "error": err_msg,
            "output": output_buffer.get_output()
        }
        send_message("RESULT", result_data)


if __name__ == "__main__":
    main()
