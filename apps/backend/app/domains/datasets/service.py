from typing import Any, Dict, List

from loguru import logger

from .loaders import load_longbench_v2


def get_longbench_tasks() -> List[Dict[str, Any]]:
    """Retrieves all tasks from the LongBench-v2 dataset.

    Returns:
        A list of task dictionaries.
    """
    return load_longbench_v2()


def ensure_datasets_cached() -> None:
    """Pre-caches the LongBench-v2 dataset during application startup.
    
    This improves latency for the first client request.
    """
    logger.info("Pre-caching datasets...")
    get_longbench_tasks()
    logger.info("Dataset pre-caching complete.")
