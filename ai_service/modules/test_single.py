import unittest
from face_detection import FaceDetector
import numpy as np
import cv2
import base64

def create_test_images():
    # Create blank image
    blank_image = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.imwrite('blank.jpg', blank_image)
    return 'blank.jpg'

def test_no_face():
    detector = FaceDetector()
    blank_path = create_test_images()
    result = detector.analyze_frame(blank_path)
    print("\nTesting no face detection:")
    print(f"faces_detected: {result['faces_detected']}")
    print(f"violations: {result['violations']}")
    assert result["faces_detected"] == 0
    assert result["violations"][0]["type"] == "no_face"
    assert result["violations"][0]["severity"] == "high"
    print("All assertions passed!")

if __name__ == '__main__':
    test_no_face()
