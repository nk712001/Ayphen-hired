#!/bin/bash

# Script to restart the AI service with HTTPS

echo "🔄 Restarting AI service with HTTPS..."

# Check if certificates exist
if [ ! -f "./certs/cert.pem" ] || [ ! -f "./certs/key.pem" ]; then
  echo "❌ Error: SSL certificates not found in ./certs directory"
  exit 1
fi

echo "✅ SSL certificates found"

# Kill any running AI service
echo "🛑 Stopping any running AI service..."
pkill -f "uvicorn main:app"

# Wait a bit for the service to stop
sleep 2

# Start AI service with HTTPS
echo "🚀 Starting AI service with HTTPS..."
cd ai_service

# Use the start_secure.sh script which handles virtual environment activation
if [ -f "start_secure.sh" ]; then
  chmod +x start_secure.sh
  ./start_secure.sh &
else
  # Fallback to direct execution if script doesn't exist
  python main.py &
fi

AI_SERVICE_PID=$!
cd ..

# Wait for AI service to start
echo "⏳ Waiting for AI service to start..."
sleep 5

# Check if AI service is running
if ! curl -k https://127.0.0.1:8000/health > /dev/null 2>&1; then
  echo "❌ AI service failed to start"
  exit 1
fi

echo "✅ AI service running at https://127.0.0.1:8000"
echo ""
echo "📋 Next steps:"
echo "1. Visit https://127.0.0.1:8000/health in your browser"
echo "2. Accept the certificate warning"
echo "3. Then try the WebSocket connection again"
echo ""
echo "🔍 To test the WebSocket connection, visit:"
echo "https://localhost:3000/websocket-tools.html"

# Keep the script running to maintain the AI service
echo ""
echo "Press Ctrl+C to stop the AI service"
wait $AI_SERVICE_PID
