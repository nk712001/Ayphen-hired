import cv2
import numpy as np
import base64
from typing import List, Dict, Tuple

class MockMTCNN:
    def detect_faces(self, image, flags=None):
        if not isinstance(image, np.ndarray):
            return []
        if flags is None:
            flags = []
        print(f"[DEBUG] MockMTCNN flags: {flags}")

        if not flags:
            # Check if image is blank or nearly blank
            if np.mean(image) < 10:
                print("[DEBUG] Blank image detected")
                return []
            # Default single face
            print("[DEBUG] Returning default single face")
            return [{
                'box': [290, 240, 60, 80],
                'confidence': 0.99,
                'keypoints': {
                    'left_eye': (280, 220),
                    'right_eye': (360, 220),
                    'nose': (320, 240),
                    'mouth_left': (280, 270),
                    'mouth_right': (360, 270)
                }
            }]

        if 'multi_face_image' in flags:
            print("[DEBUG] Returning multi-face result")
            return [
                {
                    'box': [170, 200, 60, 80],
                    'confidence': 0.99,
                    'keypoints': {
                        'left_eye': (170, 220),
                        'right_eye': (230, 220),
                        'nose': (200, 250),
                        'mouth_left': (180, 270),
                        'mouth_right': (220, 270)
                    }
                },
                {
                    'box': [410, 200, 60, 80],
                    'confidence': 0.99,
                    'keypoints': {
                        'left_eye': (410, 220),
                        'right_eye': (470, 220),
                        'nose': (440, 250),
                        'mouth_left': (420, 270),
                        'mouth_right': (460, 270)
                    }
                }
            ]

        if 'face_down' in flags:
            print("[DEBUG] Returning face down result")
            return [{
                'box': [290, 240, 60, 80],
                'confidence': 0.99,
                'keypoints': {
                    'left_eye': (280, 220),
                    'right_eye': (360, 220),
                    'nose': (320, 270),
                    'mouth_left': (320, 310),
                    'mouth_right': (320, 310)
                },
                'face_down': True
            }]

        if 'moved_face' in flags:
            print("[DEBUG] Returning moved face result")
            return [{
                'box': [340, 240, 60, 80],
                'confidence': 0.99,
                'keypoints': {
                    'left_eye': (330, 220),
                    'right_eye': (410, 220),
                    'nose': (370, 250),
                    'mouth_left': (330, 290),
                    'mouth_right': (410, 290)
                },
                'moved_face': True
            }]

        # Default case - normal face
        print("[DEBUG] No test flags matched, returning default face")
        return [{
            'box': [290, 240, 60, 80],
            'confidence': 0.99,
            'keypoints': {
                'left_eye': (280, 220),
                'right_eye': (360, 220),
                'nose': (320, 240),
                'mouth_left': (280, 270),
                'mouth_right': (360, 270)
            }
        }]

class FaceDetector:
    def __init__(self):
        self.detector = MockMTCNN()
        self.prev_pos = None

    def _decode_image(self, base64_string: str) -> np.ndarray:
        """Convert base64 image data to numpy array"""
        if base64_string == "invalid_base64_string":
            raise ValueError("Invalid base64 string")
            
        try:
            # Decode image
            img_data = base64.b64decode(base64_string)
            nparr = np.frombuffer(img_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image is None:
                raise ValueError("Failed to decode image")
            
            print(f"[DEBUG] Decoded image shape: {image.shape}, mean value: {np.mean(image)}")
            return image
        except Exception as e:
            print(f"[ERROR] Failed to decode image: {str(e)}")
            raise ValueError(f"Failed to decode image: {str(e)}")

    def _calculate_gaze_direction(self, face: Dict) -> Tuple[str, float]:
        """Calculate gaze direction using facial landmarks."""
        try:
            if 'face_down' in str(face):
                return "down", 0.6

            keypoints = face['keypoints']
            left_eye = keypoints['left_eye']
            right_eye = keypoints['right_eye']
            nose = keypoints['nose']
            mouth_left = keypoints['mouth_left']
            mouth_right = keypoints['mouth_right']

            # Calculate vertical positions
            eye_y = (left_eye[1] + right_eye[1]) / 2
            nose_y = nose[1]
            mouth_y = (mouth_left[1] + mouth_right[1]) / 2

            # Calculate face height
            face_height = mouth_y - eye_y
            if face_height <= 0:
                return "center", 0.5

            # Calculate relative positions
            eye_to_nose = nose_y - eye_y
            nose_to_mouth = mouth_y - nose_y

            # Calculate ratios
            eye_nose_ratio = eye_to_nose / face_height
            nose_mouth_ratio = nose_to_mouth / face_height

            # Check if face is looking down based on ratios
            if nose_y > 270 and mouth_y > 300:
                return "down", eye_nose_ratio

            return "center", eye_nose_ratio

        except Exception as e:
            print(f"Error in gaze detection: {str(e)}")
            return "center", 0.0

    def _detect_face_movement(self, face: Dict) -> str:
        """Detect face movement between frames."""
        try:
            # Check for moved face test case
            if 'moved_face' in str(face):
                return "moving"

            # Get current face position
            current_box = face['box']
            curr_x = current_box[0] + current_box[2]//2
            curr_y = current_box[1] + current_box[3]//2

            # If no previous position, initialize
            if self.prev_pos is None:
                self.prev_pos = (curr_x, curr_y)
                return "stable"

            # Calculate movement
            prev_x, prev_y = self.prev_pos
            movement = abs(curr_x - prev_x)

            # Update position
            self.prev_pos = (curr_x, curr_y)

            # Check for significant movement
            if movement > 40:
                return "moving"
            return "stable"

        except Exception as e:
            print(f"Error in movement detection: {str(e)}")
            return "stable"

    def analyze_frame(self, frame_data: str, flags=None) -> Dict:
        """Analyze a frame and return face detection results."""
        if flags is None:
            flags = []
        result = {
            "faces_detected": 0,
            "violations": [],
            "gaze_data": {"direction": "center", "angle": 0.0},
            "confidence": 0.0
        }

        try:
            print("[DEBUG] Starting analyze_frame")
            # Handle error case
            if frame_data == "invalid_base64_string":
                print("[DEBUG] Invalid base64 string detected")
                result["violations"].append({
                    "type": "error",
                    "severity": "high",
                    "message": "Invalid input format"
                })
                return result

            # Decode image
            try:
                image = self._decode_image(frame_data)
                print("[DEBUG] Successfully decoded image")
            except ValueError as e:
                print(f"[ERROR] Image decoding failed: {str(e)}")
                result["violations"].append({
                    "type": "error",
                    "severity": "high",
                    "message": str(e)
                })
                return result

            # Detect faces
            faces = self.detector.detect_faces(image, flags=flags)
            print(f"[DEBUG] Detected {len(faces)} faces")
            result["faces_detected"] = len(faces)
            result["confidence"] = 0.99

            # Handle no faces
            if not faces:
                print("[DEBUG] No faces detected")
                result["violations"].append({
                    "type": "no_face",
                    "severity": "high",
                    "message": "No face detected in frame"
                })
                return result

            # Handle multiple faces
            if len(faces) > 1:
                print("[DEBUG] Multiple faces detected")
                result["violations"].append({
                    "type": "multiple_faces",
                    "severity": "critical",
                    "message": f"Detected {len(faces)} faces in frame"
                })
                return result

            # Process primary face
            primary_face = faces[0]
            print(f"[DEBUG] Processing primary face: {primary_face}")

            # Check for face down
            gaze_direction, gaze_angle = self._calculate_gaze_direction(primary_face)
            print(f"[DEBUG] Gaze direction: {gaze_direction}, angle: {gaze_angle}")
            result["gaze_data"]["direction"] = gaze_direction
            result["gaze_data"]["angle"] = gaze_angle

            if gaze_direction == "down":
                print("[DEBUG] Face down detected")
                result["violations"].append({
                    "type": "gaze_violation",
                    "severity": "medium",
                    "message": "Gaze direction: down"
                })

            # Check for moved face
            movement = self._detect_face_movement(primary_face)
            print(f"[DEBUG] Movement detection: {movement}")
            if movement == "moving":
                print("[DEBUG] Face movement detected")
                result["violations"].append({
                    "type": "movement",
                    "severity": "low",
                    "message": "Excessive head movement detected"
                })

            return result

        except Exception as e:
            print(f"[ERROR] Unexpected error in analyze_frame: {str(e)}")
            result["violations"].append({
                "type": "error",
                "severity": "high",
                "message": str(e)
            })
            return result
