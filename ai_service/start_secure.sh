#!/bin/bash

# Check if certificates exist
CERT_FILE="../certs/cert.pem"
KEY_FILE="../certs/key.pem"

if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
    echo "Error: SSL certificates not found at $CERT_FILE and $KEY_FILE"
    exit 1
fi

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
    pip install -r requirements.txt
    ACTIVATE_SCRIPT=""
fi

# Install required packages if virtual environment exists
if [ -n "$ACTIVATE_SCRIPT" ]; then
    echo "Activating virtual environment: $ACTIVATE_SCRIPT"
    source "$ACTIVATE_SCRIPT"
    echo "Installing/updating required packages..."
    pip install -r requirements.txt
fi

# Start the AI service with HTTPS
echo "Starting AI service with HTTPS..."
uvicorn main:app --host 0.0.0.0 --port 8000 --ssl-keyfile "$KEY_FILE" --ssl-certfile "$CERT_FILE"
