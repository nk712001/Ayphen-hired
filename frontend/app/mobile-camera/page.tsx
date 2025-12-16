'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';
import { Camera, Check, AlertCircle, Smartphone, Lock, Globe, FlipHorizontal } from 'lucide-react';
import { initializeSessionId } from '@/lib/session-id-utils';

// Declare global types for our intervals
declare global {
  interface Window {
    backupIntervals?: Record<string, NodeJS.Timeout>;
  }
}

export default function MobileCameraPage() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [shouldRedirectToEnhanced, setShouldRedirectToEnhanced] = useState(false);

  useEffect(() => {
    console.log('[Mobile Camera] ===== SESSION ID INITIALIZATION START =====');
    console.log('[Mobile Camera] Page loaded, checking for session ID');
    console.log('[Mobile Camera] Search params:', searchParams?.toString());
    console.log('[Mobile Camera] Current URL:', window.location.href);
    console.log('[Mobile Camera] Window location search:', window.location.search);

    // AGGRESSIVE: Extract session ID from multiple sources
    let finalSessionId: string | null = null;

    // Method 1: Direct URL search params
    if (searchParams) {
      const urlSessionId = searchParams.get('sessionId');
      console.log('[Mobile Camera] Method 1 - searchParams.get(sessionId):', urlSessionId);

      if (urlSessionId && urlSessionId !== 'null' && urlSessionId !== 'undefined' && urlSessionId.length >= 36) {
        console.log('[Mobile Camera] ✅ USING SESSION ID FROM QR CODE URL:', urlSessionId);
        finalSessionId = urlSessionId;
      }
    }

    // Method 2: Direct window.location parsing as backup
    if (!finalSessionId) {
      const urlParams = new URLSearchParams(window.location.search);
      const windowSessionId = urlParams.get('sessionId');
      console.log('[Mobile Camera] Method 2 - window.location sessionId:', windowSessionId);

      if (windowSessionId && windowSessionId !== 'null' && windowSessionId !== 'undefined' && windowSessionId.length >= 36) {
        console.log('[Mobile Camera] ✅ USING SESSION ID FROM WINDOW LOCATION:', windowSessionId);
        finalSessionId = windowSessionId;
      }
    }

    // Method 3: Extract from full URL as last resort
    if (!finalSessionId) {
      const fullUrl = window.location.href;
      const sessionMatch = fullUrl.match(/sessionId=([^&]+)/);
      if (sessionMatch && sessionMatch[1]) {
        const extractedSessionId = sessionMatch[1];
        console.log('[Mobile Camera] Method 3 - extracted from URL:', extractedSessionId);

        if (extractedSessionId !== 'null' && extractedSessionId !== 'undefined' && extractedSessionId.length >= 36) {
          console.log('[Mobile Camera] ✅ USING SESSION ID FROM URL EXTRACTION:', extractedSessionId);
          finalSessionId = extractedSessionId;
        }
      }
    }

    // Store the QR code session ID immediately
    if (finalSessionId) {
      try {
        // Clear any existing session data first
        localStorage.removeItem('mobileSessionId');
        localStorage.setItem('mobileSessionId', finalSessionId);
        console.log('[Mobile Camera] ✅ STORED QR CODE SESSION ID:', finalSessionId);

        // Verify storage
        const stored = localStorage.getItem('mobileSessionId');
        console.log('[Mobile Camera] Verification - stored session ID:', stored);
      } catch (e) {
        console.error('[Mobile Camera] ❌ Failed to store session ID:', e);
      }
    }

    // ONLY use fallback if absolutely no session ID found in URL
    if (!finalSessionId) {
      console.log('[Mobile Camera] ⚠️ NO URL SESSION ID FOUND - Using emergency fallback');
      console.log('[Mobile Camera] This should NOT happen if QR code was scanned properly');

      // Generate emergency session ID but log it as an error
      finalSessionId = `emergency-qr-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      console.error('[Mobile Camera] ❌ EMERGENCY SESSION ID GENERATED:', finalSessionId);
    }

    console.log('[Mobile Camera] ===== FINAL SESSION ID:', finalSessionId, '=====');
    setSessionId(finalSessionId);

    // Check if enhanced mode is requested
    const enhanced = searchParams?.get('enhanced') === 'true' ||
      searchParams?.get('fps') === '30';

    if (enhanced) {
      console.log('[Mobile Camera] Enhanced mode requested - using optimized settings');
    }
  }, [searchParams]);

  // Enhanced mode handling (no redirect needed)
  const isEnhancedMode = searchParams?.get('enhanced') === 'true' || searchParams?.get('fps') === '30';

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hasUserStartedCamera, setHasUserStartedCamera] = useState(false);
  const [isSecureContext, setIsSecureContext] = useState(false);
  const [isHttpProtocol, setIsHttpProtocol] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [framesSent, setFramesSent] = useState(0);
  const [currentFacingMode, setCurrentFacingMode] = useState<'user' | 'environment'>('environment');
  const [isFlipping, setIsFlipping] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Send connection status to the server
  const sendConnectionStatus = async (connected: boolean) => {
    // FIXED: Don't generate new session IDs, use the one from QR code
    if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
      console.error('[Mobile Camera] ❌ No valid session ID available for connection status');
      return false;
    }

    console.log('[Mobile Camera] Sending connection status with session ID:', sessionId);


    try {
      console.log(`[Mobile Camera] Sending connection status with session ID: ${sessionId}`);
      const response = await fetch('/api/setup/mobile-camera', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId,
          connected,
          timestamp: Date.now(),
          enhanced: isEnhancedMode
        }),
      });

      if (response.ok) {
        console.log(`Mobile camera connection status sent: ${connected}`);
        setIsConnected(connected);
        return true;
      } else {
        console.error('Failed to send connection status');
        return false;
      }
    } catch (error) {
      console.error('Error sending connection status:', error);
      return false;
    }
  };

  // Start the camera
  const startCamera = async (facingMode: 'user' | 'environment' = 'environment') => {
    try {
      // Request camera access with constraints
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 30 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCurrentFacingMode(facingMode);

      // Set the stream to the video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Send connection status to the server
      await sendConnectionStatus(true);

      return true;
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setError(`Error accessing camera: ${error.message}`);
      return false;
    }
  };

  // Handle camera start
  const handleStartCamera = async () => {
    console.log('[Mobile Camera] User explicitly started camera');
    setHasUserStartedCamera(true);
    const success = await startCamera();
    if (success) {
      setError(null);
    }
  };

  // Handle camera flip
  const handleFlipCamera = async () => {
    if (!stream || isFlipping) return;

    setIsFlipping(true);
    setError(null);

    // Store current stream as backup
    const backupStream = stream;
    const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';

    try {
      console.log(`[Mobile Camera] Flipping camera from ${currentFacingMode} to ${newFacingMode}`);

      // Request camera access with opposite facing mode
      const constraints = {
        video: {
          facingMode: newFacingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 30 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Only stop the old stream after we successfully get the new one
      if (backupStream) {
        backupStream.getTracks().forEach(track => track.stop());
      }

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCurrentFacingMode(newFacingMode);

      // Set the stream to the video element with a small delay to ensure proper loading
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        // Wait for the video to load before considering the flip complete
        await new Promise((resolve) => {
          const handleLoadedMetadata = () => {
            videoRef.current?.removeEventListener('loadedmetadata', handleLoadedMetadata);
            resolve(void 0);
          };
          videoRef.current?.addEventListener('loadedmetadata', handleLoadedMetadata);

          // Fallback timeout in case loadedmetadata doesn't fire
          setTimeout(resolve, 1000);
        });
      }

      console.log(`[Mobile Camera] Successfully flipped to ${newFacingMode} camera`);
    } catch (error: any) {
      console.error('Error flipping camera:', error);
      setError(`Error flipping camera: ${error.message}`);

      // Restore backup stream if flip failed
      if (backupStream && backupStream.active) {
        console.log('[Mobile Camera] Restoring backup stream after flip failure');
        streamRef.current = backupStream;
        setStream(backupStream);
        if (videoRef.current) {
          videoRef.current.srcObject = backupStream;
        }
      }
    } finally {
      setIsFlipping(false);
    }
  };

  // ...

  // Set up camera and connection status - ONLY after user starts camera
  useEffect(() => {
    let connectionIntervalId: NodeJS.Timeout | null = null;
    let frameIntervalId: NodeJS.Timeout | null = null;

    if (isConnected && sessionId && hasUserStartedCamera) {
      // Send connection status every 5 seconds
      connectionIntervalId = setInterval(async () => {
        await sendConnectionStatus(true);
        console.log('Sent periodic connection status update');
      }, 5000);

      // Track consecutive failures with a regular variable
      let failureCount = 0;

      // Create a more robust frame sending function
      const sendFrame = async () => {
        if (!videoRef.current || !videoRef.current.srcObject || !sessionId) return;

        // Use the session ID from QR code directly
        if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
          console.error('[Mobile Camera] ❌ No valid session ID for frame sending');
          return;
        }

        const validSessionId = sessionId;

        try {
          // Create a canvas to capture the current frame
          const canvas = document.createElement('canvas');
          const width = videoRef.current.videoWidth || 640;
          const height = videoRef.current.videoHeight || 480;
          canvas.width = width;
          canvas.height = height;

          // Draw the current video frame to the canvas
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Clear the canvas
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, width, height);

            // Draw the current video frame
            ctx.drawImage(videoRef.current, 0, 0, width, height);

            // Add a timestamp and device info
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.fillText(`${new Date().toLocaleTimeString()} | Mobile Camera | ${validSessionId}`, 10, height - 10);

            // Convert to base64 with lower quality for better performance
            const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
            const frameData = dataUrl.split(',')[1];

            // Use a controller to abort the request if it takes too long
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            try {
              // Add a random query param to prevent caching
              const randomParam = Math.random().toString(36).substring(2, 15);

              // Use the same protocol as the current page to avoid mixed content issues
              // But fall back to HTTP if needed for compatibility
              const baseUrl = window.location.hostname;
              const port = window.location.port || '3000';
              let protocol = window.location.protocol;

              // If we're on HTTPS but having issues, try HTTP as a fallback
              if (protocol === 'https:' && failureCount > 3) {
                protocol = 'http:';
                console.log('Switching to HTTP protocol after multiple failures');
              }

              // Log the session ID we're using
              console.log(`Using valid session ID for frame: ${validSessionId}`);

              const frameEndpoint = `/api/setup/mobile-frame/${encodeURIComponent(validSessionId)}?r=${randomParam}`;
              console.log(`Sending frame to ${frameEndpoint}`);

              // Send the frame directly to the frame endpoint
              // Use a relative URL to avoid protocol issues
              const frameResponse = await fetch(frameEndpoint, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Cache-Control': 'no-cache',
                },
                body: JSON.stringify({
                  frameData,
                  timestamp: Date.now()
                }),
                signal: controller.signal,
                mode: 'cors',
                credentials: 'omit'
              });

              clearTimeout(timeoutId);

              if (frameResponse.ok) {
                const data = await frameResponse.json();
                setFramesSent(data.frameCount || 0);
                failureCount = 0; // Reset failure count on success
                console.log('Frame sent successfully, count:', data.frameCount || 0);
              } else if (frameResponse.status === 429) {
                // Rate limited - back off
                console.log('Rate limited, backing off');
                // Skip a few frames to reduce pressure
                await new Promise(resolve => setTimeout(resolve, 2000));
              } else {
                console.error('Frame response not OK:', frameResponse.status, frameResponse.statusText);
                failureCount++;
              }
            } catch (error: any) {
              clearTimeout(timeoutId);
              if (error.name === 'AbortError') {
                console.log('Frame request timed out');
              } else {
                failureCount++;
                console.error('Error sending frame:', error);

                // If we've failed multiple times, try to re-establish connection
                if (failureCount > 5) {
                  console.log('Multiple failures detected, trying to re-establish connection');
                  await sendConnectionStatus(true);
                  failureCount = 0; // Reset after reconnection attempt
                }
              }
            }
          }
        } catch (e) {
          console.error('Error capturing frame:', e);
        }
      };

      // Start sending frames at regular intervals - enhanced mode uses higher FPS
      const frameIntervalMs = isEnhancedMode ? 100 : 500; // Enhanced: 10 FPS, Standard: 2 FPS
      const frameInterval = setInterval(() => {
        sendFrame();
      }, frameIntervalMs);

      console.log(`Started frame streaming at ${1000 / frameIntervalMs} FPS (${isEnhancedMode ? 'Enhanced' : 'Standard'} mode)`);

      // Add a backup interval in case the main one fails
      const backupIntervalId = setInterval(() => {
        console.log('Backup frame sender running');
        sendFrame();
      }, 2000); // Every 2 seconds as a backup

      // Store the backup interval for cleanup
      if (!window.backupIntervals) window.backupIntervals = {};
      window.backupIntervals[sessionId] = backupIntervalId;

      // Also set up a more aggressive heartbeat to keep the connection alive
      const heartbeatId = setInterval(async () => {
        if (isConnected && sessionId) {
          try {
            // Use the session ID from QR code directly
            if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
              console.error('[Mobile Camera] ❌ No valid session ID for heartbeat');
              return;
            }

            const validSessionId = sessionId;

            // Send a minimal heartbeat to keep the connection alive
            await fetch(`/api/setup/check-mobile-camera?sessionId=${encodeURIComponent(validSessionId)}&heartbeat=true&t=${Date.now()}`, {
              headers: { 'Cache-Control': 'no-cache' }
            });
            console.log('Heartbeat sent with valid session ID:', validSessionId);
          } catch (e) {
            console.warn('Heartbeat failed:', e);
          }
        }
      }, 5000); // Every 5 seconds

      // Clean up the heartbeat interval
      return () => {
        if (heartbeatId) clearInterval(heartbeatId);
        if (backupIntervalId) clearInterval(backupIntervalId);
        if (window.backupIntervals && sessionId) {
          delete window.backupIntervals[sessionId];
        }
      };
    }

    return () => {
      // Only clean up intervals, not the stream during normal operation
      if (connectionIntervalId) clearInterval(connectionIntervalId);
      if (frameIntervalId) clearInterval(frameIntervalId);

      // Clean up backup interval
      if (window.backupIntervals && sessionId && window.backupIntervals[sessionId]) {
        clearInterval(window.backupIntervals[sessionId]);
        delete window.backupIntervals[sessionId];
      }

      console.log('Mobile camera intervals cleaned up');
    };
  }, [isConnected, sessionId, hasUserStartedCamera]);

  useEffect(() => {
    // Always consider the connection secure for this specific page
    // This is a dedicated camera page, so we want to be as permissive as possible
    const secure = true;

    setIsSecureContext(secure);
    setIsHttpProtocol(window.location.protocol === 'http:');

    console.log('Mobile camera security check:', {
      isDevelopment,
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      sessionId,
      secureResult: secure
    });

    // Function to establish connection with retries - ONLY if user has started camera
    const establishConnection = async (retryCount = 0) => {
      if (!hasUserStartedCamera) {
        console.log('[Mobile Camera] Not auto-starting camera - waiting for user interaction');
        return;
      }

      try {
        // Try to start the camera
        const cameraSuccess = await startCamera();
        console.log('Camera start attempt result:', cameraSuccess);

        if (cameraSuccess) {
          // If camera started successfully, immediately send a connection status
          const connectionSuccess = await sendConnectionStatus(true);
          console.log('Initial connection status sent, success:', connectionSuccess);

          // Send a heartbeat immediately to establish connection
          try {
            // Use the session ID from QR code directly
            if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
              console.error('[Mobile Camera] ❌ No valid session ID for initial heartbeat');
              return;
            }

            const validSessionId = sessionId;

            console.log(`Sending initial heartbeat with session ID: ${validSessionId}`);
            const heartbeatResponse = await fetch(`/api/setup/check-mobile-camera?sessionId=${encodeURIComponent(validSessionId)}&heartbeat=true&t=${Date.now()}`, {
              headers: { 'Cache-Control': 'no-cache' }
            });
            console.log(`Initial heartbeat sent for session ${validSessionId}, status:`, heartbeatResponse.status);

            // Force a frame send immediately
            const canvas = document.createElement('canvas');
            if (videoRef.current) {
              canvas.width = videoRef.current.videoWidth || 640;
              canvas.height = videoRef.current.videoHeight || 480;
              const ctx = canvas.getContext('2d');
              if (ctx && videoRef.current) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                const frameData = dataUrl.split(',')[1];

                const frameResponse = await fetch(`/api/setup/mobile-frame/${encodeURIComponent(validSessionId)}?initial=true`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ frameData, timestamp: Date.now() })
                });

                console.log('Initial frame sent, status:', frameResponse.status);
              }
            }
          } catch (e) {
            console.warn('Initial heartbeat/frame error:', e);
          }
        } else if (retryCount < 3) {
          // Retry camera start a few times
          console.log(`Camera start failed, retrying (${retryCount + 1}/3)...`);
          setTimeout(() => establishConnection(retryCount + 1), 1000);
        }
      } catch (error) {
        console.error('Error in connection establishment:', error);
        if (retryCount < 3) {
          setTimeout(() => establishConnection(retryCount + 1), 1000);
        }
      }
    };

    // FIXED: Only start connection process if user has interacted
    if (hasUserStartedCamera) {
      establishConnection();
    } else {
      console.log('[Mobile Camera] Waiting for user to start camera manually');
    }

    // Set up periodic connection checks with session ID validation
    const connectionCheckInterval = setInterval(async () => {
      try {
        // Use the session ID from QR code directly
        if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
          console.error('[Mobile Camera] ❌ No valid session ID for connection check');
          return;
        }

        const validSessionId = sessionId;

        console.log(`[Mobile Camera] Connection check with valid session ID: ${validSessionId}`);

        // Check if we're still connected
        const response = await fetch(`/api/setup/check-mobile-camera?sessionId=${encodeURIComponent(validSessionId)}&check=true&t=${Date.now()}`);
        const data = await response.json();

        if (!data.connected && isConnected) {
          console.log('Connection lost, attempting to reconnect...');
          establishConnection();
        }
      } catch (e) {
        console.warn('Connection check error:', e);
      }
    }, 10000); // Check every 10 seconds

    return () => {
      clearInterval(connectionCheckInterval);
    };
  }, [hasUserStartedCamera]);

  // Cleanup effect - only runs on component unmount
  useEffect(() => {
    return () => {
      console.log('[Mobile Camera] Component unmounting - cleaning up stream');
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      // Send final disconnection status
      if (sessionId) {
        sendConnectionStatus(false);
      }
    };
  }, []); // Empty dependency array - only runs on mount/unmount

  // Render the camera view
  return (
    <div className="flex flex-col items-center min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Mobile Camera</h1>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <div className="flex items-center text-green-500">
                <Check className="h-4 w-4 mr-1" />
                <span className="text-sm">Connected</span>
              </div>
            ) : (
              <div className="flex items-center text-yellow-500">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">Connecting...</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
          {stream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <Smartphone className="h-12 w-12 text-gray-500 mb-2" />
              {!hasUserStartedCamera ? (
                <div className="text-center">
                  <p className="text-white font-semibold mb-2">📱 Mobile Camera Ready</p>
                  <p className="text-gray-300 text-sm mb-3">Tap &quot;Start Camera&quot; below to begin streaming</p>
                  <p className="text-gray-400 text-xs">This will connect your phone as a secondary camera</p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-yellow-400 font-semibold mb-2">🔄 Starting Camera...</p>
                  <p className="text-gray-300 text-sm">Please allow camera access when prompted</p>
                </div>
              )}
            </div>
          )}

          {isConnected && (
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-xs">
              Frames sent: {framesSent}
            </div>
          )}
        </div>

        {!hasUserStartedCamera && (
          <div className="bg-blue-900 text-blue-100 p-4 rounded-lg mb-4">
            <div className="flex items-start">
              <Camera className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Ready to Connect</h3>
                <p className="text-sm mt-1">
                  You&apos;ve successfully scanned the QR code! Now start your camera to begin streaming.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mb-4">
          <Button
            onClick={handleStartCamera}
            variant="default"
            className={`flex-1 mr-2 ${!hasUserStartedCamera ? 'bg-green-600 hover:bg-green-700 animate-pulse' : ''}`}
            disabled={!!stream}
          >
            <Camera className="h-4 w-4 mr-2" />
            {!hasUserStartedCamera ? '🚀 Start Camera' : 'Camera Started'}
          </Button>
          <Button
            onClick={handleFlipCamera}
            variant="outline"
            className="flex-1 ml-2"
            disabled={!stream || isFlipping}
          >
            <FlipHorizontal className={`h-4 w-4 mr-2 ${isFlipping ? 'animate-spin' : ''}`} />
            {isFlipping ? 'Flipping...' : `Switch to ${currentFacingMode === 'environment' ? 'Front' : 'Back'}`}
          </Button>
        </div>

        {!isSecureContext && !isDevelopment && (
          <div className="bg-yellow-900 text-yellow-100 p-3 rounded-lg mb-4">
            <div className="flex items-start">
              <Lock className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Secure Context Required</h3>
                <p className="text-sm mt-1">
                  Camera access requires a secure context (HTTPS). Please access this page via HTTPS.
                </p>
              </div>
            </div>
          </div>
        )}

        {isHttpProtocol && !isDevelopment && (
          <div className="bg-yellow-900 text-yellow-100 p-3 rounded-lg mb-4">
            <div className="flex items-start">
              <Globe className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">HTTPS Required</h3>
                <p className="text-sm mt-1">
                  You&apos;re using HTTP. Please switch to HTTPS to enable camera access.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900 text-red-100 p-3 rounded-lg mb-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium">Error</h3>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-gray-400 text-xs mt-6">
          <p>Session ID: {sessionId || 'Not connected'}</p>
          <p className="mt-1">
            This camera feed is only accessible to the device that generated the QR code.
          </p>
          {!hasUserStartedCamera && (
            <div className="mt-3 p-2 bg-gray-800 rounded text-yellow-300">
              <p className="text-sm font-medium">👆 Tap &quot;Start Camera&quot; above to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
