
import sys
import os
from pathlib import Path

# Add the project root to the python path so imports work
current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent
sys.path.insert(0, str(project_root))

from app.domains.datasets.service import ensure_datasets_cached

if __name__ == "__main__":
    print("Pre-caching datasets for Docker build...")
    try:
        ensure_datasets_cached()
        print("Successfully pre-cached datasets.")
    except Exception as e:
        print(f"Error during pre-caching: {e}")
        sys.exit(1)
