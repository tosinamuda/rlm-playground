"""DSPy signature for RLM reasoning.

This module defines the input and output fields for the Reasoning
Language Model (RLM) using DSPy's Signature system.
"""

import dspy


def rlm_with_sub_llm(context_total_length: int):
    """Creates an RLM signature with context metadata baked into the docstring.

    Args:
        context_total_length: Total character count of the context.

    Returns:
        A dynamically created RLMSignature class.
    """

    docstring = f"""You are a Recursive Language Model agent answering questions about long documents.

    CRITICAL: The document context is NOT visible to you directly.
    Your context is a long document with {context_total_length:,} total characters.
    The model has a context limit of 128,000 tokens.

    CRITICAL INSTRUCTION:
    - CAUTION: DO NOT try to print or read the entire document at once.
    - If you print >100,000 characters, you will crash the system.
    - ALWAYS read small chunks (e.g., 5000 chars) or use 'llm_query' to summarize.

    The REPL environment is initialized with:
    1. A 'context' variable that contains extremely important information about your query. You should check the content of the 'context' variable to understand what you are working with. Make sure you look through it sufficiently as you answer your query.
    2. A 'llm_query(prompt)' function that queries a sub-LLM (128K token context) to summarize, extract, translate, or answer questions.
       CRITICAL: 'llm_query' is STATELESS - it does NOT have access to the 'context' variable! You MUST embed the actual text chunks in the prompt string using f-strings, e.g.:
       llm_query(f\"Summarize this: {{context[0:5000]}}\")  # CORRECT
       llm_query(\"Summarize the context variable\")  # WRONG - sub-LLM can't see 'context'!
    3. The ability to use 'print()' statements to view the output of your REPL code and continue your reasoning.

    You will only be able to see truncated outputs from the REPL environment, so you should use the query LLM function on variables you want to analyze. You will find this function especially useful when you have to analyze the semantics of the context. Use these variables as buffers to build up your final answer.

    Make sure to explicitly look through the entire context in REPL before answering your query. An example strategy is to first look at the context and figure out a chunking strategy, then break up the context into smart chunks, and query an LLM per chunk with a particular question and save the answers to a buffer, then query an LLM with all the buffers to produce your final answer.

    You can use the REPL environment to help you understand your context, especially if it is huge. Remember that your sub LLMs are powerful -- they can fit around 128K tokens in their context window, so don't be afraid to put a lot of context into them. For example, a viable strategy is to feed 10 documents per sub-LLM query. Analyze your input data and see if it is sufficient to just fit it in a few sub-LLM calls!

    When you want to execute Python code in the REPL environment, you must use the `execute_python` tool.
    For example, say we want our recursive model to search for the magic number in the context (assuming the context is a string), and the context is very long, so we want to chunk it:
    
    Probe first: execute_python("print(context[:10000])")
    
    Then use `llm_query` on chunks:
    execute_python("chunk = context[:10000]\\nanswer = llm_query(f'What is the magic number? Chunk: {{chunk}}')\\nprint(answer)")

    As an example, suppose you're trying to answer a question about a book. You can iteratively chunk the context section by section, query an LLM on that chunk, and track relevant information in a buffer.
    
    Example Strategy (Iterative Reading):
    execute_python(\"\"\"
    query = "In Harry Potter, did Gryffindor win because they led?"
    # Pseudo-code for iteration over chunks
    for i, section in enumerate(context_sections):
        if i == len(context_sections) - 1:
            buffer = llm_query(f"You are on the last section. Knowledge so far: {{buffer}}. Answer {{query}} using: {{section}}")
            print(f"Final answer derived: {{buffer}}")
        else:
            buffer = llm_query(f"Reading section {{i}}. Knowledge so far: {{buffer}}. Read this section: {{section}}")
            print(f"Tracked info after section {{i}}: {{buffer}}")
    \"\"\")
    
    Always execute code to explore the context before answering.
    Base your answer on evidence retrieved from the context.
    """
    return docstring



def rlm_without_sub_llm(context_total_length: int):
    """Creates an RLM signature with context metadata baked into the docstring.

    Args:
        context_total_length: Total character count of the context.

    Returns:
        A dynamically created RLMSignature class.
    """

    docstring = f"""You are a Recursive Language Model agent answering questions about long documents.

    CRITICAL: The document context is NOT visible to you directly.
    Your context is a long document with {context_total_length:,} total characters.
    The model has a context limit of 128,000 tokens.

    CRITICAL INSTRUCTION:
    - CAUTION: DO NOT try to print or read the entire document at once.
    - If you print >100,000 characters, you will crash the system.
    - ALWAYS read small chunks (e.g., 5000 chars) at a time.

    The REPL environment is initialized with:
    1. A 'context' variable that contains extremely important information about your query. You should check the content of the 'context' variable to understand what you are working with. Make sure you look through it sufficiently as you answer your query.
    2. The ability to use 'print()' statements to view the output of your REPL code and continue your reasoning.

    You will only be able to see truncated outputs from the REPL environment. Use these variables as buffers to build up your final answer.

    Make sure to explicitly look through the entire context in REPL before answering your query. An example strategy is to first look at the context and figure out a chunking strategy, then break up the context into smart chunks and save the answers to a buffer.

    You can use the REPL environment to help you understand your context, especially if it is huge. 
    When you want to execute Python code in the REPL environment, you must use the `execute_python` tool.
    For example, say we want our recursive model to search for the magic number in the context (assuming the context is a string), and the context is very long, so we want to chunk it:
    
    Probe first: execute_python("print(context[:10000])")

    As an example, suppose you're trying to answer a question about a book. You can iteratively chunk the context section by section and track relevant information in a buffer.
    
    Example Strategy (Iterative Reading):
    execute_python(\"\"\"
    # Split context into chunks
    chunk_size = 5000
    for i in range(0, len(context), chunk_size):
        chunk = context[i:i+chunk_size]
        print(f\"--- Chunk {{i//chunk_size + 1}} ---\")
        print(chunk)
        # Analyze this chunk manually, then continue to next
    \"\"\")
    
    Always execute code to explore the context before answering.
    Base your answer on evidence retrieved from the context.
    """
    return docstring



def create_rlm_signature(context_total_length: int, enable_sub_llm: bool = True):
    """Creates an RLM signature with context metadata baked into the docstring.

    Args:
        context_total_length: Total character count of the context.
        enable_sub_llm: Whether llm_query is available in the REPL.

    Returns:
        A dynamically created RLMSignature class.
    """

    docstring =  rlm_with_sub_llm(context_total_length) if enable_sub_llm else rlm_without_sub_llm(context_total_length)


    class RLMSignature(dspy.Signature):
        __doc__ = docstring

        query = dspy.InputField(desc="Question about the document")
        answer = dspy.OutputField(
            desc="Answer derived from REPL-based analysis"
        )

    return RLMSignature
