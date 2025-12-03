#!/bin/bash

# Script to help accept self-signed certificates for development

echo "🔒 Self-Signed Certificate Acceptance Helper"
echo "============================================"
echo "This script will help you accept the self-signed certificates used for development."
echo "This is necessary for WebSocket connections to work properly."
echo ""

# Check if certificates exist
if [ ! -f "./certs/cert.pem" ] || [ ! -f "./certs/key.pem" ]; then
  echo "❌ Error: SSL certificates not found in ./certs directory"
  exit 1
fi

echo "✅ SSL certificates found"
echo ""

# Check if browser is installed
BROWSER=""
if command -v open &> /dev/null; then
  BROWSER="open"
elif command -v xdg-open &> /dev/null; then
  BROWSER="xdg-open"
elif command -v start &> /dev/null; then
  BROWSER="start"
else
  echo "❌ No browser command found. Please manually open the URLs."
  BROWSER="echo"
fi

# Function to open URL in browser
open_url() {
  echo "🌐 Opening $1 in your browser..."
  $BROWSER "$1"
  sleep 2
}

# Check if services are running
echo "🔍 Checking if services are running..."

# Check frontend
if curl -k -s https://localhost:3000 > /dev/null; then
  echo "✅ Frontend is running at https://localhost:3000"
  FRONTEND_RUNNING=true
else
  echo "❌ Frontend is not running. Please start it with 'cd frontend && npm run dev:secure'"
  FRONTEND_RUNNING=false
fi

# Check AI service
if curl -k -s https://127.0.0.1:8000/health > /dev/null; then
  echo "✅ AI service is running at https://127.0.0.1:8000"
  AI_SERVICE_RUNNING=true
else
  echo "❌ AI service is not running. Please start it with 'cd ai_service && ./start_secure.sh'"
  AI_SERVICE_RUNNING=false
fi

echo ""

if [ "$FRONTEND_RUNNING" = false ] || [ "$AI_SERVICE_RUNNING" = false ]; then
  echo "❌ Please start both services before continuing."
  exit 1
fi

# Check if the websocket tools page exists
if [ ! -f "./frontend/public/websocket-tools.html" ]; then
  echo "❌ websocket-tools.html not found in frontend/public directory. Please run the script from the project root."
  exit 1
fi

echo "🔄 Step 1: Opening the WebSocket tools page..."
open_url "https://localhost:3000/websocket-tools.html"

echo ""
echo "📋 Instructions:"
echo "1. Follow the steps on the webpage that just opened"
echo "2. Accept the certificate warnings for both the frontend and AI service"
echo "3. After accepting both certificates, test the WebSocket connection"
echo "4. Return to your application"
echo ""

echo "✅ Done! You should now be able to use WebSocket connections without certificate errors."
