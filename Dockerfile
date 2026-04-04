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
COPY scripts/docker-entrypoint.sh /app/scripts/docker-entrypoint.sh

RUN mkdir -p /app/backend/data/context_db

# Pre-download ChromaDB's ONNX embedding model so the first request
# doesn't block for ~10s while it fetches 80 MB.
RUN python -c "import chromadb; c=chromadb.Client(); col=c.get_or_create_collection('warmup'); col.add(ids=['w'],documents=['warmup']); c.delete_collection('warmup')"

WORKDIR /app/backend

ENV PYTHONUNBUFFERED=1
ENV LOCAL_AI_ENABLED=true

EXPOSE 8000

ENTRYPOINT ["/app/scripts/docker-entrypoint.sh"]
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
