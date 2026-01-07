import logging

import dspy

logger = logging.getLogger(__name__)


class RLMSignature(dspy.Signature):
    """
    You are an RLM (Recursive Language Model) agent.
    Your goal is to answer a query by interacting with a Python REPL.
    
    The context is stored in a variable named `context` in the REPL.
    Use string slicing like context[:1000] to inspect parts of the context.
    Use `llm_query(prompt: str)` to recursively call a sub-LM on parts of the context.
    Use print() to output results.
    
    When you have the final answer, provide it directly.
    """
    query = dspy.InputField(desc="The user's question or task.")
    answer = dspy.OutputField(desc="The final answer to the query.")
