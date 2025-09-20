#!/bin/bash

# Gesture Recognition System - Frontend Startup Script
# This script helps you start both the backend and frontend together

echo "🚀 Starting Gesture Recognition System with React Frontend"
echo "=========================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Install backend dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

echo ""
echo "🔧 Starting Backend Server (Node.js + WebSocket)..."
echo "   Server will run on http://localhost:3001"
echo ""

# Start the backend server in the background
npm start &
BACKEND_PID=$!

# Wait a moment for the backend to start
sleep 3

echo ""
echo "🎨 Starting React Frontend..."
echo "   Frontend will run on http://localhost:3000"
echo ""

# Start the frontend
cd frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers are starting up!"
echo ""
echo "📊 Backend API:  http://localhost:3001"
echo "🎨 Frontend UI:  http://localhost:3000"
echo ""
echo "🔍 To start gesture recognition:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Go to the Configure page to set up gesture mappings"
echo "   3. Run: python run.py --camera-index 1 --web-stream"
echo ""
echo "📝 Options:"
echo "   --web-stream: Stream camera to web frontend (no OpenCV window)"
echo "   --no-display: Run in headless mode"
echo "   --camera-index N: Use camera device N (default: 1)"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for either process to exit
wait
