# Euclid's Window Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for Manim
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    ffmpeg \
    texlive \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-science \
    dvipng \
    cm-super \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directories for animations and data
RUN mkdir -p static/animations

# Create non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
