#!/bin/bash

echo "Installing ultralytics package..."

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
    echo "Warning: No virtual environment found. Installing package globally..."
    pip install ultralytics==8.0.196
    echo "Installation complete!"
    exit 0
fi

# Activate virtual environment and install package
echo "Activating virtual environment: $ACTIVATE_SCRIPT"
source "$ACTIVATE_SCRIPT"
echo "Installing ultralytics package..."
pip install ultralytics==8.0.196
echo "Installation complete!"
