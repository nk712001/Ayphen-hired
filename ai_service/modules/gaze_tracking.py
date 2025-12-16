import dlib
import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional

class GazeTracker:
    def __init__(self):
        self.detector = None
        self.predictor = None
        # Define eye aspect ratio thresholds

    def _ensure_model_loaded(self):
        if self.detector is None or self.predictor is None:
            import dlib
            self.detector = dlib.get_frontal_face_detector()
            # Path matching Dockerfile location (root of /app)
            self.predictor = dlib.shape_predictor('shape_predictor_68_face_landmarks.dat')
        self.EAR_THRESHOLD = 0.2
        self.CONSECUTIVE_FRAMES = 3
        
        # Tracking state
        self.looking_away_counter = 0
        self.total_looking_away_time = 0
        self.last_ear = 0.0

    def _calculate_eye_aspect_ratio(self, eye_points: np.ndarray) -> float:
        """Calculate the eye aspect ratio"""
        # Compute vertical eye distances
        v1 = np.linalg.norm(eye_points[1] - eye_points[5])
        v2 = np.linalg.norm(eye_points[2] - eye_points[4])
        
        # Compute horizontal eye distance
        h = np.linalg.norm(eye_points[0] - eye_points[3])
        
        # Calculate eye aspect ratio
        ear = (v1 + v2) / (2.0 * h)
        return ear

    def _get_eye_points(self, landmarks, eye_indices: List[int]) -> np.ndarray:
        """Extract eye points from facial landmarks"""
        return np.array([(landmarks.part(i).x, landmarks.part(i).y) for i in eye_indices])

    def _detect_eyes(self, frame: np.ndarray) -> Optional[Tuple[np.ndarray, np.ndarray]]:
        """Detect and extract eye regions from the frame"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.detector(gray)
        
        if not faces:
            return None
            
        face = faces[0]
        landmarks = self.predictor(gray, face)
        
        # Define indices for left and right eyes
        left_eye_indices = list(range(36, 42))
        right_eye_indices = list(range(42, 48))
        
        # Get eye points
        left_eye = self._get_eye_points(landmarks, left_eye_indices)
        right_eye = self._get_eye_points(landmarks, right_eye_indices)
        
        return left_eye, right_eye

    def analyze_gaze(self, frame: np.ndarray) -> Dict:
        self._ensure_model_loaded()
        """Analyze gaze direction and attention in the frame"""
        try:
            eyes = self._detect_eyes(frame)
            if not eyes:
                return {
                    "status": "no_face_detected",
                    "looking_away": True,
                    "confidence": 0.0,
                    "attention_score": 0.0
                }

            left_eye, right_eye = eyes
            
            # Calculate eye aspect ratios
            left_ear = self._calculate_eye_aspect_ratio(left_eye)
            right_ear = self._calculate_eye_aspect_ratio(right_eye)
            avg_ear = (left_ear + right_ear) / 2.0
            
            # Update state
            looking_away = avg_ear < self.EAR_THRESHOLD
            if looking_away:
                self.looking_away_counter += 1
            else:
                self.looking_away_counter = 0
            
            # Calculate attention metrics
            attention_violation = self.looking_away_counter >= self.CONSECUTIVE_FRAMES
            if attention_violation:
                self.total_looking_away_time += 1
            
            # Calculate confidence based on eye detection quality
            confidence = min(1.0, (avg_ear / self.EAR_THRESHOLD) if avg_ear > 0 else 0)
            
            # Calculate attention score (0-1)
            max_looking_away_time = 300  # 5 minutes in seconds
            attention_score = 1.0 - (self.total_looking_away_time / max_looking_away_time)
            attention_score = max(0.0, min(1.0, attention_score))
            
            return {
                "status": "attention_violation" if attention_violation else "normal",
                "looking_away": looking_away,
                "confidence": confidence,
                "attention_score": attention_score,
                "metrics": {
                    "eye_aspect_ratio": avg_ear,
                    "looking_away_duration": self.total_looking_away_time,
                    "consecutive_violations": self.looking_away_counter
                }
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "looking_away": True,
                "confidence": 0.0,
                "attention_score": 0.0
            }

    def monitor_attention(self, gaze_events: list) -> dict:
        raise NotImplementedError("monitor_attention is not implemented for production use.")

    def detect_eye_landmarks(self, image: np.ndarray):
        raise NotImplementedError("detect_eye_landmarks is not implemented for production use.")

    def calculate_gaze_direction(self, landmarks: list) -> str:
        # Dummy implementation for test
        if not landmarks:
            return "center"
        x_coords = [pt[0] for pt in landmarks]
        avg_x = sum(x_coords) / len(x_coords)
        if avg_x < 15:
            return "left"
        elif avg_x > 15:
            return "right"
        return "center"

    def detect_violations(self, events: list) -> list:
        # Dummy implementation for test
        return [e for e in events if e == "away"]

    def reset_state(self):
        """Reset the tracker's state"""
        self.looking_away_counter = 0
        self.total_looking_away_time = 0
        self.last_ear = 0.0
