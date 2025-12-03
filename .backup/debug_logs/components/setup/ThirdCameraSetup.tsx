import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Camera, Check, RefreshCw } from 'lucide-react';
import SimpleQRCode from '@/components/ui/simple-qr-code';
import { v4 as uuidv4 } from 'uuid';
import { fetchWithRetry } from '@/lib/utils';
import SecureQRCodeInstructions from '@/components/auth/SecureQRCodeInstructions';

interface ThirdCameraSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
  isRequired?: boolean;
}

// --- Constants ---
const CAMERA_INIT_FALLBACK_MS = 10000; // 10 seconds
const MOBILE_POLL_INTERVAL_MS = 1000; // Check for mobile connection every 1 second for faster response
const PLACEHOLDER_FRAME = 'iVBORw0KGgoAAAANSUhEUgAAAUAAAADwCAYAAABxLb1rAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TpSIVBTuIOGSoThZERRy1CkWoEGqFVh1MbvqhNGlIUlwcBdeCgx+LVQcXZ10dXAVB8APE0clJ0UVK';

// Declare a type for the intervals object
declare global {
  interface Window {
    mobileIntervals?: Record<string, {
      updateInterval: NodeJS.Timeout;
      heartbeatInterval: NodeJS.Timeout;
    }>;
    primaryAnalysisInterval?: NodeJS.Timeout;
  }
}

enum SetupStep {
  INIT = 'init',
  PRIMARY_CAMERA = 'primary_camera',
  SHOW_QR = 'show_qr',
  MOBILE_CONNECTED = 'mobile_connected',
  VALIDATE = 'validate',
  COMPLETE = 'complete',
}

const ThirdCameraSetup: React.FC<ThirdCameraSetupProps> = ({
  onComplete,
  onSkip,
  isRequired = false,
}) => {
  // --- Refs ---
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement>(null);
  const mobileCanvasRef = useRef<HTMLCanvasElement>(null);
  const primaryPeerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const primarySignalingRef = useRef<WebSocket | null>(null);
  const isMountedRef = useRef(true);
  const initFallbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- State ---
  const [setupStep, setSetupStep] = useState<SetupStep>(SetupStep.INIT);
  const [error, setError] = useState<string>('');
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [networkIp, setNetworkIp] = useState<string>('');
  // Generate a stable session ID and store it in state and localStorage for persistence
  const [mobileSessionId] = useState<string>(() => {
    // Try to get existing session ID from localStorage
    const existingId = typeof window !== 'undefined' ? localStorage.getItem('mobileSessionId') : null;
    if (existingId) {
      console.log('Using existing mobile session ID from localStorage:', existingId);
      return existingId;
    }
    
    // Generate a new session ID
    const newId = uuidv4();
    console.log('Generated new mobile session ID:', newId);
    
    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobileSessionId', newId);
    }
    
    return newId;
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [isCheckingMobileConnection, setIsCheckingMobileConnection] = useState(false);
  const [isMobileConnected, setIsMobileConnected] = useState(false);
  const [secondaryStream, setSecondaryStream] = useState<MediaStream | null>(null);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [aiAnalysisResults, setAiAnalysisResults] = useState<any>(null);
  const [primaryAnalysisResults, setPrimaryAnalysisResults] = useState<any>(null);
  const [violationPreventionActive, setViolationPreventionActive] = useState<boolean>(false);
  const [primaryViolationPreventionActive, setPrimaryViolationPreventionActive] = useState<boolean>(false);
  const [analysisRecommendations, setAnalysisRecommendations] = useState<string[]>([]);
  const [primaryAnalysisRecommendations, setPrimaryAnalysisRecommendations] = useState<string[]>([]);
  const [secondaryCameraViolations, setSecondaryCameraViolations] = useState<any[]>([]);
  const [primaryCameraViolations, setPrimaryCameraViolations] = useState<any[]>([]);
  const [showUnifiedViolationOverlay, setShowUnifiedViolationOverlay] = useState<boolean>(false);
  const [overlayDismissedAt, setOverlayDismissedAt] = useState<number | null>(null);
  const [analysisInProgress, setAnalysisInProgress] = useState<boolean>(false);
  const [primaryAnalysisInProgress, setPrimaryAnalysisInProgress] = useState<boolean>(false);

  // --- Functions ---

  // Validate secondary camera to activate it in the AI service
  const validateSecondaryCamera = async (frameData: string) => {
    try {
      console.log('[VALIDATION] Starting secondary camera validation for session:', mobileSessionId);
      
      const response = await fetch('/api/setup/secondary-camera-validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: mobileSessionId,
          frameData: frameData
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('[VALIDATION] Validation result:', result);
        if (result.position_valid) {
          console.log('[VALIDATION] ✅ Secondary camera activated successfully');
        } else {
          console.log('[VALIDATION] ⚠️ Secondary camera validation failed');
        }
        return result;
      } else {
        console.error('[VALIDATION] Validation request failed:', response.status);
      }
    } catch (error) {
      console.error('[VALIDATION] Validation error:', error);
    }
    return null;
  };

  // Primary camera AI analysis function
  const analyzePrimaryCameraWithAI = async (frameData: string): Promise<any> => {
    // Skip if analysis is already in progress
    if (primaryAnalysisInProgress) {
      console.log('[PRIMARY_AI_ANALYSIS] Skipping analysis - already in progress');
      return null;
    }
    
    try {
      setPrimaryAnalysisInProgress(true);
      console.log('[PRIMARY_AI_ANALYSIS] Starting WebSocket-based analysis for session:', mobileSessionId);
      console.log('[PRIMARY_AI_ANALYSIS] Frame data length:', frameData ? frameData.length : 0);
      
      // Use the same WebSocket approach as the proctoring demo
      // Create a temporary ProctorClient-like connection for analysis
      const wsUrl = `wss://127.0.0.1:8000/ws/proctor/${mobileSessionId}`;
      console.log('[PRIMARY_AI_ANALYSIS] Connecting to WebSocket:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket analysis timeout'));
        }, 10000); // 10 second timeout
        
        ws.onopen = () => {
          console.log('[PRIMARY_AI_ANALYSIS] WebSocket connected, sending frame');
          // Send video frame for analysis
          ws.send(JSON.stringify({
            type: 'video',
            data: frameData
          }));
        };
        
        ws.onmessage = (event) => {
          try {
            const result = JSON.parse(event.data);
            console.log('[PRIMARY_AI_ANALYSIS] WebSocket response:', result);
            
            if (result.metrics) {
              // Use actual violations from the backend instead of creating simplified ones
              const actualViolations = result.violations || [];
              const activeViolations = result.active_violations || actualViolations.filter((v: any) => !v.suppressed);
              
              console.log('[PRIMARY_AI_ANALYSIS] Actual violations from backend:', actualViolations);
              console.log('[PRIMARY_AI_ANALYSIS] Active violations:', activeViolations);
              
              // Use actual face count from backend metrics
              const facesDetected = result.metrics.faces_detected || 0;
              console.log('[PRIMARY_AI_ANALYSIS] Faces detected from backend:', facesDetected);
              
              const hasProhibitedItems = (result.metrics.objects_detected || 0) > 0;
              const hasFace = result.metrics.face_confidence > 0.5;
              
              // Calculate overall score considering violations
              let overallScore = result.metrics.face_confidence || 0.0;
              if (activeViolations.length > 0) {
                // Reduce score based on violation severity
                const criticalViolations = activeViolations.filter((v: any) => v.severity === 'critical').length;
                const highViolations = activeViolations.filter((v: any) => v.severity === 'high').length;
                const mediumViolations = activeViolations.filter((v: any) => v.severity === 'medium').length;
                
                overallScore = Math.max(0, overallScore - (criticalViolations * 0.8) - (highViolations * 0.5) - (mediumViolations * 0.3));
              }
              
              const analysis = {
                overall_compliance: {
                  status: activeViolations.length === 0 ? 'compliant' : 'non_compliant',
                  faces_detected: facesDetected,
                  prohibited_items: result.metrics.objects_detected || 0,
                  gaze_score: result.metrics.gaze_score || 0.0,
                  overall_score: overallScore
                },
                violation_prevention: {
                  risk_level: activeViolations.length > 0 ? 'high' : (result.metrics.face_confidence > 0.7 ? 'low' : 'medium'),
                  prevention_effectiveness: activeViolations.length === 0 && hasFace,
                  confidence: result.metrics.face_confidence || 0.0
                },
                violations: actualViolations,
                active_violations: activeViolations
              };
              
              console.log('[PRIMARY_AI_ANALYSIS] Converted analysis:', analysis);
              setPrimaryAnalysisResults(analysis);
              
              // Update primary camera violations using active violations
              if (activeViolations && activeViolations.length > 0) {
                console.log('[PRIMARY_AI_ANALYSIS] Primary camera active violations detected:', activeViolations);
                setPrimaryCameraViolations(activeViolations);
                setShowUnifiedViolationOverlay(true);
              } else {
                setPrimaryCameraViolations([]);
                // Only hide overlay if secondary camera also has no violations
                if (secondaryCameraViolations.length === 0) {
                  setShowUnifiedViolationOverlay(false);
                }
              }
              
              // Update violation prevention status
              const violationPrevention = analysis.violation_prevention;
              if (violationPrevention) {
                setPrimaryViolationPreventionActive(
                  violationPrevention.risk_level === 'low' && 
                  violationPrevention.confidence > 0.7
                );
                console.log('[PRIMARY_AI_ANALYSIS] Violation prevention active:', 
                  violationPrevention.risk_level === 'low' && violationPrevention.confidence > 0.7
                );
              }
              
              clearTimeout(timeout);
              ws.close();
              resolve(analysis);
            }
          } catch (error) {
            console.error('[PRIMARY_AI_ANALYSIS] Error parsing WebSocket response:', error);
            clearTimeout(timeout);
            ws.close();
            reject(error);
          }
        };
        
        ws.onerror = (error) => {
          console.error('[PRIMARY_AI_ANALYSIS] WebSocket error:', error);
          clearTimeout(timeout);
          reject(error);
        };
        
        ws.onclose = (event) => {
          console.log('[PRIMARY_AI_ANALYSIS] WebSocket closed:', event.code, event.reason);
          clearTimeout(timeout);
          if (event.code !== 1000) { // Not a normal closure
            reject(new Error(`WebSocket closed with code ${event.code}: ${event.reason}`));
          }
        };
      });
      
    } catch (error) {
      console.error('[PRIMARY_AI_ANALYSIS] Failed to analyze frame:', error);
      return null;
    } finally {
      setPrimaryAnalysisInProgress(false);
    }
  };

  // Secondary camera AI analysis function
  const analyzeFrameWithAI = async (frameData: string) => {
    // Skip if analysis is already in progress
    if (analysisInProgress) {
      console.log('[AI_ANALYSIS] Skipping analysis - already in progress');
      return;
    }
    
    try {
      setAnalysisInProgress(true);
      console.log('[AI_ANALYSIS] Starting analysis for session:', mobileSessionId);
      console.log('[AI_ANALYSIS] Frame data length:', frameData ? frameData.length : 0);
      
      const response = await fetch('/api/setup/secondary-camera-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: mobileSessionId,
          frameData: frameData
        })
      });
      
      console.log('[AI_ANALYSIS] Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('[AI_ANALYSIS] Raw response:', result);
        if (result.success && result.analysis) {
          console.log('[AI_ANALYSIS] Secondary camera analysis result:', result.analysis);
          console.log('[AI_ANALYSIS] Using fallback data:', result.fallback ? 'YES' : 'NO');
          if (result.fallback) {
            console.log('[AI_ANALYSIS] Fallback reason:', result.fallback_reason);
          }
          setAiAnalysisResults(result.analysis);
          
          // Update violation prevention status
          const violationPrevention = result.analysis.violation_prevention;
          if (violationPrevention) {
            const isActive = violationPrevention.risk_level === 'low' || violationPrevention.risk_level === 'medium';
            setViolationPreventionActive(isActive);
          }
          
          // Check for secondary camera violations
          console.log('[VIOLATION_DEBUG] Full analysis result:', result.analysis);
          console.log('[VIOLATION_DEBUG] Analysis result keys:', Object.keys(result.analysis || {}));
          console.log('[VIOLATION_DEBUG] Analysis result JSON:', JSON.stringify(result.analysis, null, 2));
          // Fix: Access the nested analysis structure correctly
          const analysisData = result.analysis.analysis || result.analysis;
          const handAnalysis = analysisData.hand_placement;
          const keyboardAnalysis = analysisData.keyboard_visibility;
          console.log('[VIOLATION_DEBUG] Hand analysis:', handAnalysis);
          console.log('[VIOLATION_DEBUG] Keyboard analysis:', keyboardAnalysis);
          console.log('[VIOLATION_DEBUG] Hands visible:', handAnalysis?.hands_visible);
          console.log('[VIOLATION_DEBUG] Keyboard visible:', keyboardAnalysis?.keyboard_visible);
          console.log('[VIOLATION_DEBUG] Hand analysis quality:', handAnalysis?.analysis_quality);
          console.log('[VIOLATION_DEBUG] Keyboard analysis quality:', keyboardAnalysis?.analysis_quality);
          console.log('[VIOLATION_DEBUG] Hands detected count:', handAnalysis?.hands_detected);
          console.log('[VIOLATION_DEBUG] Hand confidence:', handAnalysis?.confidence);
          
          const violations = [];
          
          // Check if analysis failed or returned error
          if (analysisData.status === 'error') {
            if (analysisData.error === 'Secondary camera not active' || 
                analysisData.message === 'Session not found') {
              console.log('[VIOLATION_DEBUG] AI service session issue - skipping violations:', analysisData.message || analysisData.error);
              // Don't create violations for AI service session issues
              // This will be fixed once the session is properly established
            } else {
              console.log('[VIOLATION_DEBUG] Analysis failed, treating as black screen');
              violations.push({
                type: 'analysis_failed',
                message: 'Unable to analyze secondary camera feed - please check camera positioning'
              });
            }
          } else if (handAnalysis?.analysis_quality === 'black_screen' || 
                   keyboardAnalysis?.analysis_quality === 'black_screen' ||
                   result.analysis.overall_compliance?.status === 'black_screen') {
            console.log('[VIOLATION_DEBUG] Black screen detected by AI analysis');
            violations.push({
              type: 'black_screen_detected',
              message: 'Secondary camera is showing a black screen - please check camera positioning and lighting'
            });
          } else {
            // Normal violation checks - Real AI detection
            console.log('[VIOLATION_DEBUG] Running real AI violation detection');
            
            if (!handAnalysis?.hands_visible) {
              console.log('[VIOLATION_DEBUG] Hands not visible violation detected');
              violations.push({
                type: 'hands_not_visible',
                message: 'Hands not visible in secondary camera view'
              });
            } else {
              console.log('[VIOLATION_DEBUG] ✅ Hands are visible - no violation');
            }
            
            if (!keyboardAnalysis?.keyboard_visible) {
              console.log('[VIOLATION_DEBUG] Keyboard not visible violation detected');
              violations.push({
                type: 'keyboard_not_visible', 
                message: 'Keyboard not visible in secondary camera view'
              });
            } else {
              console.log('[VIOLATION_DEBUG] ✅ Keyboard is visible - no violation');
            }
          }
          
          console.log('[VIOLATION_DEBUG] Setting violations:', violations);
          setSecondaryCameraViolations(violations);
          
          // Reset dismissal time if violations are cleared
          if (violations.length === 0) {
            console.log('[VIOLATION_DEBUG] No secondary violations, checking primary violations');
            setOverlayDismissedAt(null);
            // Only hide overlay if primary camera also has no violations
            if (primaryCameraViolations.length === 0) {
              setShowUnifiedViolationOverlay(false);
            }
          } else {
            // Only show overlay if there are violations and either:
            // 1. Overlay hasn't been dismissed, or
            // 2. It's been more than 5 seconds since dismissal (reduced from 10)
            const now = Date.now();
            const timeSinceDismissal = overlayDismissedAt ? (now - overlayDismissedAt) : null;
            const shouldShowOverlay = (violations.length > 0 || primaryCameraViolations.length > 0) && (
              !overlayDismissedAt || 
              (now - overlayDismissedAt) > 5000 // 5 seconds (reduced from 10)
            );
            
            console.log('[VIOLATION_DEBUG] ===== UNIFIED OVERLAY DECISION LOGIC =====');
            console.log('[VIOLATION_DEBUG] Secondary violations count:', violations.length);
            console.log('[VIOLATION_DEBUG] Primary violations count:', primaryCameraViolations.length);
            console.log('[VIOLATION_DEBUG] Secondary violations:', violations);
            console.log('[VIOLATION_DEBUG] Primary violations:', primaryCameraViolations);
            console.log('[VIOLATION_DEBUG] overlayDismissedAt:', overlayDismissedAt);
            console.log('[VIOLATION_DEBUG] Time since dismissal (ms):', timeSinceDismissal);
            console.log('[VIOLATION_DEBUG] Should show overlay:', shouldShowOverlay);
            console.log('[VIOLATION_DEBUG] Current showUnifiedViolationOverlay state:', showUnifiedViolationOverlay);
            
            setShowUnifiedViolationOverlay(shouldShowOverlay);
            
            console.log('[VIOLATION_DEBUG] After setState - showUnifiedViolationOverlay should be:', shouldShowOverlay);
          }
          
          // Update recommendations
          const recommendations = result.analysis.recommendations || [];
          setAnalysisRecommendations(recommendations);
          
          return result.analysis;
        } else {
          console.log('[AI_ANALYSIS] No analysis in response or not successful:', result);
          // If AI analysis fails, assume no violations for now
          console.log('[VIOLATION_DEBUG] AI analysis failed - assuming no violations');
          setSecondaryCameraViolations([]);
          // Only hide overlay if primary camera also has no violations
          if (primaryCameraViolations.length === 0) {
            setShowUnifiedViolationOverlay(false);
          }
        }
      } else {
        console.error('[AI_ANALYSIS] Response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('[AI_ANALYSIS] Error response:', errorText);
      }
    } catch (error) {
      console.error('[AI_ANALYSIS] Failed to analyze frame:', error);
    } finally {
      setAnalysisInProgress(false);
    }
    return null;
  };

  // Generate QR code URL
  const generateQRCode = () => {
    if (!mobileSessionId) return '';
    
    console.log('[QR Code] Generating QR code with session ID:', mobileSessionId);
    console.log('[QR Code] Session ID type:', typeof mobileSessionId);
    console.log('[QR Code] Session ID length:', mobileSessionId.length);
    
    // Try multiple approaches to ensure mobile compatibility
    let urls = [];
    
    // 1. Use network IP if available (most reliable for mobile devices)
    if (networkIp) {
      // Try both HTTP and HTTPS with the network IP
      urls.push(`http://${networkIp}:3000/mobile-camera?sessionId=${mobileSessionId}`);
      urls.push(`https://${networkIp}:3000/mobile-camera?sessionId=${mobileSessionId}`);
    }
    
    // 2. Use window.location values as fallback
    const host = window.location.hostname;
    const port = window.location.port || '3000';
    
    // Try with current protocol
    urls.push(`${window.location.protocol}//${host}:${port}/mobile-camera?sessionId=${mobileSessionId}`);
    
    // Try with explicit HTTP (for local development)
    if (window.location.protocol !== 'http:') {
      urls.push(`http://${host}:${port}/mobile-camera?sessionId=${mobileSessionId}`);
    }
    
    // Log all URLs we're trying
    console.log('Possible QR code URLs:', urls);
    
    // Prioritize using network IP for the base URL instead of localhost
    let baseUrl;
    
    if (networkIp) {
      // Use the network IP with the current protocol
      baseUrl = `${window.location.protocol}//${networkIp}:${window.location.port || '3000'}`;
      console.log('Using network IP for base URL:', baseUrl);
    } else {
      // Fallback to current window location if no network IP
      baseUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
      console.log('No network IP available, using current location for base URL:', baseUrl);
    }
    
    // Use standard mobile camera with enhanced parameters
    const directUrl = `${baseUrl}/mobile-camera?sessionId=${mobileSessionId}&enhanced=true&fps=30`;
    
    console.log('[QR Code] Generated QR code URL:', directUrl);
    console.log('[QR Code] Session ID in URL:', mobileSessionId);
    console.log('[QR Code] Full URL for mobile device:', directUrl);
    
    // Update state
    setQrCodeUrl(directUrl);
    return directUrl;
  };

  // Function to capture frame from primary camera
  const capturePrimaryCameraFrame = (): string | null => {
    if (!videoRef.current || !mediaStreamRef.current) {
      console.log('[PRIMARY_CAPTURE] No video element or stream available');
      return null;
    }

    try {
      // Create a canvas to capture the frame
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('[PRIMARY_CAPTURE] Could not get canvas context');
        return null;
      }
      
      // Draw the current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64
      const frameData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      console.log('[PRIMARY_CAPTURE] Captured frame, size:', frameData.length);
      
      return frameData;
    } catch (error) {
      console.error('[PRIMARY_CAPTURE] Error capturing frame:', error);
      return null;
    }
  };

  // Initialize the primary camera
  const initializePrimaryCamera = async () => {
    console.log('[PRIMARY CAMERA] 🎥 Initializing primary camera...');
    console.log('[PRIMARY CAMERA] Current setup step:', setupStep);
    
    try {
      // Get user media
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      };

      console.log('[PRIMARY CAMERA] Requesting user media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[PRIMARY CAMERA] ✅ Got media stream:', stream.id);
      
      mediaStreamRef.current = stream;

      // Set the stream to the video element
      if (videoRef.current) {
        console.log('[PRIMARY CAMERA] ✅ Setting stream to video element');
        videoRef.current.srcObject = stream;
        
        // Wait for video to load
        videoRef.current.onloadedmetadata = () => {
          console.log('[PRIMARY CAMERA] ✅ Video metadata loaded, playing...');
          videoRef.current?.play().catch(e => console.log('[PRIMARY CAMERA] Play error:', e));
          
          // Start primary camera analysis when video is ready
          if (setupStep === SetupStep.MOBILE_CONNECTED) {
            startPrimaryCameraAnalysis();
          }
        };
      } else {
        console.log('[PRIMARY CAMERA] ❌ No video element reference');
      }

      // FIXED: Only set step to PRIMARY_CAMERA if we're in INIT state - don't override other states
      if (setupStep === SetupStep.INIT) {
        console.log('[PRIMARY CAMERA] Setting step to PRIMARY_CAMERA from INIT');
        setSetupStep(SetupStep.PRIMARY_CAMERA);
      } else {
        console.log('[PRIMARY CAMERA] Keeping current step:', setupStep, '- not overriding');
      }
      return true;
    } catch (err: any) {
      console.log('[PRIMARY CAMERA] ❌ Failed to access camera:', err.message);
      setError(`Failed to access camera: ${err.message}`);
      return false;
    }
  };

  // Start primary camera analysis interval
  const startPrimaryCameraAnalysis = () => {
    console.log('[PRIMARY_ANALYSIS] Starting primary camera analysis interval');
    
    // Clear any existing interval
    if (window.primaryAnalysisInterval) {
      clearInterval(window.primaryAnalysisInterval);
    }
    
    // Start analysis every 3 seconds (less frequent than secondary camera)
    window.primaryAnalysisInterval = setInterval(() => {
      if (!isMountedRef.current || setupStep !== SetupStep.MOBILE_CONNECTED) {
        console.log('[PRIMARY_ANALYSIS] Stopping analysis - component unmounted or step changed');
        if (window.primaryAnalysisInterval) {
          clearInterval(window.primaryAnalysisInterval);
          window.primaryAnalysisInterval = undefined;
        }
        return;
      }
      
      const frameData = capturePrimaryCameraFrame();
      if (frameData) {
        console.log('[PRIMARY_ANALYSIS] Analyzing primary camera frame');
        analyzePrimaryCameraWithAI(frameData).catch(e => 
          console.error('[PRIMARY_ANALYSIS] Analysis error:', e)
        );
      }
    }, 3000); // Every 3 seconds
  };

  // Track frame count for debugging
  const [frameCount, setFrameCount] = useState<number>(0);
  
  // Check if the mobile camera is connected
  const checkMobileConnection = async (): Promise<boolean> => {
    // Make sure we have a valid session ID that's not null or 'null'
    if (!mobileSessionId || mobileSessionId === 'null' || setupStep === SetupStep.COMPLETE) {
      console.error('Invalid mobile session ID for connection check:', mobileSessionId);
      return false;
    }

    try {
      // Use the original behavior for checking connection
      setIsCheckingMobileConnection(true);
      let gotAnyResponse = false;

      console.log('Checking mobile connection for session ID:', mobileSessionId);
      
      // Check if the mobile camera is connected
      const checkResponse = await fetchWithRetry(
        `/api/setup/check-mobile-camera?sessionId=${mobileSessionId}&debug=true&t=${Date.now()}`,
        undefined,
        1
      );

      gotAnyResponse = true;
      
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        console.log('Mobile connection check response:', checkData);
        
        // Only consider connected if we have real data and not test data
        // Log the full response for debugging
        console.log('Full mobile connection check response:', JSON.stringify(checkData));
        
        // FIXED: Require verified connection with actual frames from mobile device
        // Only consider connected if we have verified frames from a real mobile device
        const hasFrames = checkData.frameCount > 0; // Must have at least 1 frame
        const isRecent = checkData.lastUpdated && (Date.now() - checkData.lastUpdated < 15000); // More strict: 15 seconds
        const hasValidConnection = checkData.connected; // Trust the server's connected flag
        const isVerified = checkData.verified === true; // NEW: Require verified flag from API
        
        // Log detailed connection criteria
        console.log('Connection criteria:', {
          hasFrames,
          framesReceived: checkData.frameCount || 0,
          isRecent,
          lastUpdatedAge: checkData.lastUpdated ? Date.now() - checkData.lastUpdated : 'N/A',
          hasValidConnection,
          isVerified,
          forcedConnection: checkData.forcedConnection || false
        });
        
        // FIXED: Require ALL criteria for a real connection - frames AND recent AND verified
        const isRealConnection = hasFrames && isRecent && hasValidConnection && isVerified;
        
        // Update frame count for debugging
        setFrameCount(checkData.frameCount || 0);
        
        console.log('Is real connection:', isRealConnection, 
          'frameCount:', checkData.frameCount || 0, 
          'verified:', isVerified,
          'forcedConnection:', checkData.forcedConnection || false,
          'lastUpdated age:', checkData.lastUpdated ? Date.now() - checkData.lastUpdated : 'N/A',
          'streamUrl:', checkData.streamUrl || 'none');
        
        if (isRealConnection && isMountedRef.current) {
          console.log('[CONNECTION] ✅ Mobile camera connected with frames!', checkData);
          
          // Set mobile connected state to true - this will trigger auto-advance
          console.log('[CONNECTION] ✅ Setting isMobileConnected to true with frameCount:', checkData.frameCount);
          setIsMobileConnected(true);
          console.log('[CONNECTION] ✅ isMobileConnected state updated - auto-advance should trigger immediately');
          
          // Only change the UI AFTER we've confirmed the connection
          // Create a dummy video stream since we can't get the real one
          if (secondaryVideoRef.current) {
            try {
              // Create a canvas for rendering the mobile camera feed
              const canvas = document.createElement('canvas');
              canvas.width = 640;
              canvas.height = 480;
              const ctx = canvas.getContext('2d');
              
              if (ctx) {
                // Draw initial placeholder
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'white';
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Mobile Camera Connected', canvas.width/2, canvas.height/2 - 20);
                ctx.fillText('✓', canvas.width/2, canvas.height/2 + 30);
                
                // Create a stream from the canvas
                try {
                  const stream = (canvas as any).captureStream(10); // 10fps for smoother video
                  secondaryVideoRef.current.srcObject = stream;
                  
                  // Store the stream and canvas context for updates
                  setSecondaryStream(stream);
                  
                  // Create regular variables instead of React hooks
                  // We can't use React hooks inside this function
                  const ctxRef = { current: ctx };
                  const lastFrameTimeRef = { current: Date.now() };
                  const failureCountRef = { current: 0 };
                  
                  // AI analysis function is now defined globally at the top of the component
                  
                  // Function to draw a fallback frame when no updates are received
                  const drawFallbackFrame = () => {
                    if (!ctxRef.current) return;
                    
                    const ctx = ctxRef.current;
                    const timeSinceLastFrame = Date.now() - lastFrameTimeRef.current;
                    
                    // Draw a warning message
                    ctx.fillStyle = '#333';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = '#FFA500'; // Orange warning color
                    ctx.font = '18px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('Reconnecting to mobile camera...', canvas.width/2, canvas.height/2 - 40);
                    
                    if (timeSinceLastFrame > 1000) {
                      ctx.fillText(`Last frame: ${Math.floor(timeSinceLastFrame/1000)}s ago`, canvas.width/2, canvas.height/2);
                    } else {
                      ctx.fillText('Establishing connection...', canvas.width/2, canvas.height/2);
                    }
                    
                    ctx.fillText('Please keep the camera app open', canvas.width/2, canvas.height/2 + 40);
                    ctx.fillText(`Session ID: ${mobileSessionId}`, canvas.width/2, canvas.height/2 + 70);
                    
                    // Add a timestamp to show the UI is still responsive
                    ctx.font = '12px Arial';
                    ctx.fillText(`${new Date().toLocaleTimeString()}`, canvas.width/2, canvas.height - 20);
                    
                    // Try multiple reconnection strategies
                    
                    // 1. Send a heartbeat ping
                    fetch(`/api/setup/check-mobile-camera?sessionId=${mobileSessionId}&heartbeat=true&t=${Date.now()}`, {
                      headers: { 'Cache-Control': 'no-cache' }
                    }).catch(e => console.log('Heartbeat error:', e));
                    
                    // 2. Try to get a fresh frame
                    fetch(`/api/setup/mobile-frame/${mobileSessionId}?t=${Date.now()}&r=${Math.random()}`, {
                      headers: { 
                        'Cache-Control': 'no-cache', 
                        'Pragma': 'no-cache' 
                      },
                      // Add a signal to abort the request after 5 seconds (increased timeout)
                      signal: AbortSignal.timeout(5000)
                    })
                    .then(response => {
                      if (response.ok) {
                        console.log('Got frame response in fallback handler');
                        return response.json();
                      }
                      throw new Error('Failed to get frame');
                    })
                    .then(data => {
                      if (data && data.frameData) {
                        console.log('Got frame data in fallback handler');
                        // We got a frame, reset the failure counter
                        failureCountRef.current = 0;
                        lastFrameTimeRef.current = Date.now();
                        
                        // Create an image from the frame data
                        const img = new Image();
                        img.onload = () => {
                          if (!ctxRef.current) return;
                          
                          const ctx = ctxRef.current;
                          // Clear canvas
                          ctx.fillStyle = '#000';
                          ctx.fillRect(0, 0, canvas.width, canvas.height);
                          // Draw the new frame
                          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                          // Add a timestamp and frame number
                          ctx.fillStyle = '#fff';
                          ctx.font = '12px Arial';
                          ctx.textAlign = 'left';
                          ctx.fillText(`Frame #${data.frameCount || 0} | ${new Date().toLocaleTimeString()}`, 10, canvas.height - 10);
                        };
                        img.src = `data:image/jpeg;base64,${data.frameData}`;
                      }
                    })
                    .catch(e => console.log('Frame fetch error in fallback:', e));
                    
                    // 3. Reset the failure counter occasionally to allow fresh attempts
                    if (failureCountRef.current > 10) {
                      console.log('Resetting failure counter to allow fresh attempts');
                      failureCountRef.current = 2;
                    }
                  };
                  
                  // Set up a periodic update to refresh the video
                  const updateInterval = setInterval(() => {
                    if (!isMountedRef.current) {
                      clearInterval(updateInterval);
                      return;
                    }
                    
                    // Add a small random delay to avoid synchronized requests
                    const randomDelay = Math.floor(Math.random() * 100);
                    setTimeout(() => {
                      if (!isMountedRef.current) return;
                      
                      console.log('Fetching frame for session:', mobileSessionId);
                      
                      // Use a simple fetch without retry to avoid rate limiting
                      fetch(`/api/setup/mobile-frame/${mobileSessionId}?t=${Date.now()}&r=${Math.random()}`, {
                        headers: { 
                          'Cache-Control': 'no-cache', 
                          'Pragma': 'no-cache' 
                        },
                        // Add a signal to abort the request after 5 seconds (increased timeout)
                        signal: AbortSignal.timeout(5000)
                      }).then(async (response) => {
                        if (response.ok) {
                          console.log('Got frame response');
                          try {
                            const data = await response.json();
                            console.log('Frame data received:', data ? 'yes' : 'no', 
                                      'frameData length:', data && data.frameData ? data.frameData.length : 0);
                            
                            if (data && data.frameData) {
                              // Reset failure counter on success
                              failureCountRef.current = 0;
                              
                              // Update last frame time
                              lastFrameTimeRef.current = Date.now();
                              
                              // Analyze frame with AI every 10th frame to reduce load
                              const shouldAnalyze = (data.frameCount || 0) % 10 === 0;
                              if (shouldAnalyze) {
                                console.log('[DEBUG] Analyzing secondary camera frame #', data.frameCount);
                                analyzeFrameWithAI(data.frameData).catch(e => 
                                  console.error('Secondary AI analysis error:', e)
                                );
                              }
                              
                              // Create an image from the frame data
                              const img = new Image();
                              img.onload = () => {
                                if (!ctxRef.current) return;
                                
                                const ctx = ctxRef.current;
                                // Clear canvas
                                ctx.fillStyle = '#000';
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                // Draw the new frame
                                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                
                                // Add AI analysis overlay
                                if (violationPreventionActive) {
                                  ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
                                  ctx.fillRect(0, 0, canvas.width, 30);
                                  ctx.fillStyle = '#00ff00';
                                  ctx.font = '14px Arial';
                                  ctx.textAlign = 'center';
                                  ctx.fillText('🛡️ AI Violation Prevention Active', canvas.width/2, 20);
                                }
                                
                                // Add a timestamp and frame number
                                ctx.fillStyle = '#fff';
                                ctx.font = '12px Arial';
                                ctx.textAlign = 'left';
                                ctx.fillText(`Frame #${data.frameCount || 0} | ${new Date().toLocaleTimeString()}`, 10, canvas.height - 10);
                                
                                console.log('Frame rendered successfully');
                              };
                              img.onerror = (err) => {
                                console.error('Error loading image from frame data:', err);
                                failureCountRef.current++;
                                if (failureCountRef.current > 3) {
                                  drawFallbackFrame();
                                }
                              };
                              img.src = `data:image/jpeg;base64,${data.frameData}`;
                            } else {
                              console.log('No frame data in response');
                              failureCountRef.current++;
                              if (failureCountRef.current > 3) {
                                drawFallbackFrame();
                              }
                            }
                          } catch (e) {
                            console.error('Error parsing frame data:', e);
                            failureCountRef.current++;
                            if (failureCountRef.current > 3) {
                              drawFallbackFrame();
                            }
                          }
                        } else {
                          console.error('Frame fetch failed:', response.status, response.statusText);
                          failureCountRef.current++;
                          if (failureCountRef.current > 3) {
                            drawFallbackFrame();
                          }
                        }
                      }).catch(e => {
                        console.error('Error fetching frame:', e);
                        failureCountRef.current++;
                        if (failureCountRef.current > 3) {
                          drawFallbackFrame();
                        }
                      });
                    }, randomDelay);
                  }, 200); // Update every 200ms (5fps)
                  
                  // Set up a heartbeat to ensure connection stays alive
                  const heartbeatInterval = setInterval(() => {
                    if (!isMountedRef.current) {
                      clearInterval(heartbeatInterval);
                      return;
                    }
                    
                    // Send a heartbeat to keep the connection alive
                    fetch(`/api/setup/check-mobile-camera?sessionId=${mobileSessionId}&heartbeat=true&t=${Date.now()}`)
                      .catch(() => {}); // Ignore errors
                  }, 10000); // Every 10 seconds
                  
                  // Store interval IDs in refs that can be accessed from cleanup functions
                  if (!window.mobileIntervals) {
                    window.mobileIntervals = {};
                  }
                  window.mobileIntervals[mobileSessionId] = {
                    updateInterval,
                    heartbeatInterval
                  };
                } catch (e) {
                  console.error('Error creating stream from canvas:', e);
                }
              }
            } catch (e) {
              console.error('Error creating placeholder video:', e);
            }
          }
          
          // FIXED: Set mobile connected state - auto-advance handled by useEffect
          console.log('VERIFIED mobile connection confirmed - setting isMobileConnected state');
          
          // The useEffect watching isMobileConnected will handle the auto-advance
          console.log('Auto-advance will be handled by isMobileConnected useEffect');
          
          return true;
        }
      }

      // If we get here, we didn't get a valid connection
      if (gotAnyResponse) {
        console.log('Mobile camera not connected');
      } else {
        console.log('No response from mobile camera check');
      }
    } catch (error) {
      console.error('Error in mobile connection check process:', error);
    }

    if (isMountedRef.current) {
      setIsCheckingMobileConnection(false);
    }
    return false; // Explicitly return false for all other cases
  };

  // --- Side Effects (useEffect) ---

  // Track component mount state and clean up intervals
  useEffect(() => {
    isMountedRef.current = true;
    
    // Check if mobile is already connected (in case we're returning to this component)
    const checkExistingConnection = async () => {
      try {
        // Make sure we have a valid session ID
        if (!mobileSessionId) {
          console.error('No mobile session ID available for connection check');
          return;
        }
        
        console.log('Checking for existing mobile connection with session ID:', mobileSessionId);
        
        // First try to get debug info about all connections
        try {
          const debugResponse = await fetch('/api/setup/debug-storage');
          if (debugResponse.ok) {
            const debugData = await debugResponse.json();
            console.log('Storage debug info:', debugData);
          }
        } catch (debugErr) {
          console.warn('Error fetching debug storage info:', debugErr);
        }
        
        // Now check for our specific connection
        const response = await fetch(`/api/setup/check-mobile-camera?sessionId=${mobileSessionId}&enhanced=true&t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          console.log('Existing connection check result for session', mobileSessionId, ':', data);
          
          // If we already have frames or connection, set the state
          if (data.connected || (data.frameCount && data.frameCount > 0)) {
            console.log('Existing mobile connection found for session', mobileSessionId);
            setIsMobileConnected(true);
            setFrameCount(data.frameCount || 0);
            
            // If we're on the QR code step, advance to mobile connected
            if (setupStep === SetupStep.SHOW_QR) {
              console.log('Advancing to MOBILE_CONNECTED step due to existing connection');
              setTimeout(() => setSetupStep(SetupStep.MOBILE_CONNECTED), 500);
            }
            return;
          }
        }
      } catch (e) {
        console.error('Error checking existing connection:', e);
      }
      
      // If no existing connection, reset the state
      setIsMobileConnected(false);
      console.log('No existing connection found for session', mobileSessionId, ', connection state reset on component mount');
    };
    
    // Check for existing connection
    checkExistingConnection();
    
    return () => {
      isMountedRef.current = false;
      
      // Clean up any intervals that might be running
      if (window.mobileIntervals && mobileSessionId && window.mobileIntervals[mobileSessionId]) {
        const { updateInterval, heartbeatInterval } = window.mobileIntervals[mobileSessionId];
        if (updateInterval) clearInterval(updateInterval);
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        delete window.mobileIntervals[mobileSessionId];
      }
      
      // Clean up primary camera analysis interval
      if (window.primaryAnalysisInterval) {
        clearInterval(window.primaryAnalysisInterval);
        window.primaryAnalysisInterval = undefined;
      }
    };
  }, [mobileSessionId]);

  // Detect mobile device
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobileCheck =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      setIsMobileDevice(mobileCheck);
    }
  }, []);

  // Function to get network IP
  const getNetworkIp = async () => {
    try {
      console.log('Fetching network IP...');
      const response = await fetch('/api/network-ip');
      if (response.ok) {
        const data = await response.json();
        console.log('Network IP fetched:', data.ip);
        setNetworkIp(data.ip);
        return data.ip;
      }
    } catch (error) {
      console.error('Error getting network IP:', error);
      setNetworkIp('');
    }
    return '';
  };

  // Get network IP on mount
  useEffect(() => {
    getNetworkIp();
  }, []);

  // Initialize primary camera when component mounts or when returning to primary camera step
  useEffect(() => {
    console.log('Primary camera useEffect triggered, setupStep:', setupStep);
    
    // FIXED: Only initialize camera for INIT step to prevent interference
    if (setupStep === SetupStep.INIT) {
      console.log('Initializing primary camera for INIT step');
      initializePrimaryCamera();
    } else {
      console.log('Skipping camera initialization for step:', setupStep);
    }

    // Set up a fallback timeout to move to the next step if the camera doesn't initialize
    initFallbackTimeoutRef.current = setTimeout(() => {
      if (setupStep === SetupStep.INIT) {
        setError('Camera initialization timed out');
      }
    }, CAMERA_INIT_FALLBACK_MS);

    return () => {
      if (initFallbackTimeoutRef.current) {
        clearTimeout(initFallbackTimeoutRef.current);
        initFallbackTimeoutRef.current = null;
      }
      
      // Always clean up media stream to prevent camera from staying on
      if (mediaStreamRef.current) {
        console.log('Cleaning up media stream in useEffect cleanup');
        mediaStreamRef.current.getTracks().forEach(track => {
          console.log('Stopping track in cleanup:', track.kind, track.id);
          track.stop();
        });
        mediaStreamRef.current = null;
        
        // Clear video element
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
      
      // Clean up WebRTC connections
      if (primarySignalingRef.current) primarySignalingRef.current.close();
      if (primaryPeerConnectionRef.current) primaryPeerConnectionRef.current.close();
      primarySignalingRef.current = null;
      primaryPeerConnectionRef.current = null;
    };
  }, [setupStep]);

  // Check for mobile connection when QR code is shown - DISABLED AUTO-ADVANCE
  useEffect(() => {
    if (mobileSessionId && (setupStep === SetupStep.SHOW_QR || setupStep === SetupStep.PRIMARY_CAMERA)) {
      console.log('Starting mobile connection check interval for step:', setupStep);
      // Start checking for connection
      const checkInterval = setInterval(() => {
        // Only check if we haven't already connected and not transitioning
        if (!isMobileConnected && !isTransitioning) {
          checkMobileConnection().then(connected => {
            if (connected) {
              console.log('Mobile connected, clearing check interval');
              clearInterval(checkInterval);
              console.log('Mobile connection detected - automatically restarting primary camera');
              
              // Automatically restart primary camera when mobile connection is established
              setTimeout(() => {
                console.log('[AUTO_RESTART] Restarting primary camera after mobile connection');
                // Check if primary camera is already running
                if (!mediaStreamRef.current) {
                  console.log('[AUTO_RESTART] Primary camera not running, initializing...');
                  initializePrimaryCamera();
                } else {
                  console.log('[AUTO_RESTART] Primary camera already running, skipping restart');
                }
              }, 1000); // Small delay to ensure mobile connection is stable
            }
          });
        }
      }, MOBILE_POLL_INTERVAL_MS);

      return () => {
        console.log('Clearing mobile connection check interval');
        clearInterval(checkInterval);
      };
    }
    
    // Return empty cleanup function when no mobileSessionId or not showing QR
    return () => {};
  }, [mobileSessionId, setupStep]);

  // Auto-restart primary camera when transitioning to dual camera view
  useEffect(() => {
    if (setupStep === SetupStep.MOBILE_CONNECTED && !mediaStreamRef.current) {
      console.log('[AUTO_RESTART] Primary camera not active in dual view, restarting...');
      setTimeout(() => {
        initializePrimaryCamera();
      }, 500); // Small delay to ensure UI is ready
    }
    
    // Start primary camera analysis when entering dual camera view
    if (setupStep === SetupStep.MOBILE_CONNECTED && mediaStreamRef.current) {
      console.log('[PRIMARY_ANALYSIS] Starting analysis for dual camera view');
      setTimeout(() => {
        startPrimaryCameraAnalysis();
      }, 1000); // Small delay to ensure video is playing
    }
  }, [setupStep]);

  // DISABLED: Auto-advance to prevent flickering - use manual button only
  useEffect(() => {
    console.log('[AUTO-ADVANCE] DISABLED - Manual control only:', {
      isMobileConnected,
      setupStep,
      frameCount,
      isTransitioning
    });
    // Auto-advance completely disabled - users must use manual buttons
  }, [isMobileConnected, setupStep, frameCount, isTransitioning]);

  // Initialize mobile canvas when entering MOBILE_CONNECTED step
  useEffect(() => {
    console.log('[MOBILE CANVAS] useEffect triggered:', { setupStep, hasMobileCanvas: !!mobileCanvasRef.current, mobileSessionId });
    
    if (setupStep === SetupStep.MOBILE_CONNECTED && mobileCanvasRef.current) {
      console.log('[MOBILE CANVAS] ✅ Initializing mobile canvas for dual camera view');
      const canvas = mobileCanvasRef.current;
      canvas.width = 640;
      canvas.height = 480;
      console.log('[MOBILE CANVAS] Canvas dimensions set:', { width: canvas.width, height: canvas.height });
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw a placeholder until mobile frames arrive
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Mobile Camera Feed', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillText('Waiting for frames...', canvas.width / 2, canvas.height / 2 + 10);
      }
      
      // Start fetching mobile camera frames actively
      if (mobileSessionId) {
        console.log('[MOBILE FRAMES] ✅ Starting active mobile frame fetching for session:', mobileSessionId);
        
        const fetchMobileFrames = async () => {
          try {
            console.log('[MOBILE FRAMES] Fetching frame for session:', mobileSessionId);
            const response = await fetch(`/api/setup/mobile-frame/${mobileSessionId}`);
            console.log('[MOBILE FRAMES] Response status:', response.status);
            
            if (response.ok) {
              const data = await response.json();
              console.log('[MOBILE FRAMES] Frame data received:', { 
                hasFrameData: !!data.frameData, 
                frameCount: data.frameCount, 
                isPlaceholder: data.isPlaceholder,
                timestamp: data.timestamp 
              });
              
              if (data.frameData) {
                // Analyze frame with AI every 5th frame
                // The AI service will auto-activate the secondary camera
                const shouldAnalyze = (data.frameCount || 0) % 15 === 0;
                if (shouldAnalyze) {
                  console.log('[MOBILE FRAMES] 🤖 Analyzing frame #', data.frameCount, 'with AI (auto-activation enabled)');
                  analyzeFrameWithAI(data.frameData).catch(e => 
                    console.error('[MOBILE FRAMES] AI analysis error:', e)
                  );
                }
                
                const img = new Image();
                img.onload = () => {
                  if (ctx && canvas) {
                    // Clear canvas and draw the mobile frame
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    console.log('[MOBILE FRAMES] ✅ Frame displayed on canvas, frameCount:', data.frameCount);
                  } else {
                    console.log('[MOBILE FRAMES] ❌ No canvas context available');
                  }
                };
                img.onerror = (error) => {
                  console.log('[MOBILE FRAMES] ❌ Image load error:', error);
                };
                // Convert base64 to data URL
                img.src = `data:image/jpeg;base64,${data.frameData}`;
              } else {
                console.log('[MOBILE FRAMES] ⚠️ No frameData in response');
              }
            } else {
              console.log('[MOBILE FRAMES] ⚠️ No mobile frame available, status:', response.status);
            }
          } catch (error) {
            console.log('[MOBILE FRAMES] ❌ Error fetching mobile frame:', error);
          }
        };
        
        // Fetch frames every 100ms for smooth video
        const frameInterval = setInterval(fetchMobileFrames, 100);
        
        // Store interval for cleanup
        return () => {
          console.log('Cleaning up mobile frame fetching');
          clearInterval(frameInterval);
        };
      }
      
      // Also restart the primary camera if it's not running
      console.log('[PRIMARY CAMERA] Checking primary camera status:', {
        hasMediaStream: !!mediaStreamRef.current,
        hasVideoRef: !!videoRef.current,
        videoSrcObject: videoRef.current?.srcObject
      });
      
      if (videoRef.current) {
        if (!mediaStreamRef.current || !videoRef.current.srcObject) {
          console.log('[PRIMARY CAMERA] ✅ Restarting primary camera for dual view');
          initializePrimaryCamera();
        } else {
          console.log('[PRIMARY CAMERA] ✅ Primary camera already running');
        }
      } else {
        console.log('[PRIMARY CAMERA] ❌ No video element reference');
      }
    }
    
    // Return empty cleanup function if no mobile session
    return () => {};
  }, [setupStep, mobileSessionId]);

  const handleValidate = () => {
    setSetupStep(SetupStep.VALIDATE);
    setIsValidating(true);
    setValidationMessage('Validating camera position...');
    
    // Simulate validation process and then show QR code
    setTimeout(() => {
      console.log('Validation complete, showing QR code');
      setValidationMessage('Camera position validated! Setting up mobile connection...');
      
      // Transition to QR code step after brief delay
      setTimeout(() => {
        setSetupStep(SetupStep.SHOW_QR);
        setShowQRCode(true);
        setIsValidating(false);
        setValidationMessage('');
      }, 1000);
    }, 2000); // 2 second validation simulation
  };

  const handleComplete = () => {
    setSetupStep(SetupStep.COMPLETE);
    onComplete();
  };

  const handleSkip = () => {
    if (onSkip) onSkip();
  };

  const handleReconnect = () => {
    // Reset connection state
    setIsMobileConnected(false);
    setSetupStep(SetupStep.SHOW_QR);
    
    // Try to reconnect
    checkMobileConnection();
  };

  // --- Render ---

  // Render QR code instructions
  const renderQRCodeInstructions = () => {
    console.log('Rendering QR code instructions');
    console.log('QR code URL:', qrCodeUrl);
    
    // Generate QR code URL if it doesn't exist
    if (!qrCodeUrl) {
      const url = generateQRCode();
      console.log('Generated new QR code URL:', url);
    }
    
    return (
      <div className="flex flex-col items-center space-y-4 p-6 border-4 border-blue-600 rounded-lg bg-blue-50 shadow-lg mt-4">
        {/* Remove primary camera feed when showing QR code */}
        
        <h3 className="text-xl font-bold text-blue-800 flex items-center justify-center">
          {isMobileConnected ? (
            <>
              <span className="bg-green-500 w-3 h-3 rounded-full mr-2 animate-pulse"></span>
              Mobile Connected! Click Continue Below
            </>
          ) : (
            <>Scan this QR code with your mobile device</>
          )}
        </h3>
        <div className="bg-white p-6 rounded-lg border-2 border-blue-400 shadow-md">
          {qrCodeUrl ? (
            <div className="relative">
              <SimpleQRCode value={qrCodeUrl} size={250} />
              <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Ready to Scan
              </div>
            </div>
          ) : (
            <div className="w-[250px] h-[250px] flex items-center justify-center bg-gray-100 rounded-md">
              <p className="text-sm text-gray-500">Generating QR code...</p>
            </div>
          )}
        </div>
        <p className="text-sm text-center max-w-md">
          Open your mobile device's camera app and scan this QR code to connect your phone as a secondary camera.
        </p>
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-md text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Network IP:</span>
            <Button 
              onClick={async () => {
                const ip = await getNetworkIp();
                if (ip) {
                  // Regenerate QR code with new IP
                  generateQRCode();
                }
              }} 
              variant="outline" 
              size="sm"
              className="h-7 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Refresh IP
            </Button>
          </div>
          {networkIp ? (
            <div className="bg-white p-1 rounded border border-blue-100 text-center font-mono">
              {networkIp}
            </div>
          ) : (
            <div className="text-center text-red-500">
              Not detected - QR code may not work on mobile!
            </div>
          )}
        </div>
        <div className="flex flex-col items-center space-y-2">
          <div className="flex items-center space-x-2 text-sm">
            {isCheckingMobileConnection ? (
              <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            ) : (
              <div className="h-4 w-4"></div>
            )}
            <span>
              {isCheckingMobileConnection ? 'Checking for mobile connection... ' : ''}
            </span>
          </div>
          
          {/* Frame counter with progress bar */}
          <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div 
              className={`${frameCount >= 1 ? 'bg-green-600' : 'bg-blue-600'} h-2.5 rounded-full transition-all duration-300 ease-in-out`} 
              style={{ width: `${Math.min(100, frameCount >= 1 ? 100 : (frameCount * 100))}%` }}
            ></div>
          </div>
          <div className="text-xs font-medium text-center">
            <span className={`${frameCount >= 1 ? 'text-green-600 font-bold' : 'text-gray-500'}`}>
              Frames: {frameCount} received {frameCount >= 1 ? '✓' : ''}
            </span>
          </div>
        </div>
        
        {/* Connection status and continue button */}
        <div className="mt-4 w-full max-w-md space-y-3">
          {/* Always show reset option */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-center mb-2">
              <span className="text-sm text-yellow-700">Having connection issues?</span>
            </div>
            <Button 
              onClick={() => {
                console.log('Resetting mobile connection state...');
                // Reset local state
                setIsMobileConnected(false);
                setFrameCount(0);
                
                // Clear server-side connections
                fetch(`/api/setup/mobile-camera`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    sessionId: mobileSessionId,
                    connected: false, 
                    reset: true, 
                    forceReset: true 
                  })
                }).then(() => {
                  console.log('Server connection state reset');
                  // Regenerate QR code
                  generateQRCode();
                }).catch(err => {
                  console.error('Failed to reset server state:', err);
                });
              }} 
              variant="outline"
              className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              🔄 Reset Connection & Show Fresh QR Code
            </Button>
          </div>
          
          {isMobileConnected ? (
            <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg">
              <div className="flex items-center justify-center mb-3">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                <span className="font-bold text-green-700">Mobile device connected!</span>
              </div>
              <div className="flex flex-col space-y-2">
                <Button 
                  onClick={() => {
                    console.log('[MANUAL] User clicked Continue to Camera Setup');
                    console.log('[MANUAL] Current state:', { setupStep, isMobileConnected, frameCount });
                    setSetupStep(SetupStep.MOBILE_CONNECTED);
                    console.log('[MANUAL] Manually set setupStep to MOBILE_CONNECTED');
                  }} 
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 text-lg"
                >
                  ✅ Continue to Dual Camera View
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <span className="text-sm text-blue-700">Scan the QR code above with your mobile device to connect</span>
            </div>
          )}
        </div>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <Button 
            onClick={() => setSetupStep(SetupStep.PRIMARY_CAMERA)} 
            variant="outline"
          >
            Back to Camera View
          </Button>
        </div>
      </div>
    );
  };

  // Render mobile camera view
  const renderMobileCameraView = () => {
    return (
      <div className="flex flex-col items-center space-y-4">
        {/* Two camera feeds side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* Primary camera feed */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Primary Camera
            </div>
          </div>
          
          {/* Secondary camera feed */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={secondaryVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Secondary Camera
            </div>
          </div>
        </div>
        
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Position Your Device</AlertTitle>
          <AlertDescription>
            Place your phone to the side so it captures you, your screen, and your workspace.
          </AlertDescription>
        </Alert>
        <div className="flex space-x-4">
          <Button onClick={handleReconnect} variant="outline">
            Reconnect
          </Button>
          <Button onClick={handleValidate} disabled={isValidating}>
            {isValidating ? 'Validating...' : 'Confirm Position'}
          </Button>
        </div>
        {validationMessage && (
          <div className="text-sm text-center text-muted-foreground mt-2">
            {validationMessage}
          </div>
        )}
      </div>
    );
  };

  // Main render
  console.log('Rendering ThirdCameraSetup with state:', {
    setupStep,
    showQRCode,
    isMobileConnected,
    qrCodeUrl,
    error
  });
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Set Up Secondary Camera</h2>
        <p className="text-muted-foreground">
          Connect a secondary camera to monitor your environment during the test.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6">
            {setupStep === SetupStep.PRIMARY_CAMERA && !isMobileDevice && (
              <div className="flex flex-col items-center space-y-4">
                {/* Primary camera feed */}
                <div className="relative w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden mb-4">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Primary Camera
                  </div>
                </div>
                <div className="w-full max-w-md mx-auto">
                  <Button 
                    onClick={() => {
                      console.log('Button clicked directly - resetting connections first');
                      
                      // FIRST: Force clear all server connections for this session
                      console.log('Force clearing all server connections for session:', mobileSessionId);
                      
                      // Reset all connection states
                      console.log('Resetting mobile connection state before showing QR...');
                      setIsMobileConnected(false);
                      setFrameCount(0);
                      
                      // Stop the camera if it's running
                      if (mediaStreamRef.current) {
                        console.log('Stopping camera before showing QR code');
                        mediaStreamRef.current.getTracks().forEach(track => track.stop());
                        mediaStreamRef.current = null;
                        
                        // Clear video element
                        if (videoRef.current) {
                          videoRef.current.srcObject = null;
                        }
                      }
                      
                      // SECOND: Clear server-side connections
                      fetch(`/api/setup/mobile-camera`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          sessionId: mobileSessionId,
                          connected: false, 
                          reset: true, 
                          forceReset: true,
                          clearAll: true
                        })
                      }).then(() => {
                        console.log('Server connection state reset before showing QR');
                      }).catch(err => {
                        console.error('Failed to reset server state:', err);
                      });
                      
                      // THIRD: Show QR code after a brief delay to ensure reset completes
                      setTimeout(() => {
                        console.log('Now showing QR code with clean state');
                        setSetupStep(SetupStep.SHOW_QR);
                        setShowQRCode(true);
                      }, 200);
                    }} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-3"
                  >
                    <Camera className="h-5 w-5" />
                    <span className="text-lg">Show QR Code to Connect Phone</span>
                  </Button>
                  <p className="text-center text-sm text-gray-600 mt-3">
                    Click to generate a QR code for connecting your mobile device as a secondary camera
                  </p>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-gray-500">
                    Current step: {setupStep} | Mobile Connected: {isMobileConnected ? 'YES' : 'NO'} | Frames: {frameCount}
                  </div>
                  
                  {/* DEBUG: Manual transition button */}
                  {isMobileConnected && (setupStep as string) !== (SetupStep.MOBILE_CONNECTED as string) && (
                    <Button 
                      onClick={() => {
                        if (isTransitioning) {
                          console.log('[DEBUG] ⚠️ Transition already in progress, ignoring click');
                          return;
                        }
                        
                        console.log('[DEBUG] ✅ MANUAL TRANSITION STARTED');
                        console.log('[DEBUG] Before:', { setupStep, isMobileConnected, frameCount });
                        
                        // Lock to prevent interference
                        setIsTransitioning(true);
                        
                        // Clear any existing timeouts that might interfere
                        if (initFallbackTimeoutRef.current) {
                          clearTimeout(initFallbackTimeoutRef.current);
                        }
                        
                        // Force transition immediately
                        console.log('[DEBUG] Setting setupStep to MOBILE_CONNECTED NOW');
                        setSetupStep(SetupStep.MOBILE_CONNECTED);
                        
                        // Keep lock for longer to ensure stability
                        setTimeout(() => {
                          setIsTransitioning(false);
                          console.log('[DEBUG] ✅ TRANSITION COMPLETE - Lock cleared');
                        }, 3000);
                      }}
                      disabled={isTransitioning}
                      variant="outline"
                      className={`w-full font-bold py-3 text-base ${
                        isTransitioning 
                          ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-100 border-green-500 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {isTransitioning ? '⏳ Transitioning...' : '✅ FORCE Show Dual Camera View'}
                    </Button>
                  )}
                </div>
              </div>
            )}

            
            {/* QR code section */}
            {setupStep === SetupStep.SHOW_QR ? (
              renderQRCodeInstructions()
            ) : (
              <div className="p-4 text-center text-gray-500 border border-dashed border-gray-300 rounded-md mt-4">
                QR code section will appear here when button is clicked.
                <div className="text-xs mt-2">Current step: {setupStep}</div>
              </div>
            )}

            {/* ONLY show mobile camera view when explicitly in MOBILE_CONNECTED step */}
            {setupStep === SetupStep.MOBILE_CONNECTED && (
              <div className="flex flex-col items-center space-y-4">
                <h3 className="text-lg font-semibold text-center">Dual Camera Setup Active</h3>
                <p className="text-sm text-center text-muted-foreground mb-4">
                  Both cameras are now connected. You can see your primary camera (left) and mobile camera (right).
                </p>
                
                {/* Two camera feeds side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                  {/* Primary camera feed */}
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Primary Camera
                    </div>
                    {/* Primary Camera AI Status Overlay */}
                    {primaryViolationPreventionActive && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                        🛡️ AI Active
                      </div>
                    )}
                    {primaryAnalysisResults?.overall_compliance && (
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        Score: {Math.round(primaryAnalysisResults.overall_compliance.overall_score * 100)}%
                      </div>
                    )}
                  </div>
                  
                  {/* Secondary camera feed (mobile) */}
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <canvas
                      ref={mobileCanvasRef}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Mobile Camera
                    </div>
                  </div>
                </div>
                
                {/* AI Analysis Status Panel */}
                {(aiAnalysisResults || primaryAnalysisResults) && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                    <h4 className="text-lg font-semibold mb-3 flex items-center">
                      🤖 AI Analysis Status
                      {(violationPreventionActive || primaryViolationPreventionActive) && (
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          🛡️ Violation Prevention Active
                        </span>
                      )}
                    </h4>
                    
                    {/* Camera Analysis Tabs */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Primary Camera Analysis */}
                      {primaryAnalysisResults && (
                        <div className="space-y-4">
                          <h5 className="font-medium text-blue-700 flex items-center">
                            📹 Primary Camera Analysis
                            {primaryViolationPreventionActive && (
                              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                ✅ Active
                              </span>
                            )}
                          </h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Primary Overall Compliance */}
                            <div className="p-3 bg-white rounded border">
                              <h6 className="font-medium text-sm text-gray-700 mb-2">Overall Compliance</h6>
                              {primaryAnalysisResults.overall_compliance && (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm">Score:</span>
                                    <span className="font-medium">
                                      {Math.round(primaryAnalysisResults.overall_compliance.overall_score * 100)}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        primaryAnalysisResults.overall_compliance.overall_score >= 0.8 ? 'bg-green-500' :
                                        primaryAnalysisResults.overall_compliance.overall_score >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${primaryAnalysisResults.overall_compliance.overall_score * 100}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1">
                                    Faces: {primaryAnalysisResults.overall_compliance.faces_detected} | 
                                    Items: {primaryAnalysisResults.overall_compliance.prohibited_items}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {/* Primary Violation Prevention */}
                            <div className="p-3 bg-white rounded border">
                              <h6 className="font-medium text-sm text-gray-700 mb-2">Violation Prevention</h6>
                              {primaryAnalysisResults.violation_prevention && (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm">Risk Level:</span>
                                    <span className={`font-medium capitalize ${
                                      primaryAnalysisResults.violation_prevention.risk_level === 'low' ? 'text-green-600' :
                                      primaryAnalysisResults.violation_prevention.risk_level === 'medium' ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                      {primaryAnalysisResults.violation_prevention.risk_level}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Confidence:</span>
                                    <span className="font-medium">
                                      {Math.round(primaryAnalysisResults.violation_prevention.confidence * 100)}%
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Primary Recommendations */}
                          {primaryAnalysisRecommendations.length > 0 && (
                            <div className="p-3 bg-blue-50 rounded border border-blue-200">
                              <h6 className="font-medium text-sm text-blue-800 mb-2">💡 Primary Camera Tips</h6>
                              <ul className="text-sm text-blue-700 space-y-1">
                                {primaryAnalysisRecommendations.slice(0, 2).map((rec, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Secondary Camera Analysis */}
                      {aiAnalysisResults && (
                        <div className="space-y-4">
                          <h5 className="font-medium text-green-700 flex items-center">
                            📱 Secondary Camera Analysis
                            {violationPreventionActive && (
                              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                ✅ Active
                              </span>
                            )}
                          </h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Secondary Overall Compliance */}
                            <div className="p-3 bg-white rounded border">
                              <h6 className="font-medium text-sm text-gray-700 mb-2">Overall Compliance</h6>
                              {aiAnalysisResults.analysis?.overall_compliance && (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm">Score:</span>
                                    <span className="font-medium">
                                      {Math.round(aiAnalysisResults.analysis.overall_compliance.overall_score * 100)}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        aiAnalysisResults.analysis.overall_compliance.overall_score >= 0.8 ? 'bg-green-500' :
                                        aiAnalysisResults.analysis.overall_compliance.overall_score >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${aiAnalysisResults.analysis.overall_compliance.overall_score * 100}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1 capitalize">
                                    {aiAnalysisResults.analysis.overall_compliance.status}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {/* Secondary Violation Prevention */}
                            <div className="p-3 bg-white rounded border">
                              <h6 className="font-medium text-sm text-gray-700 mb-2">Violation Prevention</h6>
                              {aiAnalysisResults.violation_prevention && (
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm">Risk Level:</span>
                                    <span className={`font-medium capitalize ${
                                      aiAnalysisResults.violation_prevention.risk_level === 'low' ? 'text-green-600' :
                                      aiAnalysisResults.violation_prevention.risk_level === 'medium' ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                      {aiAnalysisResults.violation_prevention.risk_level}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm">Effectiveness:</span>
                                    <span className="font-medium">
                                      {Math.round(aiAnalysisResults.violation_prevention.prevention_effectiveness * 100)}%
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Secondary Recommendations */}
                          {analysisRecommendations.length > 0 && (
                            <div className="p-3 bg-green-50 rounded border border-green-200">
                              <h6 className="font-medium text-sm text-green-800 mb-2">💡 Secondary Camera Tips</h6>
                              <ul className="text-sm text-green-700 space-y-1">
                                {analysisRecommendations.slice(0, 2).map((rec, index) => (
                                  <li key={index} className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col space-y-4 mt-6">
                  <div className="flex space-x-4">
                    <Button onClick={handleValidate} variant="default">
                      Validate Setup
                    </Button>
                    <Button onClick={handleComplete} variant="outline">
                      Complete Setup
                    </Button>
                    <Button 
                      onClick={() => {
                        console.log('[TEST] Manually triggering secondary camera violations');
                        console.log('[TEST] Current overlayDismissedAt before reset:', overlayDismissedAt);
                        console.log('[TEST] Current showUnifiedViolationOverlay before reset:', showUnifiedViolationOverlay);
                        
                        // Reset dismissal state first
                        setOverlayDismissedAt(null);
                        
                        // Set violations
                        setSecondaryCameraViolations([
                          { type: 'hands_not_visible', message: 'Manual test: Hands not visible' },
                          { type: 'keyboard_not_visible', message: 'Manual test: Keyboard not visible' }
                        ]);
                        
                        // Force show overlay
                        setShowUnifiedViolationOverlay(true);
                        
                        console.log('[TEST] After setting - overlayDismissedAt:', null);
                        console.log('[TEST] After setting - showUnifiedViolationOverlay:', true);
                      }}
                      variant="outline"
                      className="border-red-500 text-red-600 hover:bg-red-50"
                    >
                      🧪 Test Secondary Violations
                    </Button>
                    <Button 
                      onClick={() => {
                        console.log('[RESET] Resetting overlay dismissal state');
                        setOverlayDismissedAt(null);
                        setShowUnifiedViolationOverlay(false);
                        setSecondaryCameraViolations([]);
                        setPrimaryCameraViolations([]);
                        console.log('[RESET] All violation states cleared');
                      }}
                      variant="outline"
                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      🔄 Reset Overlay State
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {error && setupStep !== SetupStep.SHOW_QR && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {!showQRCode && !isRequired && (
        <div className="flex justify-end">
          <Button onClick={handleSkip} variant="outline">
            Skip
          </Button>
        </div>
      )}

      {/* Unified Violation Overlay */}
      {showUnifiedViolationOverlay && setupStep === SetupStep.MOBILE_CONNECTED && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4 overflow-y-auto"
          onClick={(e) => {
            // Close if clicking on backdrop
            if (e.target === e.currentTarget) {
              setShowUnifiedViolationOverlay(false);
              setOverlayDismissedAt(Date.now());
            }
          }}
          onKeyDown={(e) => {
            // Close on Escape key
            if (e.key === 'Escape') {
              setShowUnifiedViolationOverlay(false);
              setOverlayDismissedAt(Date.now());
            }
          }}
          tabIndex={0}
        >
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-auto shadow-2xl max-h-[90vh] overflow-y-auto my-8"
               onClick={(e) => e.stopPropagation()}>
            {/* Close button in top-right corner */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  setShowUnifiedViolationOverlay(false);
                  setOverlayDismissedAt(Date.now());
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="text-center">
              {/* Dynamic header based on violation types */}
              {primaryCameraViolations.length > 0 && secondaryCameraViolations.length > 0 ? (
                // Both cameras have violations
                <>
                  <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-12 h-12 text-red-600" />
                  </div>
                  <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium mb-4">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Multiple Camera Issues Detected
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Camera Setup Issues Detected
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Both your primary and secondary cameras have detected issues that need to be resolved.
                  </p>
                </>
              ) : primaryCameraViolations.length > 0 ? (
                // Only primary camera has violations
                (() => {
                  // Determine the primary violation type to show appropriate message
                  const primaryViolation = primaryCameraViolations[0];
                  const isNoFaceViolation = primaryViolation?.type === 'no_face';
                  const isProhibitedDeviceViolation = primaryViolation?.type === 'prohibited_device' || 
                    primaryViolation?.type === 'object_detected' ||
                    (!isNoFaceViolation && primaryViolation?.message?.toLowerCase().includes('prohibited'));
                  
                  return (
                    <>
                      <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-12 h-12 text-red-600" />
                      </div>
                      <div className="inline-flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium mb-4">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Primary Camera Violation
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">
                        {isNoFaceViolation ? 'No Face Detected' : 'Prohibited Device Detected'}
                      </h2>
                      <p className="text-gray-600 mb-6">
                        {isNoFaceViolation 
                          ? 'Your face is not visible in the primary camera. Please ensure you are positioned correctly in front of the camera.'
                          : 'Your primary camera has detected a prohibited device in the frame.'
                        }
                      </p>
                    </>
                  );
                })()
              ) : (
                // Only secondary camera has violations
                <>
                  <img 
                    src="/images/secondary-camera-violation-overlay.svg" 
                    alt="Secondary Camera Setup Guide"
                    className="w-full max-w-md mx-auto mb-6"
                  />
                  <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
                    <Check className="w-4 h-4 mr-2" />
                    Secondary Camera
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Please Position Your Secondary Camera
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Your secondary camera needs to show your face and workspace clearly for proper monitoring.
                  </p>
                </>
              )}

              <div className="space-y-4">
                {/* Primary Camera Violations */}
                {primaryCameraViolations.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                    <h3 className="font-semibold text-red-800 mb-2 flex items-center">
                      📹 Primary Camera Issues:
                    </h3>
                    <ul className="space-y-1">
                      {primaryCameraViolations.map((violation, index) => (
                        <li key={`primary-${index}`} className="text-sm text-red-700 flex items-start">
                          <span className="text-red-500 mr-2">•</span>
                          {violation.message || violation.type}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Secondary Camera Violations */}
                {secondaryCameraViolations.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
                    <h3 className="font-semibold text-orange-800 mb-2 flex items-center">
                      📱 Secondary Camera Issues:
                    </h3>
                    <ul className="space-y-1">
                      {secondaryCameraViolations.map((violation, index) => (
                        <li key={`secondary-${index}`} className="text-sm text-orange-700 flex items-start">
                          <span className="text-orange-500 mr-2">•</span>
                          {violation.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Combined Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                  <h3 className="font-semibold text-blue-800 mb-2">Required Actions:</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {primaryCameraViolations.length > 0 && (() => {
                      const primaryViolation = primaryCameraViolations[0];
                      const isNoFaceViolation = primaryViolation?.type === 'no_face';
                      
                      if (isNoFaceViolation) {
                        return (
                          <>
                            <li className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              Position yourself directly in front of the primary camera
                            </li>
                            <li className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              Ensure adequate lighting so your face is clearly visible
                            </li>
                            <li className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              Remove any objects that may be blocking your face
                            </li>
                          </>
                        );
                      } else {
                        return (
                          <>
                            <li className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              Remove all mobile phones and electronic devices from primary camera view
                            </li>
                            <li className="flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              Keep prohibited devices out of reach during the test
                            </li>
                          </>
                        );
                      }
                    })()}
                    {secondaryCameraViolations.length > 0 && (
                      <>
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          Position your secondary camera to show your hands and keyboard clearly
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          Ensure your workspace is visible in the secondary camera
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          Make sure the camera angle captures your typing area
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                <Button 
                  onClick={() => {
                    setShowUnifiedViolationOverlay(false);
                    setOverlayDismissedAt(Date.now());
                  }}
                  className={`mt-6 px-8 py-2 text-white ${
                    primaryCameraViolations.length > 0 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  I'll Fix These Issues
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ThirdCameraSetup;
