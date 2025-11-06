#!/usr/bin/env python3
"""
Test runner for Secondary Camera Analyzer
"""
import sys
import os
import numpy as np
import cv2
import base64
from unittest.mock import Mock, patch

# Add the modules directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'modules'))

# Import dependencies first
from face_detection import FaceDetector
from object_detection import ObjectDetector

# Now import the module to test
from secondary_camera_analyzer import SecondaryCameraAnalyzer, convert_numpy_types

def create_sample_frame():
    """Create a sample frame for testing"""
    # Create a frame with sufficient brightness to not be detected as black
    frame = np.full((480, 640, 3), 80, dtype=np.uint8)  # Gray background
    frame[100:200, 100:200] = [150, 180, 220]  # Light blue rectangle
    frame[300:400, 400:500] = [120, 150, 180]   # Medium blue rectangle
    return frame

def create_black_frame():
    """Create a black frame for testing"""
    return np.zeros((480, 640, 3), dtype=np.uint8)

def create_hand_frame():
    """Create a frame with simulated hand regions"""
    frame = np.full((480, 640, 3), 70, dtype=np.uint8)  # Gray background
    
    # Add hand-like regions with skin color
    cv2.ellipse(frame, (200, 350), (40, 60), 0, 0, 360, (120, 160, 180), -1)
    cv2.ellipse(frame, (400, 380), (35, 55), 0, 0, 360, (110, 150, 170), -1)
    
    return frame

def encode_frame(frame):
    """Helper to encode frame as base64"""
    _, buffer = cv2.imencode('.jpg', frame)
    return base64.b64encode(buffer).decode('utf-8')

def test_convert_numpy_types():
    """Test numpy type conversion utility"""
    print("Testing convert_numpy_types...")
    
    test_data = {
        'bool': np.bool_(True),
        'int': np.int32(42),
        'float': np.float64(3.14),
        'array': np.array([1, 2, 3]),
        'nested': {
            'inner_bool': np.bool_(False),
            'inner_list': [np.int64(100), np.float32(2.5)]
        }
    }
    
    result = convert_numpy_types(test_data)
    
    assert isinstance(result['bool'], bool), "Boolean conversion failed"
    assert isinstance(result['int'], int), "Integer conversion failed"
    assert isinstance(result['float'], float), "Float conversion failed"
    assert isinstance(result['array'], list), "Array conversion failed"
    assert isinstance(result['nested']['inner_bool'], bool), "Nested boolean conversion failed"
    
    print("✓ convert_numpy_types test passed")

def test_analyzer_initialization():
    """Test analyzer initialization"""
    print("Testing analyzer initialization...")
    
    with patch('modules.face_detection.FaceDetector') as mock_face_detector, \
         patch('modules.object_detection.ObjectDetector') as mock_object_detector:
        
        mock_face_detector.return_value.analyze_frame.return_value = {
            'faces_detected': 1,
            'confidence': 0.8,
            'violations': []
        }
        
        mock_object_detector.return_value.analyze_frame.return_value = {
            'detections': [],
            'status': 'clear'
        }
        
        analyzer = SecondaryCameraAnalyzer()
        
        assert analyzer.hand_confidence_threshold == 0.3
        assert analyzer.keyboard_confidence_threshold == 0.4
        assert analyzer.face_coverage_threshold == 0.6
        assert analyzer.history_size == 10
        assert len(analyzer.analysis_history) == 0
        
        print("✓ Analyzer initialization test passed")
        return analyzer

def test_black_frame_detection(analyzer):
    """Test black frame detection"""
    print("Testing black frame detection...")
    
    black_frame = create_black_frame()
    sample_frame = create_sample_frame()
    
    assert analyzer._is_black_or_invalid_frame(black_frame) == True, "Black frame not detected"
    assert analyzer._is_black_or_invalid_frame(sample_frame) == False, "Normal frame incorrectly detected as black"
    
    # Test very dark frame
    dark_frame = np.ones((480, 640, 3), dtype=np.uint8) * 5
    assert analyzer._is_black_or_invalid_frame(dark_frame) == True, "Dark frame not detected"
    
    print("✓ Black frame detection test passed")

def test_hand_placement_analysis(analyzer):
    """Test hand placement detection"""
    print("Testing hand placement analysis...")
    
    hand_frame = create_hand_frame()
    result = analyzer._analyze_hand_placement(hand_frame)
    
    assert 'hands_detected' in result
    assert 'hands_visible' in result
    assert 'hand_positions' in result
    assert 'confidence' in result
    assert 'analysis_quality' in result
    
    assert result['analysis_quality'] in ['good', 'poor', 'error']
    
    print("✓ Hand placement analysis test passed")

def test_keyboard_visibility_analysis(analyzer):
    """Test keyboard visibility detection"""
    print("Testing keyboard visibility analysis...")
    
    sample_frame = create_sample_frame()
    result = analyzer._analyze_keyboard_visibility(sample_frame)
    
    assert 'keyboard_visible' in result
    assert 'keyboard_detections' in result
    assert 'keyboard_like_regions' in result
    assert 'positioning_score' in result
    assert 'confidence' in result
    assert 'analysis_quality' in result
    
    assert result['analysis_quality'] in ['good', 'needs_adjustment', 'error']
    
    print("✓ Keyboard visibility analysis test passed")

def test_workspace_compliance_analysis(analyzer):
    """Test workspace compliance analysis"""
    print("Testing workspace compliance analysis...")
    
    sample_frame = create_sample_frame()
    result = analyzer._analyze_workspace_compliance(sample_frame)
    
    assert 'lighting_quality' in result
    assert 'image_quality' in result
    assert 'workspace_elements' in result
    assert 'prohibited_objects' in result
    assert 'compliance_score' in result
    
    # Check lighting quality structure
    lighting = result['lighting_quality']
    assert 'brightness' in lighting
    assert 'contrast' in lighting
    assert 'quality_score' in lighting
    
    print("✓ Workspace compliance analysis test passed")

def test_full_analysis_pipeline(analyzer):
    """Test complete analysis pipeline"""
    print("Testing full analysis pipeline...")
    
    hand_frame = create_hand_frame()
    encoded = encode_frame(hand_frame)
    result = analyzer.analyze_secondary_camera_frame(encoded)
    
    # Check main structure
    assert result['status'] == 'success', f"Analysis failed: {result.get('error', 'Unknown error')}"
    assert 'analysis' in result
    assert 'recommendations' in result
    assert 'violation_prevention' in result
    assert 'stability_score' in result
    
    # Check analysis components
    analysis = result['analysis']
    assert 'hand_placement' in analysis
    assert 'keyboard_visibility' in analysis
    assert 'face_coverage' in analysis
    assert 'workspace_compliance' in analysis
    assert 'overall_compliance' in analysis
    
    print("✓ Full analysis pipeline test passed")

def test_black_frame_analysis(analyzer):
    """Test analysis of black frame"""
    print("Testing black frame analysis...")
    
    black_frame = create_black_frame()
    encoded = encode_frame(black_frame)
    result = analyzer.analyze_secondary_camera_frame(encoded)
    
    assert result['status'] == 'success'
    assert result['analysis']['overall_compliance']['status'] == 'black_screen'
    assert result['violation_prevention']['risk_level'] == 'very_high'
    assert 'black screen' in result['recommendations'][0].lower()
    
    print("✓ Black frame analysis test passed")

def test_violation_generation(analyzer):
    """Test violation generation"""
    print("Testing violation generation...")
    
    analysis_result = {
        'status': 'success',
        'analysis': {
            'hand_placement': {'hands_visible': False},
            'keyboard_visibility': {'keyboard_visible': False},
            'face_coverage': {'face_coverage': {'coverage_quality': 'too_detailed'}},
            'workspace_compliance': {'compliance_score': 0.2}
        }
    }
    
    violations = analyzer.generate_secondary_camera_violations(analysis_result)
    
    assert len(violations) > 0, "No violations generated"
    
    # Check violation structure
    for violation in violations:
        assert 'type' in violation
        assert 'severity' in violation
        assert 'confidence' in violation
        assert 'message' in violation
        assert 'source' in violation
        assert violation['source'] == 'secondary_camera'
    
    print("✓ Violation generation test passed")

def test_error_handling(analyzer):
    """Test error handling"""
    print("Testing error handling...")
    
    # Test with invalid input
    result = analyzer.analyze_secondary_camera_frame("invalid_data")
    
    assert result['status'] == 'error'
    assert 'error' in result
    assert result['analysis'] is None
    assert len(result['recommendations']) > 0
    assert 'violation_prevention' in result
    
    print("✓ Error handling test passed")

def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("SECONDARY CAMERA ANALYZER TEST SUITE")
    print("=" * 60)
    
    try:
        # Test utility functions
        test_convert_numpy_types()
        
        # Initialize analyzer
        analyzer = test_analyzer_initialization()
        
        # Test core functionality
        test_black_frame_detection(analyzer)
        test_hand_placement_analysis(analyzer)
        test_keyboard_visibility_analysis(analyzer)
        test_workspace_compliance_analysis(analyzer)
        
        # Test full pipeline
        test_full_analysis_pipeline(analyzer)
        test_black_frame_analysis(analyzer)
        test_violation_generation(analyzer)
        test_error_handling(analyzer)
        
        print("=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("=" * 60)
        
        return True
        
    except Exception as e:
        print("=" * 60)
        print(f"❌ TEST FAILED: {str(e)}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
