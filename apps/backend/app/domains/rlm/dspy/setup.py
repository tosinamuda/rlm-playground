"""DSPy configuration and setup for the RLM domain.

This module provides utilities to configure the DSPy environment, including
setting up the language model and managing model-specific configurations.
"""

from typing import Any, Optional

import dspy
import litellm

from ....core.config import settings


def setup_dspy(
    model: Optional[str] = None,
    **kwargs: Any
) -> dspy.LM:
    """Configures the global DSPy settings.

    By default, it uses settings.DSPY_DEFAULT_MODEL and relies on LiteLLM to discover
    environment variables (e.g., OPENAI_API_KEY, OPENAI_API_BASE) for authentication
    and routing.

    Args:
        model: Optional model identifier. Defaults to settings.DSPY_DEFAULT_MODEL.
        **kwargs: Additional arguments to pass to the dspy.LM constructor.

    Returns:
        dspy.LM: The configured language model instance.
    """
    lm_model = model or settings.DSPY_DEFAULT_MODEL

    # Set global LiteLLM settings
    litellm.set_verbose = False

    # Create dspy.LM. LiteLLM will automatically pick up environment
    # variables for API keys and base URLs based on the model prefix.
    lm = dspy.LM(model=lm_model, **kwargs)

    dspy.configure(lm=lm)
    return lm

