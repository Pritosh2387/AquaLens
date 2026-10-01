# ── Stage 1: base ───────────────────────────────────────────
FROM python:3.10-slim AS base

LABEL maintainer="AquaLens Team"
LABEL description="AquaLens FastAPI Backend — 17-Module Oil Spill ML Pipeline"

# Prevent .pyc files and enable stdout/stderr flushing
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# ── Stage 2: dependencies ───────────────────────────────────
FROM base AS deps

# Install system-level dependencies needed by some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libgl1-mesa-glx \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# ── Stage 3: app ────────────────────────────────────────────
FROM deps AS app

# Copy project source
COPY . .

# Create data directories expected by the pipeline
RUN mkdir -p data/mock data/raw data/processed

# Expose FastAPI port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/v1/health')" || exit 1

# Default command — override with docker run ... for other modes
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
