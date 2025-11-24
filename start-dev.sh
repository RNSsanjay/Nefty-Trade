#!/bin/bash

echo "Starting Nefty-Trade Application..."

# Function to kill background processes on exit
cleanup() {
    echo "Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Set up trap to cleanup on exit
trap cleanup EXIT INT TERM

# Start backend
echo "Starting backend on port 5000..."
cd nifty-backend
npm start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend on port 8080..."
cd ../nifty-play-studio
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Backend running on: http://localhost:5000"
echo "✅ Frontend running on: http://localhost:8080"
echo "✅ API Health check: http://localhost:5000/health"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for background processes
wait