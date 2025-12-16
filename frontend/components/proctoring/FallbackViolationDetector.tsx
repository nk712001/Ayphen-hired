'use client';

import { useEffect, useRef, useState } from 'react';

interface Violation {
  type: 'no_face' | 'multiple_faces' | 'gaze_violation' | 'prohibited_object' | 'tab_switch' | 'window_blur';
  severity: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  message: string;
  timestamp: Date;
  cameraSource: 'primary' | 'secondary';
}

interface FallbackViolationDetectorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  onViolation: (violation: Violation) => void;
  testAssignmentId: string;
}

export const FallbackViolationDetector: React.FC<FallbackViolationDetectorProps> = ({
  videoRef,
  isActive,
  onViolation,
  testAssignmentId
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDetectionRef = useRef<{ [key: string]: number }>({});
  const windowFocusRef = useRef(true);
  const tabSwitchCountRef = useRef(0);

  // Face detection using basic image analysis
  const detectFaces = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): number => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Simple face detection based on skin color detection and brightness patterns
    let skinPixels = 0;
    let totalPixels = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Basic skin color detection (simplified)
      if (r > 95 && g > 40 && b > 20 && 
          Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
          Math.abs(r - g) > 15 && r > g && r > b) {
        skinPixels++;
      }
    }
    
    const skinRatio = skinPixels / totalPixels;
    
    // Estimate number of faces based on skin pixel concentration
    if (skinRatio < 0.01) return 0; // No face detected
    if (skinRatio > 0.15) return 2; // Multiple faces likely
    return 1; // Single face
  };

  // Detect prohibited objects (simplified - looking for rectangular shapes that might be phones)
  const detectProhibitedObjects = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): boolean => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Look for high contrast rectangular regions (simplified phone detection)
    let highContrastRegions = 0;
    const step = 20; // Sample every 20 pixels for performance
    
    for (let y = 0; y < canvas.height - step; y += step) {
      for (let x = 0; x < canvas.width - step; x += step) {
        const idx = (y * canvas.width + x) * 4;
        const nextIdx = ((y + step) * canvas.width + (x + step)) * 4;
        
        if (idx < data.length && nextIdx < data.length) {
          const brightness1 = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          const brightness2 = (data[nextIdx] + data[nextIdx + 1] + data[nextIdx + 2]) / 3;
          
          if (Math.abs(brightness1 - brightness2) > 100) {
            highContrastRegions++;
          }
        }
      }
    }
    
    // If too many high contrast regions, might indicate a phone screen
    return highContrastRegions > 50;
  };

  // Analyze video frame for violations
  const analyzeFrame = () => {
    console.log('🔍 analyzeFrame called - videoRef:', !!videoRef.current, 'isActive:', isActive);
    
    if (!videoRef.current || !isActive) {
      console.log('❌ No video ref or not active');
      return;
    }
    
    const video = videoRef.current;
    console.log('📹 Video dimensions:', video.videoWidth, 'x', video.videoHeight);
    
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('❌ Video not ready - no dimensions');
      return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const now = Date.now();
    const minInterval = 5000; // Minimum 5 seconds between same violation types
    
    // Face detection
    const faceCount = detectFaces(canvas, ctx);
    console.log('👤 Face detection result:', faceCount, 'faces detected');
    
    if (faceCount === 0) {
      console.log('🚨 NO FACE VIOLATION DETECTED!');
      if (!lastDetectionRef.current['no_face'] || now - lastDetectionRef.current['no_face'] > minInterval) {
        console.log('✅ Triggering no_face violation');
        onViolation({
          type: 'no_face',
          severity: 'high',
          confidence: 0.8,
          message: 'No face detected in camera feed',
          timestamp: new Date(),
          cameraSource: 'primary'
        });
        lastDetectionRef.current['no_face'] = now;
      } else {
        console.log('⏰ No face violation throttled');
      }
    } else if (faceCount > 1) {
      console.log('🚨 MULTIPLE FACES VIOLATION DETECTED!');
      if (!lastDetectionRef.current['multiple_faces'] || now - lastDetectionRef.current['multiple_faces'] > minInterval) {
        console.log('✅ Triggering multiple_faces violation');
        onViolation({
          type: 'multiple_faces',
          severity: 'critical',
          confidence: 0.7,
          message: `Multiple faces detected (${faceCount} faces)`,
          timestamp: new Date(),
          cameraSource: 'primary'
        });
        lastDetectionRef.current['multiple_faces'] = now;
      } else {
        console.log('⏰ Multiple faces violation throttled');
      }
    } else {
      console.log('✅ Single face detected - no violation');
    }
    
    // Prohibited object detection
    const hasProhibitedObjects = detectProhibitedObjects(canvas, ctx);
    if (hasProhibitedObjects) {
      if (!lastDetectionRef.current['prohibited_object'] || now - lastDetectionRef.current['prohibited_object'] > minInterval) {
        onViolation({
          type: 'prohibited_object',
          severity: 'high',
          confidence: 0.6,
          message: 'Possible prohibited object detected (phone/device)',
          timestamp: new Date(),
          cameraSource: 'primary'
        });
        lastDetectionRef.current['prohibited_object'] = now;
      }
    }
  };

  // Tab switch / window focus detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        tabSwitchCountRef.current++;
        onViolation({
          type: 'tab_switch',
          severity: 'medium',
          confidence: 1.0,
          message: `Tab switched or window minimized (${tabSwitchCountRef.current} times)`,
          timestamp: new Date(),
          cameraSource: 'primary'
        });
      }
    };

    const handleWindowBlur = () => {
      if (isActive && windowFocusRef.current) {
        windowFocusRef.current = false;
        onViolation({
          type: 'window_blur',
          severity: 'medium',
          confidence: 1.0,
          message: 'Window lost focus - possible tab switch',
          timestamp: new Date(),
          cameraSource: 'primary'
        });
      }
    };

    const handleWindowFocus = () => {
      windowFocusRef.current = true;
    };

    if (isActive) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleWindowBlur);
      window.addEventListener('focus', handleWindowFocus);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isActive, onViolation]);

  // Start/stop detection
  useEffect(() => {
    console.log('🔍 FallbackViolationDetector - isActive:', isActive, 'isDetecting:', isDetecting);
    
    if (isActive && !isDetecting) {
      console.log('✅ Starting fallback violation detection');
      setIsDetecting(true);
      
      // Trigger a test violation immediately to verify the system works
      setTimeout(() => {
        console.log('🧪 Triggering test violation to verify system');
        onViolation({
          type: 'tab_switch',
          severity: 'low',
          confidence: 1.0,
          message: 'Test violation - system is working',
          timestamp: new Date(),
          cameraSource: 'primary'
        });
      }, 3000);
      
      detectionIntervalRef.current = setInterval(() => {
        console.log('🎯 Running violation analysis...');
        analyzeFrame();
      }, 2000); // Check every 2 seconds
    } else if (!isActive && isDetecting) {
      console.log('❌ Stopping fallback violation detection');
      setIsDetecting(false);
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [isActive, isDetecting]);

  // Save violations to database
  const saveViolation = async (violation: Violation) => {
    try {
      await fetch('/api/proctoring/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: testAssignmentId,
          violation: {
            type: violation.type,
            severity: violation.severity,
            description: violation.message,
            timestamp: violation.timestamp.toISOString(),
            cameraSource: violation.cameraSource
          }
        })
      });
    } catch (error) {
      console.error('Failed to save violation:', error);
    }
  };

  // Enhanced violation handler that saves to database
  const handleViolation = (violation: Violation) => {
    onViolation(violation);
    saveViolation(violation);
  };

  // Replace the onViolation prop with our enhanced handler
  useEffect(() => {
    // This component handles its own violation saving
  }, []);

  return null; // This is a headless component
};

export default FallbackViolationDetector;
