#!/usr/bin/env python3
"""
Analyze skin colors to understand HSV ranges
"""
import numpy as np
import cv2

def bgr_to_hsv_analysis():
    """Analyze typical skin colors in HSV space"""
    
    # Typical skin colors in BGR format
    skin_colors = [
        ("Very Light", (220, 190, 160)),
        ("Light", (200, 170, 140)),
        ("Medium Light", (180, 150, 120)),
        ("Medium", (160, 130, 110)),
        ("Medium Dark", (140, 110, 90)),
        ("Dark", (120, 90, 70)),
        ("Very Dark", (100, 70, 50)),
    ]
    
    print("Skin Color Analysis (BGR -> HSV):")
    print("="*60)
    
    for name, bgr_color in skin_colors:
        # Create a small image with this color
        img = np.full((10, 10, 3), bgr_color, dtype=np.uint8)
        hsv_img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        hsv_color = hsv_img[0, 0]  # Get HSV values
        
        print(f"{name:12} BGR{bgr_color} -> HSV({hsv_color[0]:3d}, {hsv_color[1]:3d}, {hsv_color[2]:3d})")
    
    print("\nRecommended HSV ranges for skin detection:")
    print("Hue: 0-25 (covers orange to red-orange)")
    print("Saturation: 30-255 (avoid very desaturated colors)")
    print("Value: 50-255 (avoid very dark colors)")

def test_improved_skin_detection():
    """Test improved skin detection ranges"""
    
    # Create a test frame with various skin tones
    frame = np.full((480, 640, 3), 80, dtype=np.uint8)  # Background
    
    # Add hands with different skin tones
    cv2.ellipse(frame, (200, 350), (40, 60), 0, 0, 360, (200, 170, 140), -1)  # Light skin
    cv2.ellipse(frame, (400, 350), (40, 60), 0, 0, 360, (140, 110, 90), -1)   # Medium skin
    
    # Add some texture/variation to avoid low variance detection
    noise = np.random.randint(-10, 10, frame.shape, dtype=np.int16)
    frame = np.clip(frame.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    
    # Convert to HSV
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    
    # Improved skin detection ranges
    improved_ranges = [
        (np.array([0, 30, 50]), np.array([25, 255, 255])),   # Main skin range
        (np.array([160, 30, 50]), np.array([180, 255, 255])) # Wrap-around for red hues
    ]
    
    combined_mask = np.zeros(hsv.shape[:2], dtype=np.uint8)
    for i, (lower, upper) in enumerate(improved_ranges):
        mask = cv2.inRange(hsv, lower, upper)
        print(f"Improved mask {i}: {np.sum(mask > 0)} pixels detected")
        combined_mask = cv2.bitwise_or(combined_mask, mask)
    
    print(f"Combined improved mask: {np.sum(combined_mask > 0)} pixels detected")
    
    # Save debug images
    cv2.imwrite('skin_test_original.jpg', frame)
    cv2.imwrite('skin_test_mask.jpg', combined_mask)
    
    return np.sum(combined_mask > 0) > 1000  # Should detect significant skin area

if __name__ == '__main__':
    bgr_to_hsv_analysis()
    print("\n" + "="*60)
    success = test_improved_skin_detection()
    print(f"\nImproved skin detection test: {'✓ PASSED' if success else '✗ FAILED'}")
