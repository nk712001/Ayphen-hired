#!/bin/bash

# Script to help accept the main AI service certificate

echo "🔒 Main AI Service Certificate Acceptance Helper"
echo "=============================================="
echo "This script will help you accept the certificate for the main AI service."
echo ""

# Check if the main AI service is running
if curl -k -s https://127.0.0.1:8000/health > /dev/null; then
  echo "✅ Main AI service is running at https://127.0.0.1:8000"
else
  echo "❌ Main AI service is not running. Please start it first."
  exit 1
fi

echo ""
echo "📋 Please follow these steps:"
echo "1. Visit https://127.0.0.1:8000/health in your browser"
echo "2. Accept the certificate warning"
echo "3. Return to the application and try the proctoring demo again"
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
  echo "❌ No browser command found. Please manually open the URL."
  BROWSER="echo"
fi

# Open the URL in the browser
echo "🌐 Opening https://127.0.0.1:8000/health in your browser..."
$BROWSER "https://127.0.0.1:8000/health"

echo ""
echo "After accepting the certificate, try accessing the proctoring demo at:"
echo "https://localhost:3000/test/proctoring-demo"
echo ""
