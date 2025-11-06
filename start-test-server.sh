#!/bin/bash

# Script to start the simple WebSocket test server

echo "🔄 Starting simple WebSocket test server..."

# Check if certificates exist
if [ ! -f "./certs/cert.pem" ] || [ ! -f "./certs/key.pem" ]; then
  echo "❌ Error: SSL certificates not found in ./certs directory"
  exit 1
fi

echo "✅ SSL certificates found"

# Kill any running test server
echo "🛑 Stopping any running test server..."
pkill -f "uvicorn test_websocket:app"

# Wait a bit for the service to stop
sleep 2

# Check for required Python modules
echo "🔍 Checking for required Python modules..."
cd ai_service

# Check if uvicorn and fastapi are installed
if ! python3 -c "import uvicorn, fastapi" 2>/dev/null; then
  echo "❌ Missing required Python modules. Installing..."
  # Try to install using pip
  if ! python3 -m pip install uvicorn fastapi; then
    echo "❌ Failed to install required modules. Please run:"
    echo "   python3 -m pip install uvicorn fastapi"
    exit 1
  fi
  echo "✅ Required modules installed"
fi

# Start test server with HTTPS
echo "🚀 Starting simple WebSocket test server with HTTPS..."
python3 test_websocket.py &
TEST_SERVER_PID=$!
cd ..

# Wait for test server to start
echo "⏳ Waiting for test server to start..."
sleep 5

# Check if test server is running
if ! curl -k https://127.0.0.1:8001/health > /dev/null 2>&1; then
  echo "❌ Test server failed to start"
  # Check if the process is still running
  if ! ps -p $TEST_SERVER_PID > /dev/null; then
    echo "❌ Server process has terminated. Check for errors above."
  fi
  exit 1
fi

echo "✅ Test server running at https://127.0.0.1:8001"
echo ""
echo "📋 Next steps:"
echo "1. Visit https://127.0.0.1:8001/health in your browser"
echo "2. Accept the certificate warning"
echo "3. Then try the WebSocket connection at:"
echo "   https://localhost:3000/simple-test.html"
echo ""
echo "Press Ctrl+C to stop the test server"
wait $TEST_SERVER_PID
