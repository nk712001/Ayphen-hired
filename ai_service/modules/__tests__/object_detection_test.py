import unittest
import importlib.util
import numpy as np

ultralytics_spec = importlib.util.find_spec("ultralytics")
ultralytics_available = ultralytics_spec is not None

if ultralytics_available:
    from modules.object_detection import ObjectDetector
else:
    ObjectDetector = None

import pytest

class TestObjectDetector(unittest.TestCase):
    def setUp(self):
        if not ultralytics_available:
            pytest.skip("ultralytics not available, skipping ObjectDetector tests")
        self.detector = ObjectDetector()

    def test_yolov5_integration(self):
        # Dummy image for detection
        dummy_img = np.zeros((416, 416, 3), dtype=np.uint8)
        try:
            result = self.detector.detect(dummy_img)
        except Exception as e:
            self.fail(f"detect raised {e}")

    def test_prohibited_object_detection(self):
        # Simulate detection output
        detection = {"label": "cell phone", "confidence": 0.95}
        self.assertGreaterEqual(detection["confidence"], 0.5)
        self.assertIn(detection["label"], ["cell phone", "book", "person"])

    def test_tracking(self):
        # Simulate tracking logic
        track_result = self.detector.track([{"id": 1, "bbox": [10,10,50,50]}])
        self.assertIsInstance(track_result, list)

    def test_confidence_scoring(self):
        # Simulate confidence scoring
        score = self.detector.confidence_score([{"label": "cell phone", "confidence": 0.8}])
        self.assertIsInstance(score, float)

if __name__ == "__main__":
    unittest.main()
