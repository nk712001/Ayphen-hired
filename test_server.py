#!/usr/bin/env python3
"""
Simple test server to demonstrate the API endpoints
without requiring all dependencies
"""

import json
import asyncio
from datetime import datetime
from typing import Dict, Any

class MockAPIEndpoints:
    def __init__(self):
        self.sessions = {}

    def get_camera_health(self) -> Dict:
        return {
            "status": "healthy",
            "components": {
                "primary_detector": True,
                "secondary_detector": True,
                "secondary_analyzer": True
            },
            "timestamp": datetime.now().isoformat()
        }

    def get_speech_health(self) -> Dict:
        return {
            "status": "healthy",
            "components": {
                "audio_processor": True,
                "whisper_available": True,
                "google_available": True
            },
            "engines_count": 2,
            "timestamp": datetime.now().isoformat()
        }

    def validate_camera(self, request_data: Dict) -> Dict:
        return {
            "status": "valid",
            "faces_detected": 1,
            "position_valid": True,
            "stability_score": 0.95,
            "guidance": "Camera position looks good",
            "ai_analysis": {
                "hand_placement": {
                    "hands_visible": True,
                    "confidence": 0.92
                },
                "keyboard_visibility": {
                    "keyboard_visible": True,
                    "confidence": 0.88
                }
            }
        }

    def start_calibration(self, request_data: Dict) -> Dict:
        return {
            "status": "success",
            "calibration": {
                "test_active": True,
                "difficulty_level": request_data.get("difficulty_level", "basic"),
                "test_sentence": "The quick brown fox jumps over the lazy dog",
                "samples_collected": 0,
                "samples_required": 5,
                "average_accuracy": 0.87,
                "meets_accuracy_threshold": True,
                "voice_quality_score": 0.91,
                "background_noise_level": 0.03,
                "can_proceed": True
            }
        }

async def handle_request(self, method: str, path: str, data: Dict = None) -> Dict:
    """Handle incoming HTTP requests"""
    if path == "/api/camera/health" and method == "GET":
        return self.get_camera_health()
    elif path == "/api/speech/health" and method == "GET":
        return self.get_speech_health()
    elif path == "/api/camera/validate" and method == "POST":
        return self.validate_camera(data)
    elif path == "/api/speech/start-calibration" and method == "POST":
        return self.start_calibration(data)
    else:
        return {"error": "Endpoint not found"}

# Simple HTTP server (for demonstration)
async def main():
    import socket
    import threading
    from urllib.parse import urlparse, parse_qs

    api = MockAPIEndpoints()

    def handle_connection(client_socket, address):
        try:
            request = client_socket.recv(4096).decode('utf-8')
            if not request:
                return

            lines = request.split('\r\n')
            if len(lines) < 1:
                return

            first_line = lines[0]
            parts = first_line.split(' ')
            if len(parts) < 3:
                return

            method, path, _ = parts

            # Parse request body if present
            body = ''
            if '\r\n\r\n' in request:
                body = request.split('\r\n\r\n', 1)[1]

            data = json.loads(body) if body else {}

            # Handle request
            response_data = asyncio.run(api.handle_request(method, path, data))

            # Create HTTP response
            response = json.dumps(response_data, indent=2)
            http_response = f"""HTTP/1.1 200 OK
Content-Type: application/json
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Content-Length: {len(response)}

{response}"""

            client_socket.send(http_response.encode('utf-8'))

        except Exception as e:
            print(f"Error handling request: {e}")
        finally:
            client_socket.close()

    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

    port = 8001
    server_socket.bind(('localhost', port))
    server_socket.listen(5)

    print(f"🚀 Test server running on http://localhost:{port}")
    print("📡 Available endpoints:")
    print("  GET  /api/camera/health")
    print("  GET  /api/speech/health")
    print("  POST /api/camera/validate")
    print("  POST /api/speech/start-calibration")
    print(f"\n🌐 Open your browser and visit: http://localhost:{port}/")

    try:
        while True:
            client_socket, address = server_socket.accept()
            print(f"Connection from {address}")
            client_thread = threading.Thread(target=handle_connection, args=(client_socket, address))
            client_thread.start()
    except KeyboardInterrupt:
        print("\nShutting down server...")
    finally:
        server_socket.close()

if __name__ == "__main__":
    asyncio.run(main())