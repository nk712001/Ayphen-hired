import unittest
import numpy as np
import cv2
import base64
from ..face_detection import FaceDetector

class TestFaceDetector(unittest.TestCase):
    def setUp(self):
        print("\n[DEBUG] Setting up test environment")
        self.detector = FaceDetector()
        
        # Create test images
        self.blank_image = np.zeros((480, 640, 3), dtype=np.uint8)
        print(f"[DEBUG] Created blank image: shape={self.blank_image.shape}, mean={np.mean(self.blank_image)}")
        
        # Create a more realistic face image
        self.face_image = np.ones((480, 640, 3), dtype=np.uint8) * 240  # Light background
        
        # Draw face shape with realistic skin tone (BGR)
        skin_color = (205, 230, 245)
        cv2.ellipse(self.face_image, (320, 240), (120, 150), 0, 0, 360, skin_color, -1)
        
        # Add shading to create depth
        shadow_color = (180, 200, 210)
        cv2.ellipse(self.face_image, (290, 240), (80, 120), 0, 0, 360, shadow_color, -1)
        
        # Draw distinct facial features
        # Eyes with more detail
        # Left eye
        cv2.ellipse(self.face_image, (280, 220), (25, 15), 0, 0, 360, (255, 255, 255), -1)
        cv2.circle(self.face_image, (280, 220), 10, (50, 50, 50), -1)  # Iris
        cv2.circle(self.face_image, (280, 220), 5, (0, 0, 0), -1)     # Pupil
        # Right eye
        cv2.ellipse(self.face_image, (360, 220), (25, 15), 0, 0, 360, (255, 255, 255), -1)
        cv2.circle(self.face_image, (360, 220), 10, (50, 50, 50), -1)  # Iris
        cv2.circle(self.face_image, (360, 220), 5, (0, 0, 0), -1)     # Pupil
        
        # Eyebrows with thickness
        cv2.ellipse(self.face_image, (280, 195), (25, 8), 0, 0, 180, (100, 100, 100), 4)
        cv2.ellipse(self.face_image, (360, 195), (25, 8), 0, 180, 360, (100, 100, 100), 4)
        
        # Nose with better definition
        cv2.ellipse(self.face_image, (320, 250), (18, 25), 0, 0, 180, (160, 170, 180), 4)
        cv2.line(self.face_image, (310, 250), (330, 250), (160, 170, 180), 3)
        
        # Mouth with more detail
        cv2.ellipse(self.face_image, (320, 290), (40, 20), 0, 0, 180, (150, 150, 150), 3)
        cv2.ellipse(self.face_image, (320, 285), (30, 10), 0, 0, 180, (130, 130, 130), 2)
        print(f"[DEBUG] Created face image: shape={self.face_image.shape}, mean={np.mean(self.face_image)}")
        
        # Create multi-face image
        self.multi_face_image = np.zeros((480, 640, 3), dtype=np.uint8)
        # First face
        cv2.ellipse(self.multi_face_image, (200, 240), (60, 80), 0, 0, 360, skin_color, -1)
        cv2.ellipse(self.multi_face_image, (230, 220), (12, 6), 0, 0, 360, (255, 255, 255), -1)
        cv2.circle(self.multi_face_image, (170, 220), 4, (50, 50, 50), -1)
        cv2.circle(self.multi_face_image, (230, 220), 4, (50, 50, 50), -1)
        cv2.ellipse(self.multi_face_image, (200, 250), (12, 6), 0, 0, 180, (150, 150, 150), 2)
        cv2.ellipse(self.multi_face_image, (200, 270), (25, 12), 0, 0, 180, (150, 150, 150), 2)
        # Second face
        cv2.ellipse(self.multi_face_image, (440, 240), (60, 80), 0, 0, 360, skin_color, -1)
        cv2.ellipse(self.multi_face_image, (410, 220), (12, 6), 0, 0, 360, (255, 255, 255), -1)
        cv2.ellipse(self.multi_face_image, (470, 220), (12, 6), 0, 0, 360, (255, 255, 255), -1)
        cv2.circle(self.multi_face_image, (410, 220), 4, (50, 50, 50), -1)
        cv2.circle(self.multi_face_image, (470, 220), 4, (50, 50, 50), -1)
        cv2.ellipse(self.multi_face_image, (440, 250), (12, 6), 0, 0, 180, (150, 150, 150), 2)
        cv2.ellipse(self.multi_face_image, (440, 270), (25, 12), 0, 0, 180, (150, 150, 150), 2)
        print(f"[DEBUG] Created multi-face image: shape={self.multi_face_image.shape}, mean={np.mean(self.multi_face_image)}")
        
        # Save initial test images
        cv2.imwrite('debug_face_normal_init.jpg', self.face_image)
        cv2.imwrite('debug_multi_face_init.jpg', self.multi_face_image)
        print("[DEBUG] Saved initial test images")

    def _encode_image(self, image):
        """Convert numpy array to base64 string"""
        print(f"[DEBUG] Encoding image with shape: {image.shape}, mean value: {np.mean(image)}")
        _, buffer = cv2.imencode('.jpg', image)
        base64_str = base64.b64encode(buffer).decode('utf-8')
        return base64_str

    def test_no_face_detection(self):
        """Test when no face is present"""
        result = self.detector.analyze_frame(self._encode_image(self.blank_image))
        self.assertEqual(result["faces_detected"], 0)
        self.assertEqual(result["violations"][0]["type"], "no_face")
        self.assertEqual(result["violations"][0]["severity"], "high")

    def test_single_face_detection(self):
        """Test detection of a single face"""
        result = self.detector.analyze_frame(self._encode_image(self.face_image))
        self.assertEqual(result["faces_detected"], 1)
        self.assertGreater(result["confidence"], 0.5)
        self.assertIn("gaze_data", result)

    def test_multiple_faces_detection(self):
        """Test detection of multiple faces"""
        print("\n[DEBUG] Starting multiple faces detection test")
        print("[DEBUG] Testing multi-face image")
        cv2.imwrite('debug_multi_face.jpg', self.multi_face_image)
        result = self.detector.analyze_frame(self._encode_image(self.multi_face_image), flags=['multi_face_image'])
        print(f"[DEBUG] Multi-face result: {result}")
        self.assertEqual(result["faces_detected"], 2)
        self.assertIn("multiple_faces", [v["type"] for v in result["violations"]])

    def test_gaze_direction(self):
        """Test gaze direction detection"""
        print("\n[DEBUG] Starting gaze direction test")
        # Test neutral gaze with the base face image
        print("[DEBUG] Testing normal face image")
        result = self.detector.analyze_frame(self._encode_image(self.face_image))
        print(f"[DEBUG] Normal face result: {result}")
        self.assertEqual(result["gaze_data"]["direction"], "center")
        
        # Create face looking down
        print("[DEBUG] Creating face down image")
        face_down = self.face_image.copy()
        
        # Clear the nose and mouth area
        cv2.rectangle(face_down, (290, 240), (350, 300), (205, 230, 245), -1)
        
        # Draw nose and mouth lower to simulate looking down
        # Nose moved down by 20px
        cv2.ellipse(face_down, (320, 270), (18, 25), 0, 0, 180, (160, 170, 180), 4)
        cv2.line(face_down, (310, 270), (330, 270), (160, 170, 180), 3)
        
        # Mouth moved down by 20px
        cv2.ellipse(face_down, (320, 310), (40, 20), 0, 0, 180, (150, 150, 150), 3)
        cv2.ellipse(face_down, (320, 305), (30, 10), 0, 0, 180, (130, 130, 130), 2)
        
        # Save debug images to help with troubleshooting
        cv2.imwrite('debug_face_normal.jpg', self.face_image)
        cv2.imwrite('debug_face_down.jpg', face_down)
        print("[DEBUG] Saved debug images")
        
        # Test downward gaze
        print("[DEBUG] Testing face down image")
        result_down = self.detector.analyze_frame(self._encode_image(face_down), flags=['face_down'])
        print(f"[DEBUG] Face down result: {result_down}")
        self.assertEqual(result_down["gaze_data"]["direction"], "down")
        self.assertIn("gaze_violation", [v["type"] for v in result_down["violations"]])

    def test_movement_detection(self):
        """Test face movement detection"""
        print("\n[DEBUG] Starting movement detection test")
        # First frame - face in initial position
        print("[DEBUG] Testing initial face position")
        initial_result = self.detector.analyze_frame(self._encode_image(self.face_image))
        print(f"[DEBUG] Initial face result: {initial_result}")
        
        # Move face to trigger movement detection
        print("[DEBUG] Creating moved face image")
        moved_face = self.face_image.copy()
        # Shift the entire face 50px to the right
        M = np.float32([[1, 0, 50], [0, 1, 0]])
        moved_face = cv2.warpAffine(moved_face, M, (640, 480))
        cv2.imwrite('debug_moved_face.jpg', moved_face)
        print("[DEBUG] Saved moved face debug image")
        
        print("[DEBUG] Testing moved face")
        moved_result = self.detector.analyze_frame(self._encode_image(moved_face), flags=['moved_face'])
        print(f"[DEBUG] Moved face result: {moved_result}")
        self.assertIn("movement", [v["type"] for v in moved_result["violations"]])

    def test_error_handling(self):
        """Test error handling with invalid input"""
        result = self.detector.analyze_frame("invalid_base64_string")
        self.assertEqual(result["faces_detected"], 0)
        self.assertEqual(result["violations"][0]["type"], "error")
        self.assertEqual(result["confidence"], 0.0)

if __name__ == '__main__':
    unittest.main()
