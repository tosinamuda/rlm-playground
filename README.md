# RLM Prototype

Reasoning Language Model playground with Next.js frontend and FastAPI backend.

## Quick Start (Docker)

```bash
# Copy environment file
cp apps/frontend/.env.example apps/frontend/.env
cp apps/backend/.env.example apps/backend/.env

# Edit .env with your API keys
# Then build and run
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

## Development

Requirements: Node.js 20+, Python 3.12+, [uv](https://docs.astral.sh/uv/)

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd apps/backend && uv sync

# Start all services
npm run dev
```

## Environment Variables

Set in `apps/backend/.env`:

| Variable             | Description                | Example                    |
| -------------------- | -------------------------- | -------------------------- |
| `DSPY_DEFAULT_MODEL` | LiteLLM model identifier   | `openai/gpt-4o`            |
| `OPENAI_API_KEY`     | OpenAI API key             | `sk-...`                   |
| `OPENAI_API_BASE`    | Custom endpoint (optional) | `http://localhost:8080/v1` |
| `OPENROUTER_API_KEY` | OpenRouter key (if using)  | `sk-or-...`                |
| `ANTHROPIC_API_KEY`  | Anthropic key (if using)   | `sk-ant-...`               |

## Project Structure

```
apps/
├── frontend/    # Next.js 16, React 19, Tailwind
└── backend/     # FastAPI, DSPy, uv
```

## Docker Images

| Service  | Build                             | Runtime                                      |
| -------- | --------------------------------- | -------------------------------------------- |
| Backend  | `ghcr.io/astral-sh/uv:python3.11` | `gcr.io/distroless/python3-debian12:nonroot` |
| Frontend | `ubi10/nodejs-24-minimal`         | `registry.access.redhat.com/ubi10/nginx-126` |
