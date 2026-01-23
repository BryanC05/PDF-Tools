@echo off
start "PDF Backend" cmd /k "cd backend && python -m uvicorn main:app --reload --port 8000"
start "PDF Frontend" cmd /k "cd frontend && npm run dev"
echo Application starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
pause
