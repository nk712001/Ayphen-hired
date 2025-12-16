import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Camera, Check, RefreshCw, Smartphone, Activity, Wifi, WifiOff } from 'lucide-react';
import SimpleQRCode from '@/components/ui/simple-qr-code';
import { v4 as uuidv4 } from 'uuid';
import { MobileStreamManager, type ConnectionMetrics, type MobileStreamConfig } from '@/lib/mobile-stream-manager';
import { ensureValidSessionId, generateSessionId, storeSessionId, clearSessionData } from '@/lib/session-id-utils';

// Using centralized session ID utilities from @/lib/session-id-utils

interface EnhancedThirdCameraSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
  isRequired?: boolean;
}

enum SetupStep {
  INIT = 'init',
  PRIMARY_CAMERA = 'primary_camera',
  SHOW_QR = 'show_qr',
  MOBILE_CONNECTING = 'mobile_connecting',
  DUAL_STREAMING = 'dual_streaming',
  VALIDATE = 'validate',
  COMPLETE = 'complete',
}

const EnhancedThirdCameraSetup: React.FC<EnhancedThirdCameraSetupProps> = ({
  onComplete,
  onSkip,
  isRequired = false,
}) => {
  // Refs for video elements and canvases
  const primaryVideoRef = useRef<HTMLVideoElement>(null);
  const primaryStreamRef = useRef<MediaStream | null>(null);
  const primaryCanvasRef = useRef<HTMLCanvasElement>(null);
  const secondaryCanvasRef = useRef<HTMLCanvasElement>(null);
  const isMountedRef = useRef(true);

  // State management
  const [setupStep, setSetupStep] = useState<SetupStep>(SetupStep.INIT);
  const [error, setError] = useState<string>('');
  const [networkIp, setNetworkIp] = useState<string>('');
  
  // Mobile session management with centralized utilities
  const [mobileSessionId, setMobileSessionId] = useState<string>(() => {
    console.log('[Enhanced Setup] Initializing mobile session ID with centralized utilities...');
    
    // Force clear ALL mobile-related localStorage to start fresh
    if (typeof window !== 'undefined') {
      clearSessionData();
    }
    
    // Generate new session ID using centralized utility
    const newId = generateSessionId('enhanced-setup');
    
    console.log('[Enhanced Setup] Generated FRESH session ID:', {
      id: newId,
      length: newId.length,
      type: typeof newId
    });
    
    // Store using centralized utility
    if (typeof window !== 'undefined') {
      storeSessionId(newId, 'mobileSessionId');
    }
    
    return newId;
  });

  // Session ID regeneration function
  const regenerateSessionId = useCallback(() => {
    console.log('[Enhanced Setup] Regenerating session ID due to corruption...');
    
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 15);
    const newId = `${uuidv4()}-${timestamp}-${randomPart}`;
    
    console.log('[Enhanced Setup] New regenerated session ID:', newId);
    
    // Update state
    setMobileSessionId(newId);
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mobileSessionId', newId);
        console.log('[Enhanced Setup] Regenerated session ID stored');
      } catch (error) {
        console.error('[Enhanced Setup] Failed to store regenerated session ID:', error);
      }
    }
    
    return newId;
  }, []);

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [mobileStreamManager, setMobileStreamManager] = useState<MobileStreamManager | null>(null);
  const [connectionMetrics, setConnectionMetrics] = useState<ConnectionMetrics>({
    connected: false,
    frameRate: 0,
    latency: 0,
    droppedFrames: 0,
    totalFrames: 0,
    connectionTime: 0,
    lastFrameReceived: 0
  });
  const [isDualStreaming, setIsDualStreaming] = useState(false);

  // Enhanced debug effect to monitor and fix session ID corruption
  useEffect(() => {
    console.log('[Enhanced Setup] Session ID state monitoring:', {
      sessionId: mobileSessionId,
      type: typeof mobileSessionId,
      length: mobileSessionId?.length,
      isNullString: mobileSessionId === 'null',
      isUndefinedString: mobileSessionId === 'undefined'
    });
    
    // Use utility function to ensure session ID is always valid
    const sessionResult = ensureValidSessionId(mobileSessionId, 'enhanced-monitor');
    
    if (!sessionResult.isValid) {
      console.error('[Enhanced Setup] INVALID SESSION ID DETECTED - Fixing immediately!');
      console.error('[Enhanced Setup] Current invalid session ID details:', {
        value: mobileSessionId,
        type: typeof mobileSessionId,
        length: mobileSessionId?.length,
        stringified: JSON.stringify(mobileSessionId),
        reason: sessionResult.reason
      });
      
      console.log('[Enhanced Setup] Using emergency session ID:', sessionResult.sessionId);
      setMobileSessionId(sessionResult.sessionId);
      
      // Also store in localStorage immediately
      if (typeof window !== 'undefined') {
        storeSessionId(sessionResult.sessionId, 'mobileSessionId');
      }
      
      return;
    }
    
    // Check localStorage consistency and fix if needed
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem('mobileSessionId');
      console.log('[Enhanced Setup] localStorage consistency check:', {
        state: mobileSessionId,
        localStorage: storedId,
        match: storedId === mobileSessionId
      });
      
      if (storedId !== mobileSessionId) {
        console.warn('[Enhanced Setup] Session ID mismatch - fixing localStorage');
        try {
          localStorage.setItem('mobileSessionId', mobileSessionId);
          console.log('[Enhanced Setup] localStorage fixed with current state value');
        } catch (error) {
          console.error('[Enhanced Setup] Failed to fix localStorage:', error);
        }
      }
    }
  }, [mobileSessionId, regenerateSessionId]);

  // Initialize primary camera
  const initializePrimaryCamera = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[Enhanced Setup] Initializing primary camera');
      
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          frameRate: { ideal: 30 }
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      primaryStreamRef.current = stream;

      if (primaryVideoRef.current) {
        primaryVideoRef.current.srcObject = stream;
      }

      console.log('[Enhanced Setup] Primary camera initialized successfully');
      return true;
    } catch (err: any) {
      console.error('[Enhanced Setup] Primary camera initialization failed:', err);
      setError(`Failed to access primary camera: ${err.message}`);
      return false;
    }
  }, []);

  // Generate enhanced QR code URL with comprehensive validation
  const generateQRCode = useCallback((): string => {
    console.log('[Enhanced Setup] Starting QR code generation...');
    
    // Ensure we have a valid session ID for QR code generation
    const sessionResult = ensureValidSessionId(mobileSessionId, 'qr-generation');
    
    if (!sessionResult.isValid) {
      console.log('[Enhanced Setup] Session ID was invalid for QR code, using emergency ID:', sessionResult.sessionId);
      setMobileSessionId(sessionResult.sessionId);
      
      // Store the valid session ID
      if (typeof window !== 'undefined') {
        storeSessionId(sessionResult.sessionId, 'mobileSessionId');
      }
    }
    
    const validSessionId = sessionResult.sessionId;
    console.log('[Enhanced Setup] Generating QR code for enhanced mobile camera with valid session ID:', validSessionId);
    
    let baseUrl;
    if (networkIp) {
      baseUrl = `${window.location.protocol}//${networkIp}:${window.location.port || '3000'}`;
    } else {
      baseUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
    }
    
    // Use enhanced mobile camera page with validated session ID
    const enhancedUrl = `${baseUrl}/mobile-camera-enhanced?sessionId=${encodeURIComponent(validSessionId)}`;
    
    console.log('[Enhanced Setup] Generated enhanced QR code URL:', {
      url: enhancedUrl,
      sessionId: validSessionId,
      encoded: encodeURIComponent(validSessionId)
    });
    
    setQrCodeUrl(enhancedUrl);
    return enhancedUrl;
  }, [mobileSessionId, networkIp, regenerateSessionId]);

  // Get network IP
  const getNetworkIp = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch('/api/network-ip');
      if (response.ok) {
        const data = await response.json();
        console.log('[Enhanced Setup] Network IP fetched:', data.ip);
        setNetworkIp(data.ip);
        return data.ip;
      }
    } catch (error) {
      console.error('[Enhanced Setup] Error getting network IP:', error);
    }
    return '';
  }, []);

  // Initialize mobile stream manager
  const initializeMobileStreamManager = useCallback((): void => {
    if (mobileStreamManager) {
      console.log('[Enhanced Setup] Mobile stream manager already initialized');
      return;
    }

    console.log('[Enhanced Setup] Initializing mobile stream manager...');
    
    // Ensure we have a valid session ID for stream manager
    const sessionResult = ensureValidSessionId(mobileSessionId, 'stream-manager');
    
    if (!sessionResult.isValid) {
      console.log('[Enhanced Setup] Session ID was invalid for stream manager, using emergency ID:', sessionResult.sessionId);
      setMobileSessionId(sessionResult.sessionId);
      
      // Store the valid session ID
      if (typeof window !== 'undefined') {
        storeSessionId(sessionResult.sessionId, 'mobileSessionId');
      }
    }
    
    const config: MobileStreamConfig = {
      sessionId: sessionResult.sessionId,
      targetFPS: 30,
      maxRetries: 10,
      reconnectDelay: 2000,
      frameTimeout: 5000,
      qualitySettings: {
        width: 640,
        height: 480,
        compression: 0.8
      }
    };
    
    console.log('[Enhanced Setup] Mobile stream manager config created:', config);

    const manager = new MobileStreamManager(config);
    
    // Set up event handlers
    manager.setEventHandlers({
      onConnectionChange: (connected: boolean) => {
        console.log('[Enhanced Setup] Mobile connection changed:', connected);
        
        if (connected && setupStep === SetupStep.MOBILE_CONNECTING) {
          console.log('[Enhanced Setup] Mobile connected, starting dual streaming at 30 FPS');
          setSetupStep(SetupStep.DUAL_STREAMING);
          setIsDualStreaming(true);
          
          // Ensure secondary canvas is registered for streaming
          if (secondaryCanvasRef.current && manager) {
            try {
              manager.registerStreamWindow('secondary', secondaryCanvasRef.current);
              console.log('[Enhanced Setup] Re-registered secondary canvas for dual streaming');
            } catch (error) {
              console.error('[Enhanced Setup] Failed to re-register secondary canvas:', error);
            }
          }
        } else if (!connected && isDualStreaming) {
          console.log('[Enhanced Setup] Mobile disconnected, stopping dual streaming');
          setIsDualStreaming(false);
        }
      },
      onMetricsUpdate: (metrics: ConnectionMetrics) => {
        setConnectionMetrics(metrics);
        console.log('[Enhanced Setup] Connection metrics updated (30 FPS target):', {
          ...metrics,
          targetFPS: 30,
          actualFPS: metrics.frameRate
        });
      },
      onError: (error: string) => {
        console.error('[Enhanced Setup] Mobile stream manager error:', error);
        setError(`Mobile connection error: ${error}`);
      }
    });

    // Register stream windows for dual streaming with validation
    if (primaryCanvasRef.current) {
      try {
        manager.registerStreamWindow('primary', primaryCanvasRef.current);
        console.log('[Enhanced Setup] Successfully registered primary stream window');
      } catch (error) {
        console.error('[Enhanced Setup] Failed to register primary stream window:', error);
      }
    } else {
      console.warn('[Enhanced Setup] Primary canvas ref not available for registration');
    }
    
    if (secondaryCanvasRef.current) {
      try {
        manager.registerStreamWindow('secondary', secondaryCanvasRef.current);
        console.log('[Enhanced Setup] Successfully registered secondary stream window for 30 FPS streaming');
      } catch (error) {
        console.error('[Enhanced Setup] Failed to register secondary stream window:', error);
      }
    } else {
      console.warn('[Enhanced Setup] Secondary canvas ref not available for registration');
    }

    setMobileStreamManager(manager);
  }, [mobileSessionId, mobileStreamManager, setupStep, regenerateSessionId]);

  // Handle QR code display
  const handleShowQRCode = useCallback((): void => {
    console.log('[Enhanced Setup] ===== BUTTON CLICKED - SHOWING QR CODE =====');
    console.log('[Enhanced Setup] Current setup step:', setupStep);
    console.log('[Enhanced Setup] Mobile session ID:', mobileSessionId);
    
    try {
      // Stop primary camera
      if (primaryStreamRef.current) {
        console.log('[Enhanced Setup] Stopping primary camera stream');
        primaryStreamRef.current.getTracks().forEach(track => track.stop());
        primaryStreamRef.current = null;
        
        if (primaryVideoRef.current) {
          primaryVideoRef.current.srcObject = null;
        }
      }
      
      // Generate QR code
      console.log('[Enhanced Setup] Generating QR code...');
      generateQRCode();
      
      // Initialize mobile stream manager
      console.log('[Enhanced Setup] Initializing mobile stream manager...');
      initializeMobileStreamManager();
      
      console.log('[Enhanced Setup] Setting setup step to SHOW_QR');
      setSetupStep(SetupStep.SHOW_QR);
      
      console.log('[Enhanced Setup] ===== QR CODE SETUP COMPLETE =====');
    } catch (error) {
      console.error('[Enhanced Setup] Error in handleShowQRCode:', error);
      setError(`Failed to show QR code: ${error}`);
    }
  }, [generateQRCode, initializeMobileStreamManager, setupStep, mobileSessionId]);

  // Handle validation and completion
  const handleValidate = useCallback((): void => {
    setSetupStep(SetupStep.VALIDATE);
    
    // Simulate validation process
    setTimeout(() => {
      setSetupStep(SetupStep.COMPLETE);
      onComplete();
    }, 2000);
  }, [onComplete]);

  // Initialize component
  useEffect(() => {
    console.log('[Enhanced Setup] ===== COMPONENT INITIALIZATION =====');
    console.log('[Enhanced Setup] Current setup step:', setupStep);
    console.log('[Enhanced Setup] Mobile session ID:', mobileSessionId);
    
    isMountedRef.current = true;
    
    // Get network IP
    getNetworkIp();
    
    // Initialize primary camera if not showing QR
    if (setupStep === SetupStep.INIT) {
      console.log('[Enhanced Setup] Initializing primary camera...');
      initializePrimaryCamera().then(success => {
        console.log('[Enhanced Setup] Primary camera initialization result:', success);
        if (success) {
          console.log('[Enhanced Setup] Setting setup step to PRIMARY_CAMERA');
          setSetupStep(SetupStep.PRIMARY_CAMERA);
        } else {
          console.error('[Enhanced Setup] Primary camera initialization failed');
        }
      });
    } else {
      console.log('[Enhanced Setup] Skipping camera initialization, current step:', setupStep);
    }
    
    return () => {
      isMountedRef.current = false;
      
      // Cleanup
      if (primaryStreamRef.current) {
        primaryStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (mobileStreamManager) {
        mobileStreamManager.destroy();
      }
    };
  }, []);

  // Monitor mobile connection when QR is shown
  useEffect(() => {
    if (setupStep === SetupStep.SHOW_QR && mobileStreamManager) {
      console.log('[Enhanced Setup] Starting mobile connection monitoring');
      setSetupStep(SetupStep.MOBILE_CONNECTING);
      
      // Start enhanced polling for connection with session ID validation
      const pollInterval = setInterval(async () => {
        try {
          // Ensure we have a valid session ID before polling
          const sessionResult = ensureValidSessionId(mobileSessionId, 'polling');
          
          if (!sessionResult.isValid) {
            console.log('[Enhanced Setup] Session ID was invalid, using emergency ID for polling:', sessionResult.sessionId);
            setMobileSessionId(sessionResult.sessionId);
            
            // Store the valid session ID
            if (typeof window !== 'undefined') {
              storeSessionId(sessionResult.sessionId, 'mobileSessionId');
            }
          }
          
          const validSessionId = sessionResult.sessionId;
          console.log(`[Enhanced Setup] Polling for mobile connection with VALID session ID: ${validSessionId}`);
          
          // COMPREHENSIVE URL DEBUGGING
          const pollUrl = `/api/setup/check-mobile-camera?sessionId=${encodeURIComponent(validSessionId)}&enhanced=true&t=${Date.now()}`;
          console.log('[Enhanced Setup] ===== POLLING URL DEBUG START =====');
          console.log('[Enhanced Setup] Original sessionId:', validSessionId);
          console.log('[Enhanced Setup] Encoded sessionId:', encodeURIComponent(validSessionId));
          console.log('[Enhanced Setup] Full polling URL:', pollUrl);
          console.log('[Enhanced Setup] URL object test:', new URL(pollUrl, window.location.origin));
          console.log('[Enhanced Setup] ===== POLLING URL DEBUG END =====');
          
          const response = await fetch(
            pollUrl,
            { 
              headers: { 
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              } 
            }
          );
          
          if (response.ok) {
            const result = await response.json();
            console.log('[Enhanced Setup] Connection poll result:', result);
            
            if (result.connected) {
              console.log('[Enhanced Setup] Mobile connected! Transitioning to dual streaming at 30 FPS');
              clearInterval(pollInterval);
              setSetupStep(SetupStep.DUAL_STREAMING);
              setIsDualStreaming(true);
              
              // Register stream windows with manager for 30 FPS streaming
              if (mobileStreamManager) {
                if (primaryCanvasRef.current) {
                  try {
                    mobileStreamManager.registerStreamWindow('primary', primaryCanvasRef.current);
                    console.log('[Enhanced Setup] Primary canvas registered for dual streaming');
                  } catch (error) {
                    console.error('[Enhanced Setup] Failed to register primary canvas:', error);
                  }
                }
                if (secondaryCanvasRef.current) {
                  try {
                    mobileStreamManager.registerStreamWindow('secondary', secondaryCanvasRef.current);
                    console.log('[Enhanced Setup] Secondary canvas registered for 30 FPS streaming');
                  } catch (error) {
                    console.error('[Enhanced Setup] Failed to register secondary canvas:', error);
                  }
                }
              } else {
                console.error('[Enhanced Setup] Mobile stream manager not available for canvas registration');
              }
            }
          } else {
            const errorText = await response.text();
            console.warn(`[Enhanced Setup] Connection poll failed: ${response.status} - ${errorText}`);
            
            // If we get a session ID error, regenerate
            if (response.status === 400 && errorText.includes('session')) {
              console.error('[Enhanced Setup] Session ID error during polling, regenerating...');
              regenerateSessionId();
            }
          }
        } catch (error) {
          console.warn('[Enhanced Setup] Connection poll error:', error);
        }
      }, 1500); // Poll every 1.5 seconds for faster detection
      
      // Cleanup polling on unmount or step change
      return () => clearInterval(pollInterval);
    }
    
    // Return undefined for other cases
    return undefined;
  }, [setupStep, mobileStreamManager, mobileSessionId, regenerateSessionId]);

  // Render QR code section
  const renderQRCodeSection = (): JSX.Element => (
    <div className="flex flex-col items-center space-y-6 p-6 border-4 border-blue-600 rounded-lg bg-blue-50 shadow-lg">
      <h3 className="text-xl font-bold text-blue-800 flex items-center justify-center">
        {connectionMetrics.connected ? (
          <>
            <span className="bg-green-500 w-3 h-3 rounded-full mr-2 animate-pulse"></span>
            Enhanced Mobile Connected! 30 FPS Streaming Active
          </>
        ) : (
          <>
            <Smartphone className="h-5 w-5 mr-2" />
            Scan for Enhanced 30 FPS Mobile Camera
          </>
        )}
      </h3>

      {/* QR Code */}
      <div className="bg-white p-6 rounded-lg border-2 border-blue-400 shadow-md">
        {qrCodeUrl ? (
          <div className="relative">
            <SimpleQRCode value={qrCodeUrl} size={250} />
            <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Enhanced 30 FPS
            </div>
          </div>
        ) : (
          <div className="w-[250px] h-[250px] flex items-center justify-center bg-gray-100 rounded-md">
            <p className="text-sm text-gray-500">Generating enhanced QR code...</p>
          </div>
        )}
      </div>

      {/* Connection Status */}
      <div className="w-full max-w-md bg-white rounded-lg p-4 border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-3">Connection Status</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span>Status:</span>
            <div className="flex items-center">
              {connectionMetrics.connected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-gray-500 mr-1" />
                  <span className="text-gray-600">Waiting...</span>
                </>
              )}
            </div>
          </div>
          
          {connectionMetrics.connected && (
            <>
              <div className="flex justify-between">
                <span>Frame Rate:</span>
                <span className="font-mono">{connectionMetrics.frameRate.toFixed(1)} FPS</span>
              </div>
              <div className="flex justify-between">
                <span>Latency:</span>
                <span className="font-mono">{connectionMetrics.latency}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Total Frames:</span>
                <span className="font-mono">{connectionMetrics.totalFrames}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Network Information */}
      <div className="w-full max-w-md bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold">Network IP:</span>
          <Button 
            onClick={async () => {
              const ip = await getNetworkIp();
              if (ip) generateQRCode();
            }} 
            variant="outline" 
            size="sm"
            className="h-7 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh
          </Button>
        </div>
        {networkIp ? (
          <div className="bg-white p-2 rounded border border-blue-100 text-center font-mono">
            {networkIp}
          </div>
        ) : (
          <div className="text-center text-red-500">
            Not detected - Enhanced features may not work!
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-blue-700 max-w-md">
        <p className="mb-2">
          Scan this QR code with your mobile device to connect as a secondary camera with enhanced 30 FPS streaming.
        </p>
        <p className="text-xs text-blue-600">
          The enhanced mobile camera will automatically connect and start streaming at 30 FPS to both display windows.
        </p>
      </div>
    </div>
  );

  // Render dual streaming view
  const renderDualStreamingView = (): JSX.Element => (
    <div className="flex flex-col items-center space-y-6">
      <div className="flex items-center space-x-2 text-green-600">
        <Activity className="h-5 w-5 animate-pulse" />
        <span className="font-semibold">Dual Window Streaming Active (30 FPS)</span>
      </div>

      {/* Dual camera feeds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Primary camera feed */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={primaryVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas
            ref={primaryCanvasRef}
            className="absolute inset-0 w-full h-full object-cover opacity-0"
          />
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            Primary Camera
          </div>
        </div>
        
        {/* Secondary camera feed (mobile) */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <canvas
            ref={secondaryCanvasRef}
            className="w-full h-full object-cover"
            width={640}
            height={480}
          />
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
            Mobile Camera (30 FPS)
          </div>
          
          {/* Performance overlay */}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {connectionMetrics.frameRate.toFixed(1)} FPS | {connectionMetrics.latency}ms
          </div>
        </div>
      </div>

      {/* Streaming metrics */}
      <div className="w-full max-w-2xl bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">Streaming Performance</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{connectionMetrics.frameRate.toFixed(1)}</div>
            <div className="text-gray-600">FPS</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{connectionMetrics.latency}</div>
            <div className="text-gray-600">Latency (ms)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{connectionMetrics.totalFrames}</div>
            <div className="text-gray-600">Total Frames</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{connectionMetrics.droppedFrames}</div>
            <div className="text-gray-600">Dropped</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex space-x-4">
        <Button onClick={handleShowQRCode} variant="outline">
          Reconnect Mobile
        </Button>
        <Button onClick={handleValidate} className="bg-green-600 hover:bg-green-700">
          Validate & Continue
        </Button>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Enhanced Secondary Camera Setup</h2>
        <p className="text-muted-foreground">
          Connect your mobile device as a secondary camera with enhanced 30 FPS dual window streaming.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6">
            {/* Primary camera view */}
            {setupStep === SetupStep.PRIMARY_CAMERA && (
              <div className="flex flex-col items-center space-y-4">
                <div className="text-center mb-2">
                  <p className="text-sm text-gray-600">Current step: {setupStep}</p>
                  <p className="text-xs text-gray-500">Session ID: {mobileSessionId}</p>
                </div>
                <div className="relative w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden mb-4">
                  <video
                    ref={primaryVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    Primary Camera
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    console.log('[Enhanced Setup] Button clicked!');
                    handleShowQRCode();
                  }} 
                  variant="default"
                  className="w-full max-w-md"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Connect Enhanced Mobile Camera (30 FPS)
                </Button>
                <div className="text-center mt-2">
                  <p className="text-xs text-gray-500">Click the button above to show QR code</p>
                </div>
              </div>
            )}

            {/* QR Code section */}
            {(setupStep === SetupStep.SHOW_QR || setupStep === SetupStep.MOBILE_CONNECTING) && (
              renderQRCodeSection()
            )}

            {/* Dual streaming view */}
            {setupStep === SetupStep.DUAL_STREAMING && renderDualStreamingView()}

            {/* Validation step */}
            {setupStep === SetupStep.VALIDATE && (
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-center">Validating enhanced camera setup...</p>
              </div>
            )}

            {/* Error display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skip option */}
      {!isRequired && setupStep !== SetupStep.DUAL_STREAMING && (
        <div className="flex justify-end">
          <Button onClick={onSkip} variant="outline">
            Skip Enhanced Setup
          </Button>
        </div>
      )}
    </div>
  );
};

export default EnhancedThirdCameraSetup;
