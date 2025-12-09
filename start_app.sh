#!/bin/bash

echo "🌊 Starting Flood Risk Analysis App..."

# Kill any existing processes on ports 8000 (Backend) and 5173 (Frontend default)
lsof -ti :8000 | xargs kill -9 2>/dev/null
lsof -ti :5173 | xargs kill -9 2>/dev/null

# Start Backend
echo "🚀 Starting Backend (FastAPI)..."
source .venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start Frontend
echo "🚀 Starting Frontend (Vite)..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ App is running!"
echo "➡️  Frontend: http://localhost:5173"
echo "➡️  Backend:  http://localhost:8000/docs"
echo "PRESS CTRL+C TO STOP"

# Trap Ctrl+C to kill both
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
