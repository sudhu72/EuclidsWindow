# Docker Setup for Euclid's Window

## Quick Start

Just run:

```bash
./start.sh
```

That's it! The script will:
- Build the Docker containers
- Start all services (app + Ollama)
- Wait for everything to be ready
- Open the app at http://localhost:8000

## Available Scripts

| Script | Purpose |
|--------|---------|
| `./start.sh` | **Full build and start** - Use when code changes or first time |
| `./restart.sh` | **Quick restart** - No rebuild, just restart containers |
| `./stop.sh` | **Stop everything** - Shuts down all containers |
| `./docker-commands.sh` | **Show help** - Lists all available commands |

## Manual Commands

If you prefer manual control:

```bash
# Build and start
docker compose up -d --build

# Stop
docker compose down

# View logs
docker compose logs -f

# Check status
docker compose ps

# Shell into container
docker compose exec euclids-window sh

# Clean everything (including volumes)
docker compose down -v
```

## Configuration

The app uses these environment variables (configured in `docker-compose.yml`):

- `HOST_PORT` - Port to expose (default: 8000)
- `LOCAL_LLM_MODEL` - Ollama model to use (default: qwen2.5:1.5b)
- `LOCAL_LLM_BASE_URL` - Ollama URL (default: http://ollama:11434)

Override by creating a `.env` file:

```bash
HOST_PORT=8080
LOCAL_LLM_MODEL=qwen2.5:7b
```

## Troubleshooting

### Port already in use
Change the port in `.env` file or stop other services using port 8000.

### Docker not running
Start Docker Desktop before running `./start.sh`.

### Ollama taking too long
The first start downloads the LLM model (~1-2GB). Be patient!

### Changes not showing up
If you changed frontend files, use `./restart.sh`.
If you changed dependencies or Dockerfile, use `./start.sh` (full rebuild).

## Architecture

The setup includes:

1. **euclids-window** - Main FastAPI app serving frontend + backend
2. **ollama** - Local LLM service for the AI tutor

Data is persisted in Docker volumes:
- `ollama-data` - Downloaded LLM models
- `context-db` - Application database

## Development Workflow

1. **Code changes** → `./restart.sh` (quick)
2. **Dependency changes** → `./start.sh` (rebuild)
3. **Clean slate** → `docker compose down -v && ./start.sh`
