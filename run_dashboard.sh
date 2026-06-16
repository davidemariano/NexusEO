#!/bin/bash
set -e

echo "======================================================"
echo "    Starting Terrascope Dashboard"
echo "======================================================"

# 1. Setup Backend
echo "[1/2] Setting up Backend..."
cd backend
if [ ! -d ".venv" ]; then
    python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r requirements.txt
echo "Starting FastAPI on port 8000..."
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# 2. Setup Frontend
echo "[2/2] Setting up Frontend..."
cd frontend
npm install
echo "Starting Angular on port 4200..."
npm start &
FRONTEND_PID=$!
cd ..

echo "======================================================"
echo "Dashboard is running!"
echo "Backend: http://localhost:8000/docs (Swagger UI)"
echo "Frontend: http://localhost:4200/"
echo "Press Ctrl+C to stop both servers."
echo "======================================================"

# Wait for Ctrl+C
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
