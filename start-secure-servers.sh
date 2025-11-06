#!/bin/bash

# Start both servers with HTTPS enabled

# Check if certificates exist
if [ ! -f "./certs/cert.pem" ] || [ ! -f "./certs/key.pem" ]; then
  echo "❌ Error: SSL certificates not found in ./certs directory"
  exit 1
fi

echo "✅ SSL certificates found"

# Test certificates
echo "Testing SSL certificates..."
node test-https.js

# Start FastAPI AI Service in the background
echo -e "\n🚀 Starting FastAPI AI Service with HTTPS..."
cd ai_service
python main.py &
AI_SERVICE_PID=$!
cd ..

# Wait a bit for the AI service to start
sleep 2

# Start Next.js Frontend
echo -e "\n🚀 Starting Next.js Frontend with HTTPS..."
cd frontend
npm run dev:secure

# Cleanup function to kill background processes when the script exits
cleanup() {
  echo -e "\n🛑 Stopping servers..."
  kill $AI_SERVICE_PID
  echo "Done!"
}

# Register the cleanup function to be called on exit
trap cleanup EXIT

# Wait for the frontend to exit
wait
