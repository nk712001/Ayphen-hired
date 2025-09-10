from face_detection import FaceDetector

def verify_face_detection():
    detector = FaceDetector()
    
    # Test cases
    test_inputs = [
        "face_down.jpg",
        "multi_face_image",
        "moved_face",
        "invalid_input"
    ]
    
    for test_input in test_inputs:
        print(f"\nTesting: {test_input}")
        result = detector.analyze_frame(test_input)
        print(f"Result: {result}")
        
        # Verify result structure
        assert "faces_detected" in result
        assert "violations" in result
        assert "gaze_data" in result
        assert "confidence" in result
        
        # Verify specific test cases
        if test_input == "face_down.jpg":
            assert result["gaze_data"]["direction"] == "down"
            assert any(v["type"] == "gaze_violation" for v in result["violations"])
        elif test_input == "multi_face_image":
            assert result["faces_detected"] == 2
            assert any(v["type"] == "multiple_faces" for v in result["violations"])
        elif test_input == "moved_face":
            assert any(v["type"] == "movement" for v in result["violations"])
        else:
            assert any(v["type"] == "error" for v in result["violations"])
        
        print("✓ All assertions passed")

if __name__ == '__main__':
    verify_face_detection()
