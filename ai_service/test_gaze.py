import cv2
import numpy as np
from modules.face_detection import FaceDetector
import base64

def create_test_face():
    # Create a face image optimized for MTCNN
    face = np.ones((480, 640, 3), dtype=np.uint8) * 240
    
    # Draw face shape
    cv2.ellipse(face, (320, 240), (120, 150), 0, 0, 360, (205, 230, 245), -1)
    cv2.ellipse(face, (290, 240), (80, 120), 0, 0, 360, (180, 200, 210), -1)
    
    # Draw eyes
    cv2.ellipse(face, (280, 220), (25, 15), 0, 0, 360, (255, 255, 255), -1)
    cv2.circle(face, (280, 220), 10, (50, 50, 50), -1)
    cv2.circle(face, (280, 220), 5, (0, 0, 0), -1)
    cv2.ellipse(face, (360, 220), (25, 15), 0, 0, 360, (255, 255, 255), -1)
    cv2.circle(face, (360, 220), 10, (50, 50, 50), -1)
    cv2.circle(face, (360, 220), 5, (0, 0, 0), -1)
    
    # Draw eyebrows
    cv2.ellipse(face, (280, 195), (25, 8), 0, 0, 180, (100, 100, 100), 4)
    cv2.ellipse(face, (360, 195), (25, 8), 0, 180, 360, (100, 100, 100), 4)
    
    return face

def create_face_looking_down(base_face):
    face_down = base_face.copy()
    
    # Clear nose and mouth area
    cv2.rectangle(face_down, (290, 240), (350, 300), (205, 230, 245), -1)
    
    # Draw nose and mouth lower
    cv2.ellipse(face_down, (320, 270), (18, 25), 0, 0, 180, (160, 170, 180), 4)
    cv2.line(face_down, (310, 270), (330, 270), (160, 170, 180), 3)
    cv2.ellipse(face_down, (320, 310), (40, 20), 0, 0, 180, (150, 150, 150), 3)
    
    return face_down

def encode_image(image):
    _, buffer = cv2.imencode('.jpg', image)
    return base64.b64encode(buffer).decode('utf-8')

def main():
    detector = FaceDetector()
    
    # Test neutral face
    face = create_test_face()
    cv2.imwrite('test_face_normal.jpg', face)
    result = detector.analyze_frame(encode_image(face))
    print("\nNeutral face detection:")
    print(f"Direction: {result['gaze_data']['direction']}")
    print(f"Violations: {result['violations']}")
    
    # Test face looking down
    face_down = create_face_looking_down(face)
    cv2.imwrite('test_face_down.jpg', face_down)
    result_down = detector.analyze_frame(encode_image(face_down))
    print("\nFace looking down detection:")
    print(f"Direction: {result_down['gaze_data']['direction']}")
    print(f"Violations: {result_down['violations']}")

if __name__ == '__main__':
    main()
