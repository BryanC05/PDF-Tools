# Simple PDF - Deployment Guide

## Architecture

This app consists of two parts:
- **Frontend**: React/Vite app → Deploy to **Vercel**
- **Backend**: Python/FastAPI API → Deploy to **Railway** (or Render/Fly.io)

---

## Step 1: Deploy Backend to Railway

### Railway (Recommended)
The backend requires system-level dependencies (LibreOffice, Tesseract OCR, Poppler) to process documents. We have provided a `Dockerfile` that handles this automatically.

1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set the **Root Directory** to `/backend`
5. Railway will automatically detect the `Dockerfile` and build the container with all required system dependencies.
6. **Important**: Go to the **Settings -> Deploy** of your backend service. If there is anything inside the **Custom Start Command** box, **delete it** so it is completely empty. Railway must fall back natively to the Dockerfile CMD.
7. Once deployed and running successfully, copy your backend URL from the Settings -> Public Networking tab. It will look like `https://project-name.up.railway.app`.

---

## Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "New Project" → Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Expand "Environment Variables" and add:
   - **Name**: `VITE_API_URL`
   - **Value**: Your secure backend URL from Step 1 (e.g., `https://your-backend.up.railway.app`) - **No trailing slash!**
5. Click "Deploy"

---

## Environment Variables

### Frontend (Vercel)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://your-backend.up.railway.app` |

### Backend (Railway)
| Variable | Description | Example |
|----------|-------------|---------|
| `CORS_ORIGINS` | (Optional) Restrict backend access to specific origins | `https://your-frontend.vercel.app` |

---

## Local Development Requirements

Because of the document conversion and OCR features, the backend requires system dependencies to be installed locally if developing outside of Docker:
- `libreoffice`
- `tesseract`
- `poppler`

### Running Locally

```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

---

## Important Notes

1. **CORS**: The backend allows all origins (`*`) by default if `CORS_ORIGINS` is unset. For production, set `CORS_ORIGINS` in Railway to strictly allow only your Vercel domain.
2. **Method Not Allowed (405)**: If your frontend console reports a CORS 405 error, strictly ensure your Vercel `VITE_API_URL` uses `https://` and has **NO** trailing slash at the end.
3. **Port Binding**: The backend natively binds the `$PORT` variable via Python's `os.environ` to bypass shell expansion bugs across different container hosts. Always invoke it via `python main.py`.
