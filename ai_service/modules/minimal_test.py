from face_detection import FaceDetector

def test_basic_functionality():
    detector = FaceDetector()
    
    # Test error handling
    result = detector.analyze_frame("invalid_input")
    print("\nTest error handling:")
    print(result)
    
    # Test synthetic test cases
    result = detector.analyze_frame("face_down.jpg")
    print("\nTest face down detection:")
    print(result)
    
    result = detector.analyze_frame("multi_face_image")
    print("\nTest multiple faces detection:")
    print(result)
    
    result = detector.analyze_frame("moved_face")
    print("\nTest movement detection:")
    print(result)

if __name__ == '__main__':
    test_basic_functionality()
