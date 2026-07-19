# Backend Deployment Guide

## Overview

To unlock all PDF-Tools features (OCR, format conversion, compression, etc.), you need to deploy the backend server. The backend provides server-side processing for features that cannot run in the browser.

## Deployment Architecture

**Recommended Setup:**
- **Frontend:** Vercel (static hosting, automatic deployments from Git)
- **Backend:** Railway (managed container hosting with Docker support)

## Prerequisites

- Docker & Docker Compose (for local testing)
- Railway account (free tier available)
- GitHub account

## Backend Deployment on Railway

### Step 1: Prepare Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select the `BryanC05/PDF-Tools` repository
4. Railway will auto-detect the `Dockerfile` in the backend directory

### Step 2: Configure Environment Variables

In Railway dashboard, set these environment variables:

```bash
# Required
PYTHON_VERSION=3.11
PORT=8000

# Optional - Biteship integration
BITESHIP_API_KEY=your_api_key_here
BITESHIP_API_URL=https://api.biteship.com
```

### Step 3: Deploy

Railway will automatically build and deploy using the `Dockerfile`. The process:

1. Installs system dependencies (LibreOffice, Tesseract OCR, Poppler)
2. Installs Python dependencies
3. Starts the FastAPI server on port 8000

### Step 4: Get Backend URL

Once deployed, Railway provides a URL like:
```
https://pdf-tools-backend-production-xxxx.up.railway.app
```

Copy this URL for the next step.

## Frontend Configuration

### Update Vite Configuration

In Vercel dashboard for your frontend project:

1. Go to Project Settings → Environment Variables
2. Add:
   ```
   VITE_API_URL=https://your-backend-url.up.railway.app
   ```

### Redeploy Frontend

Trigger a new deployment in Vercel to pick up the environment variable.

## Local Development

### Running Backend Locally

```bash
cd backend

# Build and run with Docker
docker-compose up --build

# Or run directly (requires system dependencies)
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Running Frontend Locally

```bash
cd frontend
npm install
npm run dev
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:8000
```

## API Endpoints

The backend exposes these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/merge` | POST | Merge multiple PDFs |
| `/split` | POST | Split PDF by page ranges |
| `/compress` | POST | Compress PDF to reduce size |
| `/ocr` | POST | Extract text from scanned PDFs |
| `/pdf-to-word` | POST | Convert PDF to DOCX |
| `/pdf-to-pptx` | POST | Convert PDF to PowerPoint |
| `/pdf-to-excel` | POST | Convert PDF to Excel |
| `/word-to-pdf` | POST | Convert Word to PDF |
| `/pptx-to-pdf` | POST | Convert PowerPoint to PDF |
| `/excel-to-pdf` | POST | Convert Excel to PDF |
| `/html-to-pdf` | POST | Convert HTML to PDF |
| `/repair` | POST | Repair corrupted PDF |
| `/pdf-to-pdf-a` | POST | Convert to PDF/A archive format |
| `/edit` | POST | Edit PDF content |

## Dockerfile Reference

The backend uses this Dockerfile:

```dockerfile
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libreoffice \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Testing the Deployment

1. Open the deployed frontend URL
2. Upload a test PDF
3. Try a backend-only feature (e.g., OCR)
4. Check Railway logs for any errors

## Troubleshooting

### Backend Fails to Start

- Check Railway logs for errors
- Verify environment variables are set
- Ensure Dockerfile is in the correct location

### Frontend Can't Connect

- Verify `VITE_API_URL` is set in Vercel
- Check for CORS errors in browser console
- Ensure backend allows the frontend domain

### Feature Not Working

- Check Railway logs for the specific request
- Verify file size limits (Railway has 50MB limit on free tier)
- Test locally first to isolate issues

## Scaling

### Railway Plans

- **Hobby:** Free tier, suitable for testing
- **Pro:** $5/month, more resources and longer build times
- **Team:** For production use

### Alternative Platforms

- **Render:** Similar to Railway, free tier available
- **Fly.io:** Developer-friendly, free allowance
- **AWS/GCP:** For enterprise deployments

## Security Considerations

1. **File Cleanup:** Backend deletes uploaded files after processing
2. **Rate Limiting:** Consider adding rate limits for production
3. **Authentication:** Add auth if exposing publicly
4. **HTTPS:** Railway provides automatic HTTPS

## Support

- GitHub Issues: [BryanC05/PDF-Tools](https://github.com/BryanC05/PDF-Tools/issues)
- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
