import requests
import base64
import json
import time
import wave
import io
import struct
import math
import random

BASE_URL = "http://127.0.0.1:8000"
SESSION_ID = f"test_session_{int(time.time())}"

def print_result(name, response):
    status = "✅ PASS" if response.status_code == 200 else "❌ FAIL"
    print(f"{status} [{name}] ({response.status_code})")
    if response.status_code != 200:
        print(f"   Response: {response.text}")
    else:
        try:
            print(f"   Response: {json.dumps(response.json(), indent=2)[:200]}...")
        except:
            print(f"   Response: {response.text[:200]}...")

def generate_dummy_wav_base64(duration_sec=2.0, sample_rate=16000):
    """Generate a valid WAV file in base64"""
    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        
        # Generate sine wave
        n_samples = int(duration_sec * sample_rate)
        data = []
        for i in range(n_samples):
            value = int(32767.0 * math.sin(2.0 * math.pi * 440.0 * i / sample_rate))
            data.append(struct.pack('<h', value))
        wav_file.writeframes(b''.join(data))
    
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

def generate_dummy_image_base64():
    """Generate a tiny valid blank JPEG in base64"""
    # 1x1 pixel black JPEG
    return "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="

def test_endpoints():
    print(f"Testing AI Service at {BASE_URL} with Session ID: {SESSION_ID}")
    print("="*60)

    # 1. Health Check
    try:
        resp = requests.get(f"{BASE_URL}/health")
        print_result("Health Check", resp)
    except Exception as e:
        print(f"❌ FAIL [Health Check] Connection Refused? {e}")
        return

    # 2. Speech Test: Init Session
    resp = requests.post(f"{BASE_URL}/api/speech-test/init-session", json={
        "session_id": SESSION_ID
    })
    print_result("Speech Init", resp)

    # 3. Speech Test: Get Sentence
    resp = requests.post(f"{BASE_URL}/api/speech-test/get-sentence", json={
        "session_id": SESSION_ID
    })
    print_result("Speech Get Sentence", resp)
    reference_text = resp.json().get("sentence", "Test reference text")

    # 4. Speech Test: Process
    audio_b64 = generate_dummy_wav_base64()
    resp = requests.post(f"{BASE_URL}/api/speech-test/process", json={
        "session_id": SESSION_ID,
        "audio_data": audio_b64,
        "reference_text": reference_text
    })
    print_result("Speech Process", resp)

    # 5. Camera Setup: Configure
    resp = requests.post(f"{BASE_URL}/setup/camera/configure", json={
        "session_id": SESSION_ID,
        "secondary_camera_required": True
    })
    print_result("Camera Configure", resp)

    # 6. Primary Camera Analysis
    image_b64 = generate_dummy_image_base64()
    resp = requests.post(f"{BASE_URL}/api/primary-camera-analysis/{SESSION_ID}", json={
        "frameData": image_b64
    })
    print_result("Primary Camera Analysis", resp)

    # 7. Secondary Camera Analysis
    resp = requests.post(f"{BASE_URL}/api/secondary-camera-analysis/{SESSION_ID}", json={
        "frameData": image_b64
    })
    print_result("Secondary Camera Analysis", resp)

if __name__ == "__main__":
    test_endpoints()
