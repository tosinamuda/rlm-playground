"""Caching utilities for dataset loaders.

This module provides a simple JSON-based caching mechanism to store and
retrieve sampled data from various benchmarks, reducing the need for
repeated downloads or expensive sampling operations.
"""

import io
import json
from pathlib import Path
from typing import Any, Dict, List

from loguru import logger

# Local cache directory for dataset samples, relative to this file.
CACHE_DIR = Path(__file__).parent.parent / "cache"
CACHE_DIR.mkdir(exist_ok=True)


def load_cached_samples(name: str) -> List[Dict[str, Any]]:
    """Loads previously cached samples for a dataset if they exist.

    Args:
        name: The registry name of the dataset (e.g., 'longbench_v2').

    Returns:
        A list of cached task dictionaries, or an empty list if no cache exists
        or an error occurs.
    """
    cache_file = CACHE_DIR / f"{name}.json"
    if cache_file.exists():
        try:
            with open(cache_file, encoding='utf-8') as f:
                data = json.load(f)
                return data
        except (IOError, json.JSONDecodeError) as e:
            logger.warning(f"Failed to load cache for {name}: {e}")
    return []


def save_cached_samples(name: str, data: List[Dict[str, Any]]):
    """Saves a list of dataset samples to the local JSON cache.

    Args:
        name: The registry name of the dataset.
        data: The list of task dictionaries to cache.
    """
    cache_file = CACHE_DIR / f"{name}.json"
    try:
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump(data, f)
        logger.info(f"Cached {len(data)} samples for {name}")
    except IOError as e:
        logger.warning(f"Failed to cache {name}: {e}")
