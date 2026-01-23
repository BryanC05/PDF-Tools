# Simple PDF - Deployment Guide

## Architecture

This app consists of two parts:
- **Frontend**: React/Vite app → Deploy to **Vercel**
- **Backend**: Python/FastAPI API → Deploy to **Railway** (or Render/Fly.io)

---

## Step 1: Deploy Backend to Railway

### Option A: Railway (Recommended)
1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set the **Root Directory** to `backend`
5. Railway will auto-detect Python and use the `Procfile`
6. Once deployed, copy your backend URL (e.g., `https://your-app.railway.app`)

### Option B: Render
1. Go to [render.com](https://render.com) and sign up
2. Create a new **Web Service**
3. Connect your GitHub repository
4. Set **Root Directory** to `backend`
5. Set **Build Command** to `pip install -r requirements.txt`
6. Set **Start Command** to `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## Step 2: Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "New Project" → Import your GitHub repository
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   - **Name**: `VITE_API_URL`
   - **Value**: Your backend URL from Step 1 (e.g., `https://your-app.railway.app`)
5. Click "Deploy"

---

## Environment Variables

### Frontend (Vercel)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://your-backend.railway.app` |

### Backend (Railway/Render)
No environment variables required for basic deployment.

---

## Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

---

## Important Notes

1. **CORS**: The backend allows all origins (`*`). For production, update `main.py` to only allow your Vercel domain.

2. **File Storage**: Files are stored temporarily and cleaned up on:
   - Browser tab close
   - Server restart
   - Periodic cleanup

3. **Cost**: Both Railway and Vercel have free tiers suitable for small projects.

---

## Quick Deploy Buttons

[![Deploy Frontend to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/YOUR_REPO&root-directory=frontend)

[![Deploy Backend to Railway](https://railway.app/button.svg)](https://railway.app/template)
