import cv2
import numpy as np
from face_detection import FaceDetector

# Create test images
def create_test_images():
    # Create blank image
    blank_image = np.zeros((480, 640, 3), dtype=np.uint8)
    
    # Create face image
    face_image = np.ones((480, 640, 3), dtype=np.uint8) * 240
    skin_color = (205, 230, 245)
    cv2.ellipse(face_image, (320, 240), (120, 150), 0, 0, 360, skin_color, -1)
    
    # Add facial features
    cv2.ellipse(face_image, (280, 220), (25, 15), 0, 0, 360, (255, 255, 255), -1)
    cv2.circle(face_image, (280, 220), 10, (50, 50, 50), -1)
    cv2.ellipse(face_image, (360, 220), (25, 15), 0, 0, 360, (255, 255, 255), -1)
    cv2.circle(face_image, (360, 220), 10, (50, 50, 50), -1)
    
    # Save images
    cv2.imwrite('blank.jpg', blank_image)
    cv2.imwrite('face.jpg', face_image)
    
    return 'blank.jpg', 'face.jpg'

def test_face_detection():
    detector = FaceDetector()
    blank_path, face_path = create_test_images()
    
    # Test no face detection
    print("\nTesting no face detection:")
    result = detector.analyze_frame(blank_path)
    print(result)
    
    # Test single face detection
    print("\nTesting single face detection:")
    result = detector.analyze_frame(face_path)
    print(result)
    
    # Test multiple faces detection
    print("\nTesting multiple faces detection:")
    result = detector.analyze_frame('multi_face_image')
    print(result)
    
    # Test gaze direction
    print("\nTesting gaze direction:")
    result = detector.analyze_frame('face_down.jpg')
    print(result)
    
    # Test movement detection
    print("\nTesting movement detection:")
    result = detector.analyze_frame('moved_face')
    print(result)
    
    # Test error handling
    print("\nTesting error handling:")
    result = detector.analyze_frame("invalid_input")
    print(result)

if __name__ == '__main__':
    test_face_detection()
