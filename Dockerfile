# --- Stage 1: build the React/Vite frontend (chat + voice) ---
FROM node:20-slim AS react-build
WORKDIR /build
COPY frontend-react/package.json frontend-react/package-lock.json* ./
RUN npm install
COPY frontend-react/ ./
RUN npm run build

# --- Stage 2: the app image ---
FROM python:3.10-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        pkg-config \
        libcairo2 \
        libcairo2-dev \
        libpango-1.0-0 \
        libpango1.0-dev \
        libpangocairo-1.0-0 \
        libpangoft2-1.0-0 \
        libglib2.0-0 \
        ffmpeg \
        curl \
        texlive-latex-base \
        texlive-latex-recommended \
        texlive-latex-extra \
        texlive-fonts-recommended \
        dvisvgm \
        tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/backend/requirements.txt
# Prefer CPU wheels for torch/torchaudio to keep images smaller
ENV PIP_EXTRA_INDEX_URL="https://download.pytorch.org/whl/cpu"
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY backend /app/backend
COPY frontend /app/frontend
COPY --from=react-build /build/dist /app/frontend-react/dist
COPY scripts/docker-entrypoint.sh /app/scripts/docker-entrypoint.sh

RUN mkdir -p /app/backend/data/context_db

# Pre-download ChromaDB's ONNX embedding model so the first request
# doesn't block for ~10s while it fetches 80 MB.
RUN python -c "import chromadb; c=chromadb.Client(); col=c.get_or_create_collection('warmup'); col.add(ids=['w'],documents=['warmup']); c.delete_collection('warmup')"

# Kokoro-82M voice (Apache-2.0) for story-animation voice-overs, ~350 MB.
# Baked in so narration works offline; narration.py degrades to silent videos
# if these files are missing.
RUN mkdir -p /app/models/kokoro \
    && curl -sSfL -o /app/models/kokoro/kokoro-v1.0.onnx \
        https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx \
    && curl -sSfL -o /app/models/kokoro/voices-v1.0.bin \
        https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

WORKDIR /app/backend

ENV PYTHONUNBUFFERED=1
ENV LOCAL_AI_ENABLED=true

EXPOSE 8000

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
# Single worker: the app holds stateful in-process singletons (the continuous
# learner/crawler, model registry) that must not be duplicated across workers.
# Concurrency is fine — request handlers are async and LLM calls run in threads.
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
