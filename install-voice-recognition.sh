#!/bin/bash

# Enhanced Voice Recognition Setup Script
# Installs dependencies for AI-powered speech recognition

echo "🎤 Enhanced Voice Recognition Setup"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "ai_service/requirements.txt" ]; then
    echo "❌ Error: Please run this script from the ayphen-hire root directory"
    exit 1
fi

# Check if Python virtual environment exists
if [ ! -d "ai_service/ai_venv" ]; then
    echo "⚠️  AI service virtual environment not found"
    echo "📦 Creating virtual environment..."
    cd ai_service
    python3 -m venv ai_venv
    cd ..
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source ai_service/ai_venv/bin/activate

# Install speech recognition dependencies
echo "📦 Installing speech recognition dependencies..."

# Install core speech recognition library
pip install SpeechRecognition==3.10.0

# Install PyAudio for microphone access (may require system dependencies)
echo "🎵 Installing PyAudio..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "📱 Detected macOS - installing PortAudio first..."
    if command -v brew &> /dev/null; then
        brew install portaudio
    else
        echo "⚠️  Homebrew not found. Please install PortAudio manually:"
        echo "   brew install portaudio"
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "🐧 Detected Linux - installing system dependencies..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y portaudio19-dev python3-pyaudio
    elif command -v yum &> /dev/null; then
        sudo yum install -y portaudio-devel
    fi
fi

pip install pyaudio==0.2.11

# Install OpenAI Whisper for local speech recognition
echo "🤖 Installing OpenAI Whisper..."
pip install openai-whisper==20231117

# Install additional dependencies
echo "📚 Installing additional dependencies..."
pip install -r ai_service/requirements.txt

# Test the installation
echo "🧪 Testing installation..."
python3 -c "
try:
    import speech_recognition as sr
    print('✅ SpeechRecognition imported successfully')
except ImportError as e:
    print(f'❌ SpeechRecognition import failed: {e}')

try:
    import whisper
    print('✅ Whisper imported successfully')
except ImportError as e:
    print(f'❌ Whisper import failed: {e}')

try:
    import pyaudio
    print('✅ PyAudio imported successfully')
except ImportError as e:
    print(f'❌ PyAudio import failed: {e}')
"

# Run the voice recognition test
if [ -f "test-voice-recognition.py" ]; then
    echo ""
    echo "🚀 Running voice recognition tests..."
    python3 test-voice-recognition.py
else
    echo "⚠️  Test script not found, skipping tests"
fi

echo ""
echo "🎉 Voice Recognition Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Start the AI service: cd ai_service && source ai_venv/bin/activate && python main.py"
echo "2. Start the frontend: cd frontend && npm run dev"
echo "3. Navigate to the microphone test in the setup flow"
echo ""
echo "🔧 Troubleshooting:"
echo "- If PyAudio fails, install system audio dependencies"
echo "- If Whisper is slow, it will download models on first use"
echo "- Check the VOICE-RECOGNITION-IMPLEMENTATION.md for details"
echo ""
echo "✨ The system now supports:"
echo "   • 30+ professional slogans"
echo "   • Real AI speech-to-text recognition"
echo "   • Advanced text comparison algorithms"
echo "   • Comprehensive audio quality analysis"
