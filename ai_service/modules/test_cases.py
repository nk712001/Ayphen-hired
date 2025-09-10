from face_detection import FaceDetector

def test_face_detection():
    detector = FaceDetector()
    
    # Test case 1: No face detection
    print("\nTest 1: No face detection")
    result = detector.analyze_frame("blank_image")
    print(f"Expected: faces_detected=0, no_face violation")
    print(f"Got: {result}")
    
    # Test case 2: Single face detection
    print("\nTest 2: Single face detection")
    result = detector.analyze_frame("face_image")
    print(f"Expected: faces_detected=1, no violations")
    print(f"Got: {result}")
    
    # Test case 3: Multiple faces
    print("\nTest 3: Multiple faces detection")
    result = detector.analyze_frame("multi_face_image")
    print(f"Expected: faces_detected=2, multiple_faces violation")
    print(f"Got: {result}")
    
    # Test case 4: Gaze direction
    print("\nTest 4: Gaze direction")
    result = detector.analyze_frame("face_down.jpg")
    print(f"Expected: faces_detected=1, gaze_violation")
    print(f"Got: {result}")
    
    # Test case 5: Movement detection
    print("\nTest 5: Movement detection")
    result = detector.analyze_frame("moved_face")
    print(f"Expected: faces_detected=1, movement violation")
    print(f"Got: {result}")
    
    # Test case 6: Error handling
    print("\nTest 6: Error handling")
    result = detector.analyze_frame("invalid_input")
    print(f"Expected: faces_detected=0, error violation")
    print(f"Got: {result}")

if __name__ == '__main__':
    test_face_detection()
