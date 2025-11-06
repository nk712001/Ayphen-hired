import cv2
import numpy as np
import base64
from typing import Dict, List, Tuple, Optional
from .face_detection import FaceDetector
from .secondary_camera_analyzer import SecondaryCameraAnalyzer

class MultiCameraManager:
    """
    Manages multiple camera streams for enhanced proctoring.
    Supports primary (face) and secondary (environment) cameras.
    """
    def __init__(self):
        self.primary_detector = FaceDetector()
        self.secondary_detector = FaceDetector()
        self.secondary_analyzer = SecondaryCameraAnalyzer()
        self.primary_frame = None
        self.secondary_frame = None
        self.primary_position_valid = False
        self.secondary_position_valid = False
        self.position_history = []
        self.history_size = 10
        self.secondary_analysis_cache = None
        
    def _decode_image(self, base64_string: str) -> np.ndarray:
        """Convert base64 image data to numpy array"""
        try:
            # Decode image
            img_data = base64.b64decode(base64_string)
            nparr = np.frombuffer(img_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image is None:
                raise ValueError("Failed to decode image")
            
            print(f"[DEBUG] Decoded image shape: {image.shape}, mean value: {np.mean(image)}")
            return image
        except Exception as e:
            print(f"[ERROR] Failed to decode image: {str(e)}")
            raise ValueError(f"Failed to decode image: {str(e)}")
    
    def validate_primary_camera(self, frame_data: str) -> Dict:
        """
        Validates primary camera position (face camera).
        Primary camera should clearly show the user's face.
        """
        try:
            # Process the frame with face detector
            result = self.primary_detector.analyze_frame(frame_data)
            
            # Store the decoded frame
            self.primary_frame = self._decode_image(frame_data)
            
            # Check if face is detected and centered
            faces_detected = result.get('faces_detected', 0)
            self.primary_position_valid = faces_detected == 1 and not result.get('violations', [])
            
            # Add validation status to history for stability
            self.position_history.append(self.primary_position_valid)
            if len(self.position_history) > self.history_size:
                self.position_history.pop(0)
            
            # Calculate stability score (percentage of valid positions)
            stability_score = sum(self.position_history) / len(self.position_history) if self.position_history else 0
            
            return {
                'status': 'valid' if self.primary_position_valid else 'invalid',
                'faces_detected': faces_detected,
                'position_valid': self.primary_position_valid,
                'stability_score': stability_score,
                'guidance': self._get_primary_guidance(result)
            }
        except Exception as e:
            print(f"[ERROR] Primary camera validation failed: {str(e)}")
            return {
                'status': 'error',
                'error': str(e),
                'position_valid': False,
                'stability_score': 0,
                'guidance': "Error processing camera feed. Please check your camera."
            }
    
    def validate_secondary_camera(self, frame_data: str) -> Dict:
        """
        Validates secondary camera position using advanced AI analysis.
        Secondary camera should show keyboard, hands, and workspace with proper compliance.
        """
        try:
            # Decode the frame for legacy compatibility
            self.secondary_frame = self._decode_image(frame_data)
            
            # Use advanced AI analyzer for comprehensive evaluation
            ai_analysis = self.secondary_analyzer.analyze_secondary_camera_frame(frame_data)
            
            if ai_analysis['status'] == 'error':
                return {
                    'status': 'error',
                    'error': ai_analysis.get('error', 'AI analysis failed'),
                    'position_valid': False,
                    'guidance': "Error processing camera feed. Please check your camera."
                }
            
            # Extract key metrics from AI analysis
            analysis = ai_analysis['analysis']
            hand_analysis = analysis['hand_placement']
            keyboard_analysis = analysis['keyboard_visibility']
            face_analysis = analysis['face_coverage']
            workspace_analysis = analysis['workspace_compliance']
            overall_compliance = analysis['overall_compliance']
            
            # Determine if position is valid based on AI evaluation
            hands_visible = hand_analysis.get('hands_visible', False)
            keyboard_visible = keyboard_analysis.get('keyboard_visible', False)
            face_coverage_appropriate = face_analysis.get('face_coverage', {}).get('appropriate_coverage', True)
            workspace_compliant = workspace_analysis.get('compliance_score', 0.0) > 0.5
            
            # Overall validation with AI-driven criteria
            self.secondary_position_valid = (
                hands_visible and 
                keyboard_visible and 
                face_coverage_appropriate and 
                workspace_compliant and
                overall_compliance.get('overall_score', 0.0) > 0.6
            )
            
            # Cache the analysis for violation prevention
            self.secondary_analysis_cache = ai_analysis
            
            return {
                'status': 'valid' if self.secondary_position_valid else 'invalid',
                'hands_visible': hands_visible,
                'keyboard_visible': keyboard_visible,
                'face_coverage_appropriate': face_coverage_appropriate,
                'workspace_compliant': workspace_compliant,
                'position_valid': self.secondary_position_valid,
                'ai_analysis': ai_analysis,
                'overall_score': overall_compliance.get('overall_score', 0.0),
                'compliance_status': overall_compliance.get('status', 'unknown'),
                'recommendations': ai_analysis.get('recommendations', []),
                'violation_prevention': ai_analysis.get('violation_prevention', {}),
                'guidance': self._get_ai_guided_secondary_guidance(ai_analysis)
            }
        except Exception as e:
            print(f"[ERROR] Secondary camera validation failed: {str(e)}")
            return {
                'status': 'error',
                'error': str(e),
                'position_valid': False,
                'guidance': "Error processing camera feed. Please check your camera."
            }
    
    def _detect_hands_and_keyboard(self, frame: np.ndarray) -> Tuple[bool, bool]:
        """
        Detects hands and keyboard in the frame.
        This is a simplified implementation that uses color and edge detection.
        In a production system, this would use a trained object detection model.
        """
        if frame is None:
            return False, False
        
        # For demonstration, we'll use a simple heuristic
        # In a real implementation, this would use a trained model
        
        # Convert to grayscale for edge detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Edge detection for keyboard (keyboards have many edges)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / (frame.shape[0] * frame.shape[1])
        
        # Color detection for skin tones (simplified)
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        lower_skin = np.array([0, 20, 70], dtype=np.uint8)
        upper_skin = np.array([20, 255, 255], dtype=np.uint8)
        skin_mask = cv2.inRange(hsv, lower_skin, upper_skin)
        skin_density = np.sum(skin_mask > 0) / (frame.shape[0] * frame.shape[1])
        
        # Determine if hands and keyboard are visible based on thresholds
        # These thresholds would be tuned based on real data
        keyboard_visible = edge_density > 0.1
        hands_visible = skin_density > 0.05
        
        print(f"[DEBUG] Edge density: {edge_density}, Skin density: {skin_density}")
        print(f"[DEBUG] Keyboard visible: {keyboard_visible}, Hands visible: {hands_visible}")
        
        return hands_visible, keyboard_visible
    
    def _validate_camera_angle(self, frame: np.ndarray) -> bool:
        """
        Validates if the camera angle is appropriate for monitoring.
        The camera should be positioned to show the desk surface and hands.
        """
        if frame is None:
            return False
        
        # For demonstration, we'll use a simple heuristic
        # In a real implementation, this would use more sophisticated analysis
        
        # Check if the frame has reasonable brightness and contrast
        brightness = np.mean(frame)
        contrast = np.std(frame)
        
        # Check if the frame has a good view (not too close, not too far)
        # This is a simplified check - in reality, we'd use more sophisticated analysis
        height, width = frame.shape[:2]
        aspect_ratio = width / height
        
        print(f"[DEBUG] Brightness: {brightness}, Contrast: {contrast}, Aspect ratio: {aspect_ratio}")
        
        # Simple thresholds for demonstration
        return (brightness > 30 and brightness < 220 and 
                contrast > 20 and 
                aspect_ratio > 1.2 and aspect_ratio < 2.0)
    
    def _get_primary_guidance(self, face_result: Dict) -> str:
        """Provides guidance for primary camera positioning"""
        if not face_result.get('faces_detected', 0):
            return "No face detected. Please position your face in the center of the frame."
        
        if face_result.get('faces_detected', 0) > 1:
            return "Multiple faces detected. Only your face should be visible."
        
        for violation in face_result.get('violations', []):
            if violation.get('type') == 'gaze_violation':
                return "Please look directly at the camera."
            if violation.get('type') == 'movement':
                return "Please keep your face steady."
        
        return "Face position looks good."
    
    def _get_secondary_guidance(self, hands_visible: bool, keyboard_visible: bool, angle_appropriate: bool) -> str:
        """Provides guidance for secondary camera positioning"""
        if not angle_appropriate:
            return "Please adjust the camera angle to show your desk surface clearly."
        
        if not keyboard_visible:
            return "Keyboard not visible. Please ensure your keyboard is in the frame."
        
        if not hands_visible:
            return "Hands not visible. Please ensure your hands are in the frame when typing."
        
        return "Secondary camera position looks good."
    
    def _get_ai_guided_secondary_guidance(self, ai_analysis: Dict) -> str:
        """Generate guidance based on AI analysis results"""
        if ai_analysis.get('status') == 'error':
            return "Error analyzing secondary camera feed. Please check your camera."
        
        recommendations = ai_analysis.get('recommendations', [])
        if recommendations:
            return recommendations[0]  # Return the most important recommendation
        
        overall_compliance = ai_analysis.get('analysis', {}).get('overall_compliance', {})
        status = overall_compliance.get('status', 'unknown')
        
        if status == 'excellent':
            return "Secondary camera setup is excellent for violation prevention."
        elif status == 'good':
            return "Secondary camera setup is good. Minor adjustments may improve monitoring."
        elif status == 'acceptable':
            return "Secondary camera setup is acceptable but could be improved."
        else:
            return "Secondary camera setup needs improvement for effective monitoring."
    
    def _calculate_dual_camera_score(self, primary_result: Dict, secondary_result: Optional[Dict]) -> float:
        """Calculate overall dual camera setup score"""
        primary_score = 1.0 if primary_result.get('position_valid', False) else 0.0
        
        if secondary_result is None:
            return primary_score * 0.7  # Reduced score without secondary camera
        
        secondary_score = secondary_result.get('overall_score', 0.0)
        
        # Weighted combination: primary camera is more critical
        return (primary_score * 0.6) + (secondary_score * 0.4)
    
    def _assess_monitoring_effectiveness(self, primary_result: Dict, secondary_result: Optional[Dict]) -> Dict:
        """Assess overall monitoring effectiveness"""
        effectiveness = {
            'primary_camera_effectiveness': 'high' if primary_result.get('position_valid', False) else 'low',
            'secondary_camera_effectiveness': 'none',
            'violation_detection_capability': 'medium',
            'overall_effectiveness': 'medium'
        }
        
        if secondary_result:
            ai_analysis = secondary_result.get('ai_analysis', {})
            violation_prevention = ai_analysis.get('violation_prevention', {})
            
            # Assess secondary camera effectiveness
            if secondary_result.get('position_valid', False):
                effectiveness['secondary_camera_effectiveness'] = 'high'
                effectiveness['violation_detection_capability'] = 'high'
            else:
                effectiveness['secondary_camera_effectiveness'] = 'low'
            
            # Overall effectiveness based on both cameras
            primary_valid = primary_result.get('position_valid', False)
            secondary_valid = secondary_result.get('position_valid', False)
            
            if primary_valid and secondary_valid:
                effectiveness['overall_effectiveness'] = 'high'
            elif primary_valid or secondary_valid:
                effectiveness['overall_effectiveness'] = 'medium'
            else:
                effectiveness['overall_effectiveness'] = 'low'
        
        return effectiveness
    
    def get_violation_prevention_status(self) -> Dict:
        """Get current violation prevention status based on cached analysis"""
        if not self.secondary_analysis_cache:
            return {
                'status': 'inactive',
                'reason': 'No secondary camera analysis available',
                'effectiveness': 0.0
            }
        
        violation_prevention = self.secondary_analysis_cache.get('violation_prevention', {})
        
        return {
            'status': 'active' if violation_prevention.get('risk_level') in ['low', 'medium'] else 'inactive',
            'risk_level': violation_prevention.get('risk_level', 'unknown'),
            'effectiveness': violation_prevention.get('prevention_effectiveness', 0.0),
            'confidence': violation_prevention.get('confidence', 0.0),
            'last_analysis': self.secondary_analysis_cache.get('analysis', {}).get('timestamp', 0)
        }
    
    def process_dual_camera(self, primary_frame_data: str, secondary_frame_data: Optional[str] = None) -> Dict:
        """
        Processes both primary and secondary camera frames with AI-enhanced analysis.
        If secondary_frame_data is None, only processes the primary camera.
        """
        # Process primary camera
        primary_result = self.validate_primary_camera(primary_frame_data)
        
        # Process secondary camera if provided
        secondary_result = None
        violation_prevention_active = False
        
        if secondary_frame_data:
            secondary_result = self.validate_secondary_camera(secondary_frame_data)
            
            # Check if AI analysis indicates good violation prevention setup
            if secondary_result.get('ai_analysis'):
                violation_prevention = secondary_result['ai_analysis'].get('violation_prevention', {})
                violation_prevention_active = violation_prevention.get('risk_level') in ['low', 'medium']
        
        # Enhanced overall status calculation
        primary_valid = primary_result.get('position_valid', False)
        secondary_valid = secondary_result is None or secondary_result.get('position_valid', False)
        
        overall_status = 'valid' if primary_valid and secondary_valid else 'invalid'
        
        # Add violation prevention assessment
        violation_prevention_status = {
            'active': violation_prevention_active,
            'effectiveness': 'high' if violation_prevention_active else 'low',
            'ai_confidence': secondary_result.get('ai_analysis', {}).get('violation_prevention', {}).get('confidence', 0.0) if secondary_result else 0.0
        }
        
        return {
            'primary_camera': primary_result,
            'secondary_camera': secondary_result,
            'overall_status': overall_status,
            'violation_prevention': violation_prevention_status,
            'dual_camera_score': self._calculate_dual_camera_score(primary_result, secondary_result),
            'monitoring_effectiveness': self._assess_monitoring_effectiveness(primary_result, secondary_result)
        }
    
    def should_suppress_violations(self) -> bool:
        """Determine if violations should be suppressed based on secondary camera analysis"""
        if not self.secondary_analysis_cache:
            print("[VIOLATION_SUPPRESSION] No secondary analysis cache available")
            return False
        
        violation_prevention = self.secondary_analysis_cache.get('violation_prevention', {})
        risk_level = violation_prevention.get('risk_level', 'very_high')
        confidence = violation_prevention.get('confidence', 0.0)
        overall_score = violation_prevention.get('score', 0.0)
        
        print(f"[VIOLATION_SUPPRESSION] Risk: {risk_level}, Confidence: {confidence:.2f}, Score: {overall_score:.2f}")
        
        # Suppress violations if secondary camera indicates low/medium risk with reasonable confidence
        should_suppress = (risk_level in ['low', 'medium']) and confidence >= 0.7
        print(f"[VIOLATION_SUPPRESSION] Should suppress violations: {should_suppress}")
        
        return should_suppress
    
    def get_secondary_camera_violations(self) -> List[Dict]:
        """Get violations detected by secondary camera analysis"""
        if not self.secondary_analysis_cache:
            return []
        
        # Generate violations based on current analysis
        return self.secondary_analyzer.generate_secondary_camera_violations(self.secondary_analysis_cache)
