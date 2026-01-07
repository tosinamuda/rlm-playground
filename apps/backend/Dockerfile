# syntax=docker/dockerfile:1.4
# Backend Dockerfile - RLM API Service
# Build: gcr.io/distroless/python3-debian12 (via uv for package installation)
# Runtime: gcr.io/distroless/python3-debian12:nonroot

# ============================================
# Stage 1: Build (install dependencies with uv)
# Note: We use uv image because distroless has no package manager.
#       uv builds packages for Python 3.11 to match distroless runtime.
# ============================================
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS builder

WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies (frozen, no dev deps)
RUN uv sync --frozen --no-dev --no-install-project

# Copy application code
COPY app ./app
COPY main.py ./
COPY scripts ./scripts

# Pre-cache datasets during build
# We set PYTHONPATH to include current dir so imports work
ENV PYTHONPATH="/app"
RUN uv run python scripts/precache_datasets.py

# ============================================
# Stage 2: Runtime (gcr.io/distroless, nonroot)
# ============================================
FROM gcr.io/distroless/python3-debian12:nonroot

WORKDIR /app

# Copy site-packages from the venv to where distroless python expects them
COPY --from=builder /app/.venv/lib/python3.11/site-packages /home/nonroot/.local/lib/python3.11/site-packages

# Copy application code
COPY --from=builder /app/app ./app
COPY --from=builder /app/main.py ./

# Copy pre-generated cache (from the builder stage, we need to generate it there first)
# Note: We need to modify the builder stage to generate this.
COPY --from=builder /app/app/domains/datasets/cache ./app/domains/datasets/cache

# Set Python path
ENV PYTHONPATH="/home/nonroot/.local/lib/python3.11/site-packages:/app"
ENV PYTHONUNBUFFERED=1

# Expose API port
EXPOSE 8000

# Run uvicorn using distroless python
ENTRYPOINT ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
