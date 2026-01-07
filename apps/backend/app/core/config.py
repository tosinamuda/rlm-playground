"""Configuration settings for the RLM Prototype.

This module defines the application settings using Pydantic's BaseSettings,
loading values from environment variables or a .env file.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings and environment variables.

    Attributes:
        DSPY_DEFAULT_MODEL: Primary model identifier for RLM execution.
    """
    DSPY_DEFAULT_MODEL: str = "openai/local-model"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
