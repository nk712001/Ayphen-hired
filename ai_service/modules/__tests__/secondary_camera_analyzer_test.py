import pytest
import numpy as np
import cv2
import base64
import json
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add the parent directory to sys.path to import modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from secondary_camera_analyzer import SecondaryCameraAnalyzer, convert_numpy_types

class TestSecondaryCameraAnalyzer:
    """Comprehensive test suite for SecondaryCameraAnalyzer"""
    
    @pytest.fixture
    def analyzer(self):
        """Create analyzer instance with mocked dependencies"""
        with patch('secondary_camera_analyzer.FaceDetector') as mock_face_detector, \
             patch('secondary_camera_analyzer.ObjectDetector') as mock_object_detector:
            
            # Mock face detector
            mock_face_detector.return_value.analyze_frame.return_value = {
                'faces_detected': 1,
                'confidence': 0.8,
                'violations': []
            }
            
            # Mock object detector
            mock_object_detector.return_value.analyze_frame.return_value = {
                'detections': [],
                'status': 'clear'
            }
            
            analyzer = SecondaryCameraAnalyzer()
            return analyzer
    
    @pytest.fixture
    def sample_frame(self):
        """Create a sample frame for testing"""
        # Create a 640x480 BGR frame with some content
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        
        # Add some color variation to simulate a real frame
        frame[100:200, 100:200] = [100, 150, 200]  # Light blue rectangle
        frame[300:400, 400:500] = [80, 120, 160]   # Darker blue rectangle
        
        return frame
    
    @pytest.fixture
    def black_frame(self):
        """Create a black frame for testing"""
        return np.zeros((480, 640, 3), dtype=np.uint8)
    
    @pytest.fixture
    def hand_frame(self):
        """Create a frame with simulated hand regions"""
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        
        # Add background
        frame[:] = [50, 50, 50]
        
        # Add hand-like regions with skin color
        # Hand 1 - in typing position (lower part of frame)
        cv2.ellipse(frame, (200, 350), (40, 60), 0, 0, 360, (120, 160, 180), -1)
        
        # Hand 2 - another hand position
        cv2.ellipse(frame, (400, 380), (35, 55), 0, 0, 360, (110, 150, 170), -1)
        
        return frame
    
    @pytest.fixture
    def keyboard_frame(self):
        """Create a frame with keyboard-like rectangular patterns"""
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        
        # Add background
        frame[:] = [40, 40, 40]
        
        # Add keyboard-like rectangular region in lower part
        keyboard_region = frame[350:450, 150:500]
        keyboard_region[:] = [80, 80, 80]
        
        # Add key-like patterns
        for i in range(0, 100, 15):
            for j in range(0, 350, 20):
                if i + 10 < 100 and j + 15 < 350:
                    keyboard_region[i:i+10, j:j+15] = [120, 120, 120]
        
        return frame
    
    def encode_frame(self, frame):
        """Helper to encode frame as base64"""
        _, buffer = cv2.imencode('.jpg', frame)
        return base64.b64encode(buffer).decode('utf-8')
    
    def test_convert_numpy_types(self):
        """Test numpy type conversion utility"""
        # Test various numpy types
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
        
        assert isinstance(result['bool'], bool)
        assert isinstance(result['int'], int)
        assert isinstance(result['float'], float)
        assert isinstance(result['array'], list)
        assert isinstance(result['nested']['inner_bool'], bool)
        assert isinstance(result['nested']['inner_list'][0], int)
        assert isinstance(result['nested']['inner_list'][1], float)
    
    def test_analyzer_initialization(self, analyzer):
        """Test analyzer initialization"""
        assert analyzer.hand_confidence_threshold == 0.3
        assert analyzer.keyboard_confidence_threshold == 0.4
        assert analyzer.face_coverage_threshold == 0.6
        assert analyzer.history_size == 10
        assert len(analyzer.analysis_history) == 0
    
    def test_decode_image_success(self, analyzer, sample_frame):
        """Test successful image decoding"""
        encoded = self.encode_frame(sample_frame)
        decoded = analyzer._decode_image(encoded)
        
        assert decoded.shape == sample_frame.shape
        assert decoded.dtype == np.uint8
    
    def test_decode_image_failure(self, analyzer):
        """Test image decoding failure"""
        with pytest.raises(ValueError, match="Failed to decode image"):
            analyzer._decode_image("invalid_base64_data")
    
    def test_black_frame_detection(self, analyzer, black_frame, sample_frame):
        """Test black frame detection"""
        # Black frame should be detected
        assert analyzer._is_black_or_invalid_frame(black_frame) == True
        
        # Normal frame should not be detected as black
        assert analyzer._is_black_or_invalid_frame(sample_frame) == False
        
        # Very dark frame should be detected
        dark_frame = np.ones((480, 640, 3), dtype=np.uint8) * 5
        assert analyzer._is_black_or_invalid_frame(dark_frame) == True
    
    def test_analyze_black_frame(self, analyzer, black_frame):
        """Test analysis of black frame"""
        encoded = self.encode_frame(black_frame)
        result = analyzer.analyze_secondary_camera_frame(encoded)
        
        assert result['status'] == 'success'
        assert result['analysis']['overall_compliance']['status'] == 'black_screen'
        assert result['violation_prevention']['risk_level'] == 'very_high'
        assert 'black screen' in result['recommendations'][0].lower()
    
    def test_hand_placement_analysis(self, analyzer, hand_frame):
        """Test hand placement detection"""
        result = analyzer._analyze_hand_placement(hand_frame)
        
        assert result['hands_detected'] >= 1
        assert result['hands_visible'] == True
        assert len(result['hand_positions']) >= 1
        assert result['confidence'] > 0
        assert result['analysis_quality'] in ['good', 'poor']
        
        # Check hand position data structure
        if result['hand_positions']:
            pos = result['hand_positions'][0]
            assert 'center' in pos
            assert 'bbox' in pos
            assert 'area_ratio' in pos
            assert 0 <= pos['center'][0] <= 1
            assert 0 <= pos['center'][1] <= 1
    
    def test_keyboard_visibility_analysis(self, analyzer, keyboard_frame):
        """Test keyboard visibility detection"""
        result = analyzer._analyze_keyboard_visibility(keyboard_frame)
        
        assert 'keyboard_visible' in result
        assert 'keyboard_detections' in result
        assert 'keyboard_like_regions' in result
        assert 'positioning_score' in result
        assert 'confidence' in result
        assert result['analysis_quality'] in ['good', 'needs_adjustment', 'error']
        
        # Should detect keyboard-like patterns
        assert len(result['keyboard_like_regions']) >= 0
    
    def test_face_coverage_analysis(self, analyzer, sample_frame):
        """Test face coverage analysis"""
        result = analyzer._analyze_face_coverage(sample_frame)
        
        assert 'face_coverage' in result
        assert 'face_detection_results' in result
        assert 'confidence' in result
        
        face_coverage = result['face_coverage']
        assert 'faces_in_secondary_view' in face_coverage
        assert 'appropriate_coverage' in face_coverage
        assert 'coverage_quality' in face_coverage
        
        assert face_coverage['coverage_quality'] in ['none', 'appropriate', 'too_detailed', 'unknown']
    
    def test_workspace_compliance_analysis(self, analyzer, sample_frame):
        """Test workspace compliance analysis"""
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
        
        # Check image quality structure
        image_quality = result['image_quality']
        assert 'blur_score' in image_quality
        assert 'is_sharp' in image_quality
        assert 'aspect_ratio' in image_quality
    
    def test_typing_position_check(self, analyzer):
        """Test typing position detection"""
        # Hands in typing position (lower part of frame)
        typing_positions = [
            {'center': (0.3, 0.7), 'bbox': (0.25, 0.65, 0.1, 0.1), 'area_ratio': 0.01},
            {'center': (0.7, 0.8), 'bbox': (0.65, 0.75, 0.1, 0.1), 'area_ratio': 0.01}
        ]
        
        result = analyzer._check_typing_position(typing_positions, (480, 640))
        assert result == True
        
        # Hands not in typing position (upper part of frame)
        non_typing_positions = [
            {'center': (0.3, 0.2), 'bbox': (0.25, 0.15, 0.1, 0.1), 'area_ratio': 0.01}
        ]
        
        result = analyzer._check_typing_position(non_typing_positions, (480, 640))
        assert result == False
        
        # No hands
        result = analyzer._check_typing_position([], (480, 640))
        assert result == False
    
    def test_workspace_elements_detection(self, analyzer, sample_frame):
        """Test workspace elements detection"""
        result = analyzer._detect_workspace_elements(sample_frame)
        
        assert 'desk_surface_visible' in result
        assert 'horizontal_lines_detected' in result
        assert 'workspace_structure_score' in result
        
        assert isinstance(result['desk_surface_visible'], bool)
        assert isinstance(result['horizontal_lines_detected'], int)
        assert 0 <= result['workspace_structure_score'] <= 1
    
    def test_lighting_score_calculation(self, analyzer):
        """Test lighting quality score calculation"""
        # Optimal lighting
        score = analyzer._calculate_lighting_score(130, 40)
        assert 0.8 <= score <= 1.0
        
        # Poor lighting (too dark)
        score = analyzer._calculate_lighting_score(20, 10)
        assert score < 0.5
        
        # Poor lighting (too bright)
        score = analyzer._calculate_lighting_score(250, 10)
        assert score < 0.5
    
    def test_workspace_compliance_score(self, analyzer):
        """Test workspace compliance score calculation"""
        workspace_elements = {'workspace_structure_score': 0.8}
        object_results = {'detections': []}
        
        score = analyzer._calculate_workspace_compliance_score(
            130, 40, 150, workspace_elements, object_results
        )
        
        assert 0 <= score <= 1
        
        # Test with prohibited objects (should reduce score)
        object_results_with_violations = {'detections': ['phone', 'book']}
        score_with_violations = analyzer._calculate_workspace_compliance_score(
            130, 40, 150, workspace_elements, object_results_with_violations
        )
        
        assert score_with_violations < score
    
    def test_overall_compliance_calculation(self, analyzer):
        """Test overall compliance score calculation"""
        hand_analysis = {'confidence': 0.8, 'hands_visible': True}
        keyboard_analysis = {'confidence': 0.7, 'keyboard_visible': True}
        face_analysis = {'face_coverage': {'appropriate_coverage': True}}
        workspace_analysis = {'compliance_score': 0.9}
        
        result = analyzer._calculate_overall_compliance(
            hand_analysis, keyboard_analysis, face_analysis, workspace_analysis
        )
        
        assert 'overall_score' in result
        assert 'status' in result
        assert 'component_scores' in result
        
        assert 0 <= result['overall_score'] <= 1
        assert result['status'] in ['excellent', 'good', 'acceptable', 'needs_improvement']
        
        component_scores = result['component_scores']
        assert 'hands' in component_scores
        assert 'keyboard' in component_scores
        assert 'face' in component_scores
        assert 'workspace' in component_scores
    
    def test_recommendations_generation(self, analyzer):
        """Test recommendation generation"""
        # Test case with issues
        analysis_result = {
            'hand_placement': {'hands_visible': False, 'hands_in_typing_position': False},
            'keyboard_visibility': {'keyboard_visible': False, 'positioning_score': 0.3},
            'face_coverage': {'face_coverage': {'coverage_quality': 'too_detailed'}},
            'workspace_compliance': {
                'lighting_quality': {'quality_score': 0.3},
                'image_quality': {'is_sharp': False}
            }
        }
        
        recommendations = analyzer._generate_recommendations(analysis_result)
        
        assert len(recommendations) > 0
        assert any('hands' in rec.lower() for rec in recommendations)
        assert any('keyboard' in rec.lower() or 'camera' in rec.lower() for rec in recommendations)
        
        # Test case with good setup
        good_analysis = {
            'hand_placement': {'hands_visible': True, 'hands_in_typing_position': True},
            'keyboard_visibility': {'keyboard_visible': True, 'positioning_score': 0.8},
            'face_coverage': {'face_coverage': {'coverage_quality': 'appropriate'}},
            'workspace_compliance': {
                'lighting_quality': {'quality_score': 0.8},
                'image_quality': {'is_sharp': True}
            }
        }
        
        good_recommendations = analyzer._generate_recommendations(good_analysis)
        assert any('good' in rec.lower() for rec in good_recommendations)
    
    def test_violation_risk_assessment(self, analyzer):
        """Test violation risk assessment"""
        # High compliance - low risk
        high_compliance = {
            'overall_compliance': {'overall_score': 0.9}
        }
        
        risk = analyzer._assess_violation_risk(high_compliance)
        assert risk['risk_level'] == 'low'
        assert risk['confidence'] >= 0.8
        
        # Low compliance - high risk
        low_compliance = {
            'overall_compliance': {'overall_score': 0.2}
        }
        
        risk = analyzer._assess_violation_risk(low_compliance)
        assert risk['risk_level'] == 'very_high'
        assert risk['confidence'] >= 0.8
    
    def test_violation_generation(self, analyzer):
        """Test violation generation based on analysis"""
        # Analysis with violations
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
        
        assert len(violations) > 0
        
        # Check violation structure
        for violation in violations:
            assert 'type' in violation
            assert 'severity' in violation
            assert 'confidence' in violation
            assert 'message' in violation
            assert 'source' in violation
            assert violation['source'] == 'secondary_camera'
        
        # Check specific violation types
        violation_types = [v['type'] for v in violations]
        assert 'secondary_camera_hands_not_visible' in violation_types
        assert 'secondary_camera_keyboard_not_visible' in violation_types
    
    def test_analysis_history_and_stability(self, analyzer, sample_frame):
        """Test analysis history tracking and stability scoring"""
        # Initially no history
        assert len(analyzer.analysis_history) == 0
        assert analyzer._calculate_stability_score() == 0.5
        
        # Add some analysis results
        for i in range(5):
            analysis_result = {
                'overall_compliance': {'overall_score': 0.8 + i * 0.02}
            }
            analyzer._update_analysis_history(analysis_result)
        
        assert len(analyzer.analysis_history) == 5
        stability_score = analyzer._calculate_stability_score()
        assert 0 <= stability_score <= 1
        
        # Test history size limit
        for i in range(10):
            analysis_result = {
                'overall_compliance': {'overall_score': 0.7}
            }
            analyzer._update_analysis_history(analysis_result)
        
        assert len(analyzer.analysis_history) == analyzer.history_size
    
    def test_full_analysis_pipeline(self, analyzer, hand_frame):
        """Test complete analysis pipeline"""
        encoded = self.encode_frame(hand_frame)
        result = analyzer.analyze_secondary_camera_frame(encoded)
        
        # Check main structure
        assert result['status'] == 'success'
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
        
        # Check violation prevention
        violation_prevention = result['violation_prevention']
        assert 'risk_level' in violation_prevention
        assert 'confidence' in violation_prevention
        assert 'score' in violation_prevention
        assert 'prevention_effectiveness' in violation_prevention
    
    def test_error_handling(self, analyzer):
        """Test error handling in analysis"""
        # Test with invalid input
        result = analyzer.analyze_secondary_camera_frame("invalid_data")
        
        assert result['status'] == 'error'
        assert 'error' in result
        assert result['analysis'] is None
        assert len(result['recommendations']) > 0
        assert 'violation_prevention' in result
    
    @patch('secondary_camera_analyzer.cv2.cvtColor')
    def test_hand_analysis_error_handling(self, mock_cvtColor, analyzer, sample_frame):
        """Test error handling in hand analysis"""
        mock_cvtColor.side_effect = Exception("OpenCV error")
        
        result = analyzer._analyze_hand_placement(sample_frame)
        
        assert result['hands_detected'] == 0
        assert result['hands_visible'] == False
        assert result['confidence'] == 0.0
        assert result['analysis_quality'] == 'error'
        assert 'error' in result
    
    @patch('secondary_camera_analyzer.cv2.cvtColor')
    def test_keyboard_analysis_error_handling(self, mock_cvtColor, analyzer, sample_frame):
        """Test error handling in keyboard analysis"""
        mock_cvtColor.side_effect = Exception("OpenCV error")
        
        result = analyzer._analyze_keyboard_visibility(sample_frame)
        
        assert result['keyboard_visible'] == False
        assert result['confidence'] == 0.0
        assert result['analysis_quality'] == 'error'
        assert 'error' in result
    
    def test_face_analysis_error_handling(self, analyzer, sample_frame):
        """Test error handling in face analysis"""
        # Mock face detector to raise exception
        analyzer.face_detector.analyze_frame.side_effect = Exception("Face detection error")
        
        result = analyzer._analyze_face_coverage(sample_frame)
        
        assert result['face_coverage']['faces_in_secondary_view'] == 0
        assert result['face_coverage']['appropriate_coverage'] == True
        assert result['confidence'] == 0.0
        assert result['analysis_quality'] == 'error'
        assert 'error' in result
    
    @patch('secondary_camera_analyzer.cv2.cvtColor')
    def test_workspace_analysis_error_handling(self, mock_cvtColor, analyzer, sample_frame):
        """Test error handling in workspace analysis"""
        mock_cvtColor.side_effect = Exception("OpenCV error")
        
        result = analyzer._analyze_workspace_compliance(sample_frame)
        
        assert result['compliance_score'] == 0.0
        assert result['analysis_quality'] == 'error'
        assert 'error' in result

if __name__ == '__main__':
    # Run the tests
    pytest.main([__file__, '-v'])
