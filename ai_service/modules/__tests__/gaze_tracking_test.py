import unittest
from modules.gaze_tracking import GazeTracker
import numpy as np

class TestGazeTracker(unittest.TestCase):
    def setUp(self):
        self.tracker = GazeTracker()

    def test_eye_landmark_detection(self):
        # Dummy image or synthetic data test
        dummy_img = np.zeros((100, 100, 3), dtype=np.uint8)
        # Should not raise error
        try:
            landmarks = self.tracker.detect_eye_landmarks(dummy_img)
        except Exception as e:
            self.fail(f"detect_eye_landmarks raised {e}")

    def test_gaze_direction(self):
        # Dummy data for gaze direction
        landmarks = [(10, 10), (20, 10), (15, 20)]
        direction = self.tracker.calculate_gaze_direction(landmarks)
        self.assertIn(direction, ["left", "right", "center", "up", "down"])

    def test_attention_monitoring(self):
        # Simulate attention monitoring logic
        result = self.tracker.monitor_attention(["center", "left", "right"])
        self.assertIsInstance(result, dict)

    def test_violation_detection(self):
        # Simulate violation detection logic
        events = ["center", "left", "right", "away"]
        violations = self.tracker.detect_violations(events)
        self.assertIsInstance(violations, list)

if __name__ == "__main__":
    unittest.main()
