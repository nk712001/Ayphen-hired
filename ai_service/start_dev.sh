#!/bin/bash

# Determine which virtual environment to use
if [ -d "ai_venv" ]; then
    VENV_DIR="ai_venv"
    ACTIVATE_SCRIPT="ai_venv/bin/activate"
elif [ -d "env" ]; then
    VENV_DIR="env"
    ACTIVATE_SCRIPT="env/bin/activate"
elif [ -d "venv" ]; then
    VENV_DIR="venv"
    if [ -f "venv/bin/activate" ]; then
        ACTIVATE_SCRIPT="venv/bin/activate"
    else
        ACTIVATE_SCRIPT="venv/Scripts/activate"
    fi
else
    echo "Warning: No virtual environment found. Installing packages globally..."
    # pip install -r requirements.txt
    ACTIVATE_SCRIPT=""
fi

# Activate virtual environment if it exists
if [ -n "$ACTIVATE_SCRIPT" ]; then
    echo "Activating virtual environment: $ACTIVATE_SCRIPT"
    source "$ACTIVATE_SCRIPT"
fi

# Start the AI service in HTTP mode (no SSL)
echo "Starting AI service in HTTP mode (Development)..."
uvicorn main:app --host 0.0.0.0 --port 8000
