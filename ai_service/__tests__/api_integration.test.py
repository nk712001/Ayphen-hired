import unittest
import asyncio
import websockets
import json
import numpy as np
import cv2
from base64 import b64encode
from ..main import app
from fastapi.testclient import TestClient
from ..modules.face_detection import FaceDetector
from ..modules.audio_processing import AudioProcessor

class TestAIServiceAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.face_detector = FaceDetector()
        self.audio_processor = AudioProcessor()
        
        # Create test data
        self.test_image = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.circle(self.test_image, (320, 240), 100, (255, 255, 255), -1)
        self.test_image_b64 = b64encode(cv2.imencode('.jpg', self.test_image)[1]).decode()

        # Create test audio
        sample_rate = 44100
        duration = 1.0
        t = np.linspace(0, duration, int(sample_rate * duration))
        self.test_audio = 0.5 * np.sin(2 * np.pi * 440 * t)
        self.test_audio_b64 = b64encode(self.test_audio.tobytes()).decode()

    def test_health_check(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "healthy"})

    def test_api_authentication(self):
        # Test without API key
        response = self.client.post("/api/analyze/face")
        self.assertEqual(response.status_code, 401)

        # Test with invalid API key
        response = self.client.post(
            "/api/analyze/face",
            headers={"X-API-Key": "invalid-key"}
        )
        self.assertEqual(response.status_code, 401)

        # Test with valid API key
        response = self.client.post(
            "/api/analyze/face",
            headers={"X-API-Key": "test-api-key"},
            json={"image": self.test_image_b64}
        )
        self.assertEqual(response.status_code, 200)

    def test_face_detection_endpoint(self):
        response = self.client.post(
            "/api/analyze/face",
            headers={"X-API-Key": "test-api-key"},
            json={"image": self.test_image_b64}
        )
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertIn("faces", result)
        self.assertIn("confidence", result)
        self.assertIn("violation_type", result)

    def test_audio_analysis_endpoint(self):
        response = self.client.post(
            "/api/analyze/audio",
            headers={"X-API-Key": "test-api-key"},
            json={"audio": self.test_audio_b64}
        )
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertIn("voice_detected", result)
        self.assertIn("sound_type", result)
        self.assertIn("violation_type", result)

class TestWebSocketIntegration(unittest.TestCase):
    async def websocket_client(self):
        uri = "ws://localhost:8000/ws/proctor/test-session"
        async with websockets.connect(uri) as websocket:
            # Send test video frame
            await websocket.send(json.dumps({
                "type": "video",
                "data": self.test_image_b64
            }))
            response = await websocket.recv()
            self.video_result = json.loads(response)

            # Send test audio frame
            await websocket.send(json.dumps({
                "type": "audio",
                "data": self.test_audio_b64
            }))
            response = await websocket.recv()
            self.audio_result = json.loads(response)

    def setUp(self):
        self.test_image = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.circle(self.test_image, (320, 240), 100, (255, 255, 255), -1)
        self.test_image_b64 = b64encode(cv2.imencode('.jpg', self.test_image)[1]).decode()

        sample_rate = 44100
        duration = 1.0
        t = np.linspace(0, duration, int(sample_rate * duration))
        self.test_audio = 0.5 * np.sin(2 * np.pi * 440 * t)
        self.test_audio_b64 = b64encode(self.test_audio.tobytes()).decode()

    def test_websocket_communication(self):
        asyncio.get_event_loop().run_until_complete(self.websocket_client())
        
        # Verify video analysis results
        self.assertIn("faces", self.video_result)
        self.assertIn("confidence", self.video_result)
        self.assertIn("violation_type", self.video_result)

        # Verify audio analysis results
        self.assertIn("voice_detected", self.audio_result)
        self.assertIn("sound_type", self.audio_result)
        self.assertIn("violation_type", self.audio_result)

    def test_websocket_security(self):
        async def test_security():
            # Test without authentication
            try:
                uri = "ws://localhost:8000/ws/proctor/invalid-session"
                async with websockets.connect(uri) as _:
                    self.fail("Should not connect without valid session")
            except websockets.exceptions.InvalidStatusCode:
                pass

            # Test with invalid protocol
            try:
                uri = "ws://localhost:8000/ws/proctor/test-session"
                async with websockets.connect(uri, subprotocols=["invalid"]) as _:
                    self.fail("Should not connect with invalid protocol")
            except websockets.exceptions.InvalidStatusCode:
                pass

        asyncio.get_event_loop().run_until_complete(test_security())

class TestErrorHandling(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_invalid_image_format(self):
        response = self.client.post(
            "/api/analyze/face",
            headers={"X-API-Key": "test-api-key"},
            json={"image": "invalid-base64"}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())

    def test_invalid_audio_format(self):
        response = self.client.post(
            "/api/analyze/audio",
            headers={"X-API-Key": "test-api-key"},
            json={"audio": "invalid-base64"}
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())

    def test_rate_limiting(self):
        # Make multiple rapid requests
        for _ in range(10):
            response = self.client.post(
                "/api/analyze/face",
                headers={"X-API-Key": "test-api-key"},
                json={"image": "test"}
            )
        
        # Next request should be rate limited
        response = self.client.post(
            "/api/analyze/face",
            headers={"X-API-Key": "test-api-key"},
            json={"image": "test"}
        )
        self.assertEqual(response.status_code, 429)

    def test_invalid_endpoint(self):
        response = self.client.post("/api/invalid")
        self.assertEqual(response.status_code, 404)

if __name__ == '__main__':
    unittest.main()
