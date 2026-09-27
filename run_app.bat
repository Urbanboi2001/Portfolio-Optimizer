@echo off
echo Starting Portfolio Tracker App...

echo Starting Backend...
start cmd /k "cd backend && call venv\Scripts\activate && uvicorn main:app --reload --port 8001"

echo Starting Frontend...
start cmd /k "cd frontend && npm run dev"

echo App is starting. The backend will be at http://localhost:8001 and the frontend typically at http://localhost:5173
