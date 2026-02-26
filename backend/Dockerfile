FROM python:3.11-slim

# Install system dependencies for PDF processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create required directories
RUN mkdir -p uploads merged

# Railway provides PORT env var
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
