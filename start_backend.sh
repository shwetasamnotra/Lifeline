#!/bin/bash
# LIFELINE 2.0 — Backend Startup Script
# Uses system Python 3.12 (stable macOS build)

set -e

PYTHON=/usr/local/bin/python3.12
BACKEND_DIR="$(cd "$(dirname "$0")/backend" && pwd)"

echo "==================================="
echo "  LIFELINE 2.0 — Backend Server"
echo "==================================="

cd "$BACKEND_DIR"

# Check if venv exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    "$PYTHON" -m venv venv
    echo "Installing dependencies..."
    venv/bin/pip install -r requirements.txt
fi

# Copy env file if .env doesn't exist
if [ ! -f ".env" ]; then
    cp ../.env.example .env
    echo "Created .env from .env.example"
fi

echo ""
echo "Starting FastAPI server at http://localhost:8000"
echo "API docs at http://localhost:8000/docs"
echo ""

venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
