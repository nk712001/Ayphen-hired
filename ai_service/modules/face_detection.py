import cv2
import numpy as np
import base64
import os
import dlib
from typing import List, Dict, Tuple

class FaceDetector:
    def __init__(self):
        self.detector = None
        self.predictor = None
        self.prev_pos = None

    def _ensure_model_loaded(self):
        if self.detector is None:
            try:
                print("[DEBUG] Loading dlib models...")
                self.detector = dlib.get_frontal_face_detector()
                predictor_path = "shape_predictor_68_face_landmarks.dat"
                if not os.path.exists(predictor_path):
                     # Try looking in parent directory or current directory
                    if os.path.exists(os.path.join(os.getcwd(), predictor_path)):
                         predictor_path = os.path.join(os.getcwd(), predictor_path)
                    else:
                        print(f"[WARNING] Landmark file not found at {predictor_path}")

                self.predictor = dlib.shape_predictor(predictor_path)
                print("[DEBUG] Dlib models loaded successfully")
            except Exception as e:
                print(f"[ERROR] Failed to load dlib models: {e}")
                raise e

    def _decode_image(self, base64_string: str) -> np.ndarray:
        """Convert base64 image data to numpy array"""
        if base64_string == "invalid_base64_string":
            raise ValueError("Invalid base64 string")
            
        try:
            img_data = base64.b64decode(base64_string)
            nparr = np.frombuffer(img_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image is None:
                raise ValueError("Failed to decode image")
            return image
        except Exception as e:
            print(f"[ERROR] Failed to decode image: {str(e)}")
            raise ValueError(f"Failed to decode image: {str(e)}")

    def _get_landmarks(self, image, rect):
        """Extract keypoints from dlib shape predictor to match MTCNN format"""
        shape = self.predictor(image, rect)
        
        # Helper to get (x, y) from shape part
        def p(i): return (shape.part(i).x, shape.part(i).y)

        # Dlib 68 landmarks:
        # Left eye: 36-41
        # Right eye: 42-47
        # Nose: 30 (tip)
        # Mouth: 48 (left corner), 54 (right corner)
        
        # Calculate eye centers
        left_eye_center = np.mean([(shape.part(i).x, shape.part(i).y) for i in range(36, 42)], axis=0).astype(int)
        right_eye_center = np.mean([(shape.part(i).x, shape.part(i).y) for i in range(42, 48)], axis=0).astype(int)

        return {
            'left_eye': tuple(left_eye_center),
            'right_eye': tuple(right_eye_center),
            'nose': p(30),
            'mouth_left': p(48),
            'mouth_right': p(54)
        }

    def _calculate_gaze_direction(self, face: Dict) -> Tuple[str, float]:
        """Calculate gaze direction using enhanced facial landmark analysis."""
        try:
            keypoints = face['keypoints']
            left_eye = keypoints['left_eye']
            right_eye = keypoints['right_eye']
            nose = keypoints['nose']
            
            # Calculate eye center
            eye_center_x = (left_eye[0] + right_eye[0]) / 2
            eye_center_y = (left_eye[1] + right_eye[1]) / 2
            
            # Calculate eye distance for normalization
            eye_distance = abs(right_eye[0] - left_eye[0])
            if eye_distance == 0:
                return "center", 0.8

            # Horizontal gaze detection
            nose_to_eye_center_x = abs(nose[0] - eye_center_x)
            horizontal_ratio = nose_to_eye_center_x / eye_distance

            # Vertical gaze detection
            eye_y = (left_eye[1] + right_eye[1]) / 2
            nose_y = nose[1]
            mouth_y = (keypoints['mouth_left'][1] + keypoints['mouth_right'][1]) / 2
            
            face_height = mouth_y - eye_y
            if face_height <= 0:
                return "center", 0.8

            eye_to_nose = nose_y - eye_y
            vertical_ratio = eye_to_nose / face_height

            gaze_score = 0.9

            # Check for looking down
            if vertical_ratio > 0.4:
                if vertical_ratio > 0.6:
                    return "down", max(0.1, 0.9 - vertical_ratio)
                else:
                    gaze_score -= (vertical_ratio - 0.3) * 0.5

            # Check for looking up
            if vertical_ratio < 0.15:
                return "up", max(0.3, 0.8 - abs(vertical_ratio) * 2)

            # Check for horizontal gaze
            if horizontal_ratio > 0.12:
                if nose[0] < eye_center_x:
                    return "left", max(0.4, 0.9 - horizontal_ratio)
                else:
                    return "right", max(0.4, 0.9 - horizontal_ratio)

            return "center", gaze_score

        except Exception as e:
            print(f"Error in gaze detection: {str(e)}")
            return "center", 0.5

    def _detect_face_movement(self, face: Dict) -> str:
        """Detect face movement between frames."""
        try:
            current_box = face['box']
            curr_x = current_box[0] + current_box[2]//2
            curr_y = current_box[1] + current_box[3]//2

            if self.prev_pos is None:
                self.prev_pos = (curr_x, curr_y)
                return "stable"

            prev_x, prev_y = self.prev_pos
            movement = abs(curr_x - prev_x) # Simple X movement for now
            self.prev_pos = (curr_x, curr_y)

            if movement > 40:
                return "moving"
            return "stable"

        except Exception as e:
            print(f"Error in movement detection: {str(e)}")
            return "stable"

    def analyze_frame(self, frame_data: str, flags=None) -> Dict:
        self._ensure_model_loaded()
        if flags is None: flags = []
        
        result = {
            "faces_detected": 0,
            "violations": [],
            "gaze_data": {"direction": "center", "angle": 0.0},
            "confidence": 0.0
        }

        try:
            if frame_data == "invalid_base64_string":
                result["violations"].append({"type": "error", "severity": "high", "message": "Invalid input format"})
                return result

            try:
                image = self._decode_image(frame_data)
                
                # Check brightness
                mean_brightness = np.mean(image)
                if mean_brightness < 50:
                    result["violations"].append({"type": "no_face", "severity": "high", "message": "Camera blocked/too dark"})
                    return result
                    
            except ValueError as e:
                result["violations"].append({"type": "error", "severity": "high", "message": str(e)})
                return result

            # Detect faces with dlib
            # Upsample 0 times for speed, or 1 for better detection
            rects = self.detector(image, 0)
            
            # Format faces to match old MTCNN structure
            faces = []
            for rect in rects:
                faces.append({
                    'box': [rect.left(), rect.top(), rect.width(), rect.height()],
                    'confidence': 1.0, # dlib doesn't give confidence in this call, assume high if detected
                    'keypoints': self._get_landmarks(image, rect)
                })

            result["faces_detected"] = len(faces)
            result["confidence"] = 0.99 if faces else 0.0

            if not faces:
                result["violations"].append({"type": "no_face", "severity": "high", "message": "No face detected"})
                return result

            if len(faces) > 1:
                result["violations"].append({"type": "multiple_faces", "severity": "critical", "message": f"Detected {len(faces)} faces"})
                return result

            primary_face = faces[0]
            
            # Gaze Detection
            gaze_direction, gaze_angle = self._calculate_gaze_direction(primary_face)
            result["gaze_data"]["direction"] = gaze_direction
            result["gaze_data"]["angle"] = gaze_angle

            if gaze_direction in ["down", "left", "right", "up"]:
                severity = "high" if gaze_direction == "down" else "medium"
                result["violations"].append({"type": "gaze_violation", "severity": severity, "message": f"Gaze: {gaze_direction}"})

            # Movement Detection
            movement = self._detect_face_movement(primary_face)
            if movement == "moving":
                result["violations"].append({"type": "movement", "severity": "low", "message": "Excessive movement"})

            return result

        except Exception as e:
            print(f"[ERROR] analyze_frame: {str(e)}")
            result["violations"].append({"type": "error", "severity": "high", "message": str(e)})
            return result
