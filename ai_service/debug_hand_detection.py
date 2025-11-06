#!/usr/bin/env python3
"""
Debug hand detection in secondary camera analyzer
"""
import sys
import os
import numpy as np
import cv2
import base64

# Add the modules directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'modules'))

# Import dependencies first
from face_detection import FaceDetector
from object_detection import ObjectDetector

# Now import the module to test
from secondary_camera_analyzer import SecondaryCameraAnalyzer

def create_realistic_skin_hands():
    """Create a frame with realistic skin-colored hands"""
    frame = np.full((480, 640, 3), 90, dtype=np.uint8)  # Gray background
    
    # Add desk surface
    cv2.rectangle(frame, (0, 400), (640, 480), (120, 100, 80), -1)
    
    # Create realistic skin colors in BGR
    # Light skin tone
    light_skin = (180, 150, 120)  # BGR format
    # Medium skin tone  
    medium_skin = (140, 120, 100)
    
    # Add hands with realistic skin colors and shapes
    # Left hand
    cv2.ellipse(frame, (250, 380), (35, 50), 0, 0, 360, light_skin, -1)
    # Add fingers for left hand
    cv2.ellipse(frame, (235, 350), (8, 20), 0, 0, 360, light_skin, -1)  # Thumb
    cv2.ellipse(frame, (245, 340), (6, 25), 0, 0, 360, light_skin, -1)  # Index
    cv2.ellipse(frame, (255, 335), (6, 28), 0, 0, 360, light_skin, -1)  # Middle
    cv2.ellipse(frame, (265, 340), (6, 25), 0, 0, 360, light_skin, -1)  # Ring
    cv2.ellipse(frame, (275, 345), (5, 20), 0, 0, 360, light_skin, -1)  # Pinky
    
    # Right hand
    cv2.ellipse(frame, (450, 385), (35, 50), 0, 0, 360, medium_skin, -1)
    # Add fingers for right hand
    cv2.ellipse(frame, (465, 355), (8, 20), 0, 0, 360, medium_skin, -1)  # Thumb
    cv2.ellipse(frame, (455, 345), (6, 25), 0, 0, 360, medium_skin, -1)  # Index
    cv2.ellipse(frame, (445, 340), (6, 28), 0, 0, 360, medium_skin, -1)  # Middle
    cv2.ellipse(frame, (435, 345), (6, 25), 0, 0, 360, medium_skin, -1)  # Ring
    cv2.ellipse(frame, (425, 350), (5, 20), 0, 0, 360, medium_skin, -1)  # Pinky
    
    # Add keyboard
    cv2.rectangle(frame, (200, 420), (500, 460), (60, 60, 60), -1)
    
    return frame

def debug_hand_detection():
    """Debug the hand detection process step by step"""
    print("Debugging hand detection process...")
    
    analyzer = SecondaryCameraAnalyzer()
    frame = create_realistic_skin_hands()
    
    # Save the original frame for reference
    cv2.imwrite('debug_original_frame.jpg', frame)
    print("Saved original frame as debug_original_frame.jpg")
    
    # Convert to HSV
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    cv2.imwrite('debug_hsv_frame.jpg', hsv)
    print("Saved HSV frame as debug_hsv_frame.jpg")
    
    # Test skin detection ranges
    skin_ranges = [
        # Light skin tones
        (np.array([0, 20, 70]), np.array([20, 255, 255])),
        # Medium skin tones  
        (np.array([0, 25, 80]), np.array([17, 255, 255])),
        # Darker skin tones
        (np.array([0, 30, 60]), np.array([15, 255, 200]))
    ]
    
    combined_mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
    for i, (lower, upper) in enumerate(skin_ranges):
        mask = cv2.inRange(hsv, lower, upper)
        cv2.imwrite(f'debug_skin_mask_{i}.jpg', mask)
        print(f"Skin mask {i}: {np.sum(mask > 0)} pixels detected")
        combined_mask = cv2.bitwise_or(combined_mask, mask)
    
    cv2.imwrite('debug_combined_mask.jpg', combined_mask)
    print(f"Combined mask: {np.sum(combined_mask > 0)} pixels detected")
    
    # Apply morphological operations
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    cleaned_mask = cv2.morphologyEx(combined_mask, cv2.MORPH_OPEN, kernel)
    cleaned_mask = cv2.morphologyEx(cleaned_mask, cv2.MORPH_CLOSE, kernel)
    cv2.imwrite('debug_cleaned_mask.jpg', cleaned_mask)
    print(f"Cleaned mask: {np.sum(cleaned_mask > 0)} pixels detected")
    
    # Find contours
    contours, _ = cv2.findContours(cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    print(f"Found {len(contours)} contours")
    
    # Draw contours on original frame
    contour_frame = frame.copy()
    cv2.drawContours(contour_frame, contours, -1, (0, 255, 0), 2)
    cv2.imwrite('debug_contours.jpg', contour_frame)
    
    # Analyze contours
    min_area = frame.shape[0] * frame.shape[1] * 0.005
    max_area = frame.shape[0] * frame.shape[1] * 0.3
    print(f"Area thresholds: min={min_area:.1f}, max={max_area:.1f}")
    
    valid_contours = []
    for i, contour in enumerate(contours):
        area = cv2.contourArea(contour)
        print(f"Contour {i}: area={area:.1f}")
        
        if min_area < area < max_area:
            # Check convexity defects
            hull = cv2.convexHull(contour, returnPoints=False)
            if len(hull) > 3:  # Need at least 4 points for convexity defects
                try:
                    defects = cv2.convexityDefects(contour, hull)
                    defect_count = len(defects) if defects is not None else 0
                    print(f"  Convexity defects: {defect_count}")
                    
                    if defect_count >= 2:
                        valid_contours.append(contour)
                        print(f"  ✓ Valid hand contour")
                    else:
                        print(f"  ✗ Not enough defects for hand")
                except:
                    print(f"  ✗ Error calculating convexity defects")
            else:
                print(f"  ✗ Hull too small")
        else:
            print(f"  ✗ Area outside valid range")
    
    print(f"\nValid hand contours: {len(valid_contours)}")
    
    # Draw valid contours
    valid_contour_frame = frame.copy()
    cv2.drawContours(valid_contour_frame, valid_contours, -1, (0, 0, 255), 3)
    cv2.imwrite('debug_valid_contours.jpg', valid_contour_frame)
    
    # Run full analysis
    print("\nRunning full analysis...")
    encoded = base64.b64encode(cv2.imencode('.jpg', frame)[1]).decode('utf-8')
    result = analyzer.analyze_secondary_camera_frame(encoded)
    
    hand_analysis = result['analysis']['hand_placement']
    print(f"Hands detected: {hand_analysis['hands_detected']}")
    print(f"Hands visible: {hand_analysis['hands_visible']}")
    print(f"Confidence: {hand_analysis['confidence']:.3f}")
    print(f"Total hand area: {hand_analysis['total_hand_area']:.6f}")
    
    return len(valid_contours) > 0

def test_different_skin_tones():
    """Test detection with different skin tones"""
    print("\nTesting different skin tones...")
    
    analyzer = SecondaryCameraAnalyzer()
    
    # Test various skin colors
    skin_colors = [
        ("Light", (200, 170, 140)),  # Very light skin
        ("Medium", (160, 130, 110)), # Medium skin  
        ("Tan", (140, 110, 90)),     # Tan skin
        ("Dark", (120, 90, 70)),     # Dark skin
    ]
    
    for name, color in skin_colors:
        print(f"\nTesting {name} skin tone: {color}")
        
        frame = np.full((480, 640, 3), 90, dtype=np.uint8)
        
        # Add simple hand shape
        cv2.ellipse(frame, (300, 350), (40, 60), 0, 0, 360, color, -1)
        
        # Run analysis
        encoded = base64.b64encode(cv2.imencode('.jpg', frame)[1]).decode('utf-8')
        result = analyzer.analyze_secondary_camera_frame(encoded)
        
        hand_analysis = result['analysis']['hand_placement']
        print(f"  Detected: {hand_analysis['hands_detected']} hands")
        print(f"  Confidence: {hand_analysis['confidence']:.3f}")

if __name__ == '__main__':
    print("="*60)
    print("HAND DETECTION DEBUG")
    print("="*60)
    
    success = debug_hand_detection()
    test_different_skin_tones()
    
    if success:
        print("\n✓ Hand detection debugging completed successfully")
    else:
        print("\n✗ Hand detection issues found")
