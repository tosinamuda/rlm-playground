"""Pytest configuration for backend tests.

Adds the app directory to the Python path to enable imports.
"""

import sys
from pathlib import Path

# Add the backend app directory to sys.path
app_dir = Path(__file__).parent.parent / "app"
sys.path.insert(0, str(app_dir))
