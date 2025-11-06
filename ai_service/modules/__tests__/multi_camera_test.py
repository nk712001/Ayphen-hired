import unittest
import numpy as np
import base64
import cv2
from unittest.mock import MagicMock, patch
import sys
import os

# Add parent directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from multi_camera import MultiCameraManager

class TestMultiCameraManager(unittest.TestCase):
    def setUp(self):
        # Create a mock face detector
        self.mock_face_detector = MagicMock()
        self.mock_face_detector.analyze_frame.return_value = {
            'faces_detected': 1,
            'violations': []
        }
        
        # Create test images
        self.primary_image = np.zeros((720, 1280, 3), dtype=np.uint8)
        cv2.circle(self.primary_image, (640, 360), 100, (255, 255, 255), -1)  # Draw a face
        self.primary_image_b64 = self._image_to_base64(self.primary_image)
        
        self.secondary_image = np.zeros((720, 1280, 3), dtype=np.uint8)
        # Draw a keyboard-like structure
        cv2.rectangle(self.secondary_image, (300, 500), (980, 600), (200, 200, 200), -1)
        # Draw hand-like shapes
        cv2.circle(self.secondary_image, (500, 450), 50, (172, 112, 96), -1)
        cv2.circle(self.secondary_image, (780, 450), 50, (172, 112, 96), -1)
        self.secondary_image_b64 = self._image_to_base64(self.secondary_image)
        
        # Create instance with mocked face detector
        with patch('multi_camera.FaceDetector', return_value=self.mock_face_detector):
            self.camera_manager = MultiCameraManager()
    
    def _image_to_base64(self, image):
        """Convert numpy image to base64 string"""
        _, buffer = cv2.imencode('.jpg', image)
        return base64.b64encode(buffer).decode('utf-8')
    
    def test_decode_image(self):
        """Test image decoding from base64"""
        decoded = self.camera_manager._decode_image(self.primary_image_b64)
        self.assertIsNotNone(decoded)
        self.assertEqual(decoded.shape, (720, 1280, 3))
    
    def test_validate_primary_camera(self):
        """Test primary camera validation"""
        result = self.camera_manager.validate_primary_camera(self.primary_image_b64)
        self.assertEqual(result['status'], 'valid')
        self.assertTrue(result['position_valid'])
        self.assertEqual(result['faces_detected'], 1)
    
    def test_validate_primary_camera_no_face(self):
        """Test primary camera validation with no face"""
        # Update mock to return no faces
        self.mock_face_detector.analyze_frame.return_value = {
            'faces_detected': 0,
            'violations': [{'type': 'no_face'}]
        }
        
        result = self.camera_manager.validate_primary_camera(self.primary_image_b64)
        self.assertEqual(result['status'], 'invalid')
        self.assertFalse(result['position_valid'])
    
    @patch('multi_camera.MultiCameraManager._detect_hands_and_keyboard')
    @patch('multi_camera.MultiCameraManager._validate_camera_angle')
    def test_validate_secondary_camera(self, mock_validate_angle, mock_detect_hands_keyboard):
        """Test secondary camera validation"""
        # Configure mocks
        mock_detect_hands_keyboard.return_value = (True, True)  # Hands visible, keyboard visible
        mock_validate_angle.return_value = True  # Angle is appropriate
        
        result = self.camera_manager.validate_secondary_camera(self.secondary_image_b64)
        self.assertEqual(result['status'], 'valid')
        self.assertTrue(result['position_valid'])
        self.assertTrue(result['hands_visible'])
        self.assertTrue(result['keyboard_visible'])
        self.assertTrue(result['angle_appropriate'])
    
    @patch('multi_camera.MultiCameraManager._detect_hands_and_keyboard')
    @patch('multi_camera.MultiCameraManager._validate_camera_angle')
    def test_validate_secondary_camera_invalid(self, mock_validate_angle, mock_detect_hands_keyboard):
        """Test secondary camera validation with invalid setup"""
        # Configure mocks for invalid setup
        mock_detect_hands_keyboard.return_value = (False, True)  # No hands visible
        mock_validate_angle.return_value = False  # Angle is not appropriate
        
        result = self.camera_manager.validate_secondary_camera(self.secondary_image_b64)
        self.assertEqual(result['status'], 'invalid')
        self.assertFalse(result['position_valid'])
        self.assertFalse(result['hands_visible'])
        self.assertTrue(result['keyboard_visible'])
        self.assertFalse(result['angle_appropriate'])
    
    def test_detect_hands_and_keyboard(self):
        """Test hands and keyboard detection"""
        hands_visible, keyboard_visible = self.camera_manager._detect_hands_and_keyboard(self.secondary_image)
        # In our test image, we've drawn shapes that should be detected
        self.assertTrue(hands_visible)
        self.assertTrue(keyboard_visible)
    
    def test_validate_camera_angle(self):
        """Test camera angle validation"""
        # Our test image should have reasonable brightness and contrast
        result = self.camera_manager._validate_camera_angle(self.secondary_image)
        self.assertTrue(result)
    
    def test_process_dual_camera(self):
        """Test processing both cameras together"""
        # Configure mocks for successful validation
        with patch('multi_camera.MultiCameraManager.validate_primary_camera') as mock_primary:
            with patch('multi_camera.MultiCameraManager.validate_secondary_camera') as mock_secondary:
                mock_primary.return_value = {
                    'status': 'valid',
                    'position_valid': True,
                    'faces_detected': 1
                }
                mock_secondary.return_value = {
                    'status': 'valid',
                    'position_valid': True,
                    'hands_visible': True,
                    'keyboard_visible': True,
                    'angle_appropriate': True
                }
                
                result = self.camera_manager.process_dual_camera(
                    self.primary_image_b64, 
                    self.secondary_image_b64
                )
                
                self.assertEqual(result['overall_status'], 'valid')
                self.assertEqual(result['primary_camera']['status'], 'valid')
                self.assertEqual(result['secondary_camera']['status'], 'valid')
    
    def test_get_primary_guidance(self):
        """Test guidance generation for primary camera"""
        # Test with no face
        guidance = self.camera_manager._get_primary_guidance({
            'faces_detected': 0,
            'violations': [{'type': 'no_face'}]
        })
        self.assertIn('No face detected', guidance)
        
        # Test with multiple faces
        guidance = self.camera_manager._get_primary_guidance({
            'faces_detected': 2,
            'violations': []
        })
        self.assertIn('Multiple faces detected', guidance)
        
        # Test with gaze violation
        guidance = self.camera_manager._get_primary_guidance({
            'faces_detected': 1,
            'violations': [{'type': 'gaze_violation'}]
        })
        self.assertIn('look directly at the camera', guidance)
        
        # Test with good position
        guidance = self.camera_manager._get_primary_guidance({
            'faces_detected': 1,
            'violations': []
        })
        self.assertIn('Face position looks good', guidance)
    
    def test_get_secondary_guidance(self):
        """Test guidance generation for secondary camera"""
        # Test with bad angle
        guidance = self.camera_manager._get_secondary_guidance(True, True, False)
        self.assertIn('adjust the camera angle', guidance)
        
        # Test with no keyboard
        guidance = self.camera_manager._get_secondary_guidance(True, False, True)
        self.assertIn('Keyboard not visible', guidance)
        
        # Test with no hands
        guidance = self.camera_manager._get_secondary_guidance(False, True, True)
        self.assertIn('Hands not visible', guidance)
        
        # Test with good setup
        guidance = self.camera_manager._get_secondary_guidance(True, True, True)
        self.assertIn('Secondary camera position looks good', guidance)

if __name__ == '__main__':
    unittest.main()
