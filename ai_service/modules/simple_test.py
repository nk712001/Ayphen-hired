from face_detection import FaceDetector

def test_face_detection():
    detector = FaceDetector()
    
    # Test no face detection
    print("\nTesting no face detection:")
    result = detector.analyze_frame("blank_image")
    print(result)
    
    # Test single face detection
    print("\nTesting single face detection:")
    result = detector.analyze_frame("face_image")
    print(result)
    
    # Test multiple faces detection
    print("\nTesting multiple faces detection:")
    result = detector.analyze_frame("multi_face_image")
    print(result)
    
    # Test gaze direction
    print("\nTesting gaze direction:")
    result = detector.analyze_frame("face_down.jpg")
    print(result)
    
    # Test movement detection
    print("\nTesting movement detection:")
    result = detector.analyze_frame("moved_face")
    print(result)

if __name__ == '__main__':
    test_face_detection()
