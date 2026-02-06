# Euclid's Window

An AI-powered math learning app focused on clear explanations and visualizations, built from first principles.

## Features

### Interactive Math Map
- **Comprehensive visualization** of mathematics organized by 13 categories
- **60+ clickable topics** from Foundations to ML Mathematics
- **5 learning prompts per topic** - click to get detailed explanations
- Search across all topics and prompts
- Beautiful, colorful design inspired by "The Map of Mathematics"

### ML Mathematics Category (NEW)
- **LoRA** - Low-rank adaptation, SVD, matrix factorization
- **RAG** - Vector embeddings, cosine similarity, ANN search
- **Attention Mechanism** - Q/K/V formula, multi-head attention
- **Backpropagation** - Chain rule, gradients, autodiff
- **Loss Functions** - Cross-entropy, MSE, KL divergence
- **Neural Network Math** - Linear transforms, activations, softmax
- **Transformers** - Architecture, encoder/decoder, layer norm
- **Dimensionality Reduction** - PCA, t-SNE, UMAP

### Manim Animations (NEW)
- **Dynamic animation rendering** for mathematical concepts
- 3Blue1Brown-style visualizations
- Scenes: Pythagorean theorem, derivatives, integrals, LoRA, embeddings
- Supports GIF and MP4 output formats
- Caching to avoid re-rendering

### Core
- Natural language chat with math rendering (KaTeX)
- 4 visualization types (2 SVG + 2 Plotly)
- Conversation persistence (SQLite)

### Knowledge Graph
- Interactive D3.js concept graph with 23 mathematical concepts
- Prerequisites and learning paths
- Euclid's Elements integration (19 entries from Books I and VII)
- Curated resources (8 books, videos, courses)

### Auth & Personalization
- User registration and JWT authentication
- Learning progress tracking per concept
- User profiles with learning level preferences

### Observability
- Prometheus-compatible metrics endpoint (`/metrics`)
- Request duration histograms
- Health and readiness endpoints

### Deployment
- Docker and docker-compose ready
- DigitalOcean compatible
- Nginx reverse proxy config included

## Quick Start

### Local Development
```bash
cd EuclidsWindow
python3.10 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# Seed the database
cd backend && python scripts/seed_db.py

# Start server
uvicorn app.main:app --reload
```

Visit `http://127.0.0.1:8000/static/index.html`

### Docker
```bash
cp .env.example .env
# Edit .env with your settings
docker-compose up -d
```

Visit `http://localhost:3000`

## Environment Variables

See `.env.example` for all available options:
- `DATABASE_URL` - SQLite (local) or PostgreSQL (production)
- `JWT_SECRET` - Secret key for JWT tokens
- `OPENAI_API_KEY` - Optional, for LLM fallback

## Running Tests
```bash
source .venv/bin/activate
pip install -r backend/requirements-dev.txt
cd backend && pytest tests/ -v
```

## API Endpoints

### Health & Metrics
- `GET /health` - Liveness check
- `GET /ready` - Readiness check
- `GET /metrics` - Prometheus metrics

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PATCH /api/auth/me` - Update profile

### Progress
- `GET /api/progress` - List user's progress
- `PUT /api/progress/{concept_slug}` - Update progress

### Chat
- `POST /api/chat/message` - Send message

### Conversations
- `POST /api/conversations` - Create
- `GET /api/conversations` - List
- `GET /api/conversations/{id}` - Get with messages

### Mind Map
- `GET /api/mindmap/{concept_slug}` - Get concept graph
- `GET /api/concepts` - List concepts

### Math Map
- `GET /api/mathmap` - Get full interactive math map
- `GET /api/mathmap/categories` - List categories
- `GET /api/mathmap/category/{id}` - Get category with topics
- `GET /api/mathmap/topic/{id}` - Get topic with prompts
- `GET /api/mathmap/search?query=` - Search topics

### Animations (Manim)
- `GET /api/animations/scenes` - List available animation scenes
- `POST /api/animations/render` - Render an animation
- `GET /api/animations/{id}` - Get animation status/URL
- `GET /api/animations/status/manim` - Check Manim availability

### Euclid's Elements
- `GET /api/euclid/{reference}` - Get entry (e.g., I.47)
- `GET /api/euclid` - Search entries

### Resources
- `GET /api/resources` - Search resources
- `GET /api/resources/{id}` - Get resource
- `GET /api/concepts/{slug}/resources` - Resources for concept

## Project Structure
```
EuclidsWindow/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app
│   │   ├── config.py         # Settings
│   │   ├── models.py         # Pydantic models
│   │   ├── auth.py           # JWT auth
│   │   ├── cache.py          # In-memory cache
│   │   ├── metrics.py        # Prometheus metrics
│   │   ├── middleware.py     # Request metrics
│   │   ├── content.py        # Topic catalog
│   │   ├── llm.py            # LLM integration
│   │   ├── db/               # SQLAlchemy models
│   │   └── services/         # Business logic
│   ├── data/                 # Seed data JSON
│   ├── scripts/              # Database seeding
│   ├── static/               # Visualizations
│   └── tests/                # 89 tests
├── frontend/
│   ├── index.html            # Multi-tab UI
│   ├── app.js                # Application logic
│   ├── styles.css
│   ├── mathmap.html          # Interactive Math Map
│   ├── mathmap.js
│   └── mathmap.css
├── docker-compose.yml
├── nginx.conf
└── .env.example
```

## Demo Queries
- "Explain the Pythagorean theorem"
- "Show a number line"
- "Explain base conversion"
- "Graph a parabola"
- "What is a prime number?"
