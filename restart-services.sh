#!/bin/bash

# Restart both services with proper HTTPS configuration

echo "🔄 Restarting services with proper HTTPS configuration..."

# Check if certificates exist
if [ ! -f "./certs/cert.pem" ] || [ ! -f "./certs/key.pem" ]; then
  echo "❌ Error: SSL certificates not found in ./certs directory"
  exit 1
fi

echo "✅ SSL certificates found"

# Kill any running services
echo "🛑 Stopping any running services..."
pkill -f "uvicorn main:app"
pkill -f "next"

# Wait a bit for services to stop
sleep 2

# Start AI service with HTTPS in the background
echo -e "\n🚀 Starting AI service with HTTPS..."
cd ai_service
./start_secure.sh &
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

# Start Next.js frontend with HTTPS
echo -e "\n🚀 Starting Next.js frontend with HTTPS..."
cd frontend
npm run dev:secure

# Cleanup function to kill background processes when the script exits
cleanup() {
  echo -e "\n🛑 Stopping services..."
  kill $AI_SERVICE_PID
  echo "Done!"
}

# Register the cleanup function to be called on exit
trap cleanup EXIT

# Wait for the frontend to exit
wait
