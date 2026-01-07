"""Loader for the LongBench-v2 dataset.

This module provides functions to load tasks from the LongBench-v2 dataset,
leveraging HuggingFace streaming and local caching for performance.
"""

from typing import Any, Dict, List

from datasets import load_dataset
from loguru import logger

from .cache import load_cached_samples, save_cached_samples



_MEMORY_CACHE: Dict[str, List[Dict[str, Any]]] = {}


def load_longbench_v2(num_samples: int = 50) -> List[Dict[str, Any]]:
    """Loads a subset of the LongBench-v2 dataset.

    Uses an in-memory cache to store loaded tasks, falling back to disk cache,
    and finally streaming from HuggingFace if necessary.

    Args:
        num_samples: Maximum number of samples to retrieve. Defaults to 50.

    Returns:
        A list of task dictionaries with context, query, answer, and metadata.
    """
    # 1. Check in-memory cache
    if "longbench_v2" in _MEMORY_CACHE:
        return _MEMORY_CACHE["longbench_v2"][:num_samples]

    # 2. Check disk cache
    cached = load_cached_samples("longbench_v2")
    if cached:
        _MEMORY_CACHE["longbench_v2"] = cached
        return cached[:num_samples]

    try:
        logger.info("Loading LongBench-v2 from HuggingFace (streaming)...")
        ds = load_dataset('THUDM/LongBench-v2', streaming=True, split='train')

        tasks = []
        for i, row in enumerate(ds):
            if i >= num_samples:
                break
            tasks.append({
                "context": row.get("context", ""),
                "query": row.get("question", ""),
                "answer": row.get("answer", ""),
                "metadata": {
                    "task_id": row.get("_id", i),
                    "dataset": "LongBench-v2",
                    "domain": row.get("domain", ""),
                    "difficulty": row.get("difficulty", ""),
                    "length": row.get("length", 0)
                }
            })

        if tasks:
            # Save to both disk and memory cache
            save_cached_samples("longbench_v2", tasks)
            _MEMORY_CACHE["longbench_v2"] = tasks

        return tasks
    except Exception as e:
        logger.error(f"Error loading LongBench-v2: {e}")
        return []
