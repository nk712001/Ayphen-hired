from face_detection import FaceDetector

def test_synthetic_cases():
    detector = FaceDetector()
    
    # Test case 1: Face looking down
    result = detector.analyze_frame("face_down.jpg")
    assert result["gaze_data"]["direction"] == "down"
    assert any(v["type"] == "gaze_violation" for v in result["violations"])
    print("✓ Gaze detection test passed")
    
    # Test case 2: Multiple faces
    result = detector.analyze_frame("multi_face_image")
    assert result["faces_detected"] == 2
    assert any(v["type"] == "multiple_faces" for v in result["violations"])
    print("✓ Multiple faces test passed")
    
    # Test case 3: Movement detection
    result = detector.analyze_frame("moved_face")
    assert any(v["type"] == "movement" for v in result["violations"])
    print("✓ Movement detection test passed")
    
    # Test case 4: Error handling
    result = detector.analyze_frame("invalid_input")
    assert result["faces_detected"] == 0
    assert any(v["type"] == "error" for v in result["violations"])
    print("✓ Error handling test passed")

if __name__ == '__main__':
    print("Running face detection tests...")
    try:
        test_synthetic_cases()
        print("\nAll tests passed successfully!")
    except AssertionError as e:
        print(f"\nTest failed: {str(e)}")
    except Exception as e:
        print(f"\nError running tests: {str(e)}")
