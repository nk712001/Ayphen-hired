'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';
import { Camera, Check, AlertCircle, Smartphone, Lock, Globe, FlipHorizontal, Wifi, WifiOff, Activity } from 'lucide-react';
import { initializeSessionId } from '@/lib/session-id-utils';

// Enhanced mobile camera page with automatic connection and 30 FPS streaming
export default function EnhancedMobileCameraPage() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Add page load logging
  useEffect(() => {
    console.log('[Enhanced Mobile] Enhanced mobile camera page loaded');
    console.log('[Enhanced Mobile] Search params:', searchParams?.toString());
    console.log('[Enhanced Mobile] User agent:', navigator.userAgent);
  }, [searchParams]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Connection and streaming state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [autoConnected, setAutoConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Performance metrics
  const [framesSent, setFramesSent] = useState(0);
  const [currentFPS, setCurrentFPS] = useState(0);
  const [latency, setLatency] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'disconnected'>('disconnected');
  
  // Streaming intervals and refs
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fpsCounterRef = useRef<{ frames: number; lastTime: number }>({ frames: 0, lastTime: Date.now() });
  const lastFrameTimeRef = useRef<number>(0);
  
  // Enhanced streaming configuration
  const STREAMING_CONFIG = {
    TARGET_FPS: 30,
    FRAME_INTERVAL: 1000 / 30, // 33.33ms for 30 FPS
    QUALITY_SETTINGS: {
      width: 640,
      height: 480,
      compression: 0.8
    },
    CONNECTION_TIMEOUT: 5000,
    HEARTBEAT_INTERVAL: 3000,
    AUTO_RECONNECT_DELAY: 2000,
    MAX_RECONNECT_ATTEMPTS: 5
  };

  // Initialize session ID using centralized utilities
  useEffect(() => {
    console.log('[Enhanced Mobile] ===== SESSION ID INITIALIZATION DEBUG START =====');
    console.log('[Enhanced Mobile] searchParams object:', searchParams);
    console.log('[Enhanced Mobile] searchParams toString:', searchParams?.toString());
    
    // Use centralized session ID initialization
    // Convert ReadonlyURLSearchParams to URLSearchParams for compatibility
    const urlSearchParams = searchParams ? new URLSearchParams(searchParams.toString()) : null;
    const sessionResult = initializeSessionId(urlSearchParams, 'mobileSessionId', 'enhanced-mobile');
    
    console.log('[Enhanced Mobile] Session ID initialization result:', {
      isValid: sessionResult.isValid,
      sessionId: sessionResult.sessionId,
      reason: sessionResult.reason,
      wasGenerated: sessionResult.wasGenerated
    });
    
    setSessionId(sessionResult.sessionId);
    console.log('[Enhanced Mobile] ===== SESSION ID INITIALIZATION DEBUG END =====');
  }, [searchParams]);

  // Enhanced camera initialization with automatic connection
  const initializeCamera = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[Enhanced Mobile] Initializing camera with enhanced settings');
      
      const constraints = {
        video: {
          facingMode: 'environment', // Start with back camera
          width: { ideal: STREAMING_CONFIG.QUALITY_SETTINGS.width },
          height: { ideal: STREAMING_CONFIG.QUALITY_SETTINGS.height },
          frameRate: { ideal: STREAMING_CONFIG.TARGET_FPS, max: STREAMING_CONFIG.TARGET_FPS }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready with timeout
        await Promise.race([
          new Promise<void>((resolve) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                console.log('[Enhanced Mobile] Video metadata loaded:', {
                  videoWidth: videoRef.current?.videoWidth,
                  videoHeight: videoRef.current?.videoHeight,
                  readyState: videoRef.current?.readyState
                });
                resolve();
              };
            }
          }),
          new Promise<void>((resolve) => {
            setTimeout(() => {
              console.warn('[Enhanced Mobile] Video metadata loading timeout, proceeding anyway');
              resolve();
            }, 5000);
          })
        ]);
      }

      console.log('[Enhanced Mobile] Camera initialized successfully');
      return true;
    } catch (error: any) {
      console.error('[Enhanced Mobile] Camera initialization failed:', error);
      setError(`Camera access failed: ${error.message}`);
      return false;
    }
  }, []);

  // Send connection status to server with debouncing to prevent rapid cycling
  const lastConnectionStatusRef = useRef<{ status: boolean; time: number } | null>(null);
  const sendConnectionStatus = useCallback(async (connected: boolean): Promise<boolean> => {
    console.log('[Enhanced Mobile] ===== SEND CONNECTION STATUS DEBUG START =====');
    console.log('[Enhanced Mobile] Current sessionId state:', sessionId);
    console.log('[Enhanced Mobile] sessionId type:', typeof sessionId);
    console.log('[Enhanced Mobile] sessionId === null:', sessionId === null);
    console.log('[Enhanced Mobile] sessionId === "null":', sessionId === 'null');
    console.log('[Enhanced Mobile] sessionId stringified:', JSON.stringify(sessionId));
    console.log('[Enhanced Mobile] ===== SEND CONNECTION STATUS DEBUG END =====');
    
    if (!sessionId || sessionId === 'null' || sessionId === 'undefined' || sessionId.trim() === '') {
      console.error('[Enhanced Mobile] Invalid session ID for connection status:', sessionId);
      
      // Try to regenerate session ID if it's invalid - ensure robust generation
      const timestamp = Date.now();
      const randomPart1 = Math.random().toString(36).substring(2, 15);
      const randomPart2 = Math.random().toString(36).substring(2, 15);
      const newSessionId = `enhanced-regen-${timestamp}-${randomPart1}-${randomPart2}`;
      
      // Validate the regenerated ID
      if (newSessionId && newSessionId !== 'null' && newSessionId !== 'undefined' && newSessionId.length > 10) {
        console.log('[Enhanced Mobile] Regenerating robust session ID:', newSessionId);
        setSessionId(newSessionId);
      } else {
        console.error('[Enhanced Mobile] Regeneration failed, using fallback');
        const fallbackId = `mobile-emergency-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
        setSessionId(fallbackId);
      }
      
      try {
        const finalNewSessionId = newSessionId && newSessionId !== 'null' && newSessionId !== 'undefined' && newSessionId.length > 10 ? newSessionId : `mobile-emergency-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
        localStorage.setItem('mobileSessionId', finalNewSessionId);
        console.log('[Enhanced Mobile] Regenerated session ID stored:', finalNewSessionId);
      } catch (e) {
        console.warn('[Enhanced Mobile] Could not store new session ID:', e);
      }
      
      return false;
    }
    
    // Debounce connection status changes to prevent rapid cycling
    const now = Date.now();
    if (lastConnectionStatusRef.current && 
        lastConnectionStatusRef.current.status === connected && 
        now - lastConnectionStatusRef.current.time < 2000) {
      console.log('[Enhanced Mobile] Connection status debounced:', connected);
      return true;
    }
    
    lastConnectionStatusRef.current = { status: connected, time: now };
    
    try {
      console.log('[Enhanced Mobile] Sending connection status:', connected);
      const response = await fetch('/api/setup/mobile-camera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          connected,
          timestamp: now,
          enhanced: true,
          targetFPS: STREAMING_CONFIG.TARGET_FPS,
          streamUrl: `/api/setup/mobile-stream-enhanced/${sessionId}`
        })
      });

      if (response.ok) {
        console.log(`[Enhanced Mobile] Connection status sent: ${connected}`);
        setIsConnected(connected);
        return true;
      } else {
        console.error('[Enhanced Mobile] Failed to send connection status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('[Enhanced Mobile] Error sending connection status:', error);
      return false;
    }
  }, [sessionId]);

  // Enhanced frame capture and streaming
  const captureAndSendFrame = useCallback(async (): Promise<void> => {
    if (!videoRef.current || !canvasRef.current || !sessionId || !isStreaming) {
      console.warn('[Enhanced Mobile] Frame capture skipped - missing requirements:', {
        video: !!videoRef.current,
        canvas: !!canvasRef.current,
        sessionId: !!sessionId,
        isStreaming
      });
      return;
    }

    // Check if video is ready
    if (videoRef.current.readyState < 2) {
      console.warn('[Enhanced Mobile] Video not ready for capture, readyState:', videoRef.current.readyState);
      return;
    }

    try {
      const startTime = Date.now();
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      // Set canvas size to match video
      canvas.width = video.videoWidth || STREAMING_CONFIG.QUALITY_SETTINGS.width;
      canvas.height = video.videoHeight || STREAMING_CONFIG.QUALITY_SETTINGS.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear and draw current frame
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Add enhanced overlay with metrics
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, 100);
      
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Enhanced Mobile Camera | 30 FPS`, 10, 20);
      ctx.fillText(`Session: ${sessionId}`, 10, 40);
      ctx.fillText(`Frames: ${framesSent} | FPS: ${currentFPS.toFixed(1)}`, 10, 60);
      ctx.fillText(`Latency: ${latency}ms | Quality: ${connectionQuality}`, 10, 80);
      
      // Connection status indicator
      ctx.fillStyle = isConnected ? '#4CAF50' : '#F44336';
      ctx.beginPath();
      ctx.arc(canvas.width - 20, 20, 8, 0, 2 * Math.PI);
      ctx.fill();

      // Convert to base64 with optimized compression
      const dataUrl = canvas.toDataURL('image/jpeg', STREAMING_CONFIG.QUALITY_SETTINGS.compression);
      const frameData = dataUrl.split(',')[1];
      
      // Send frame with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), STREAMING_CONFIG.CONNECTION_TIMEOUT);
      
      const response = await fetch(
        `/api/setup/mobile-frame-enhanced/${sessionId}?enhanced=true&fps=${STREAMING_CONFIG.TARGET_FPS}&t=${startTime}`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify({
            frameData,
            timestamp: startTime,
            captureTime: startTime,
            enhanced: true,
            targetFPS: STREAMING_CONFIG.TARGET_FPS,
            quality: STREAMING_CONFIG.QUALITY_SETTINGS
          }),
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const responseData = await response.json();
        const endTime = Date.now();
        const frameLatency = endTime - startTime;
        
        console.log('[Enhanced Mobile] Frame sent successfully:', {
          frameCount: responseData.frameCount,
          latency: frameLatency,
          enhanced: responseData.enhanced
        });
        
        // Update metrics
        setFramesSent(responseData.frameCount || framesSent + 1);
        setLatency(frameLatency);
        
        // Update FPS counter
        fpsCounterRef.current.frames++;
        const now = Date.now();
        if (now - fpsCounterRef.current.lastTime >= 1000) {
          setCurrentFPS(fpsCounterRef.current.frames);
          fpsCounterRef.current.frames = 0;
          fpsCounterRef.current.lastTime = now;
        }
        
        // Update connection quality based on latency
        if (frameLatency < 100) {
          setConnectionQuality('excellent');
        } else if (frameLatency < 200) {
          setConnectionQuality('good');
        } else {
          setConnectionQuality('poor');
        }
        
        lastFrameTimeRef.current = now;
        
      } else {
        console.error('[Enhanced Mobile] Frame upload failed:', response.status, await response.text());
        setConnectionQuality('poor');
        
        // Don't stop streaming on upload failures, just log and continue
        return;
      }
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('[Enhanced Mobile] Frame capture error:', error);
        setConnectionQuality('poor');
        
        // Don't stop streaming on capture errors, just log and continue
        // The next frame capture attempt will try again
      }
    }
  }, [sessionId, isStreaming, framesSent, currentFPS, latency, connectionQuality, isConnected]);

  // Start enhanced streaming at 30 FPS
  const startEnhancedStreaming = useCallback(async (): Promise<void> => {
    if (isStreaming || !sessionId) {
      console.log('[Enhanced Mobile] Streaming start skipped:', { isStreaming, sessionId: !!sessionId });
      return;
    }
    
    console.log('[Enhanced Mobile] Starting enhanced 30 FPS streaming');
    setIsStreaming(true);
    
    // Send initial connection status
    await sendConnectionStatus(true);
    
    // Start frame streaming at precise intervals
    streamingIntervalRef.current = setInterval(() => {
      captureAndSendFrame();
    }, STREAMING_CONFIG.FRAME_INTERVAL);
    
    // Start heartbeat
    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        const heartbeatUrl = `/api/setup/check-mobile-camera?sessionId=${sessionId}&heartbeat=true&enhanced=true&t=${Date.now()}`;
        console.log('[Enhanced Mobile] ===== HEARTBEAT DEBUG START =====');
        console.log('[Enhanced Mobile] Heartbeat sessionId:', sessionId);
        console.log('[Enhanced Mobile] Heartbeat URL:', heartbeatUrl);
        console.log('[Enhanced Mobile] ===== HEARTBEAT DEBUG END =====');
        
        await fetch(
          heartbeatUrl,
          { headers: { 'Cache-Control': 'no-cache' } }
        );
      } catch (error) {
        console.warn('[Enhanced Mobile] Heartbeat failed:', error);
      }
    }, STREAMING_CONFIG.HEARTBEAT_INTERVAL);
    
    console.log(`[Enhanced Mobile] Streaming started at ${STREAMING_CONFIG.TARGET_FPS} FPS`);
  }, [sessionId, isStreaming, sendConnectionStatus, captureAndSendFrame]);

  // Stop streaming
  const stopStreaming = useCallback((reason?: string): void => {
    console.log('[Enhanced Mobile] Stopping streaming', reason ? `- Reason: ${reason}` : '');
    
    setIsStreaming(false);
    
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    
    // Only send disconnection status if explicitly requested (not for errors)
    if (sessionId && reason !== 'error') {
      sendConnectionStatus(false);
    }
  }, [sessionId, sendConnectionStatus]);

  // Automatic connection and streaming on load
  useEffect(() => {
    if (!sessionId || autoConnected) return;
    
    const establishConnection = async () => {
      try {
        console.log('[Enhanced Mobile] Establishing automatic connection');
        
        // Initialize camera
        const cameraSuccess = await initializeCamera();
        if (!cameraSuccess) {
          setError('Failed to initialize camera');
          return;
        }
        
        // Wait a moment for camera to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Start streaming automatically
        await startEnhancedStreaming();
        
        setAutoConnected(true);
        setError(null);
        
        console.log('[Enhanced Mobile] Automatic connection established successfully');
        
      } catch (error) {
        console.error('[Enhanced Mobile] Auto-connection failed:', error);
        setError(`Auto-connection failed: ${error}`);
      }
    };
    
    // Establish connection after a short delay
    const timeoutId = setTimeout(establishConnection, 500);
    
    return () => clearTimeout(timeoutId);
  }, [sessionId, autoConnected, initializeCamera, startEnhancedStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming('cleanup');
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stopStreaming, stream]);

  // Manual camera flip
  const handleFlipCamera = async () => {
    if (!stream) return;
    
    // Stop current stream
    stream.getTracks().forEach(track => track.stop());
    
    try {
      const constraints = {
        video: {
          facingMode: stream ? 'user' : 'environment',
          width: { ideal: STREAMING_CONFIG.QUALITY_SETTINGS.width },
          height: { ideal: STREAMING_CONFIG.QUALITY_SETTINGS.height },
          frameRate: { ideal: STREAMING_CONFIG.TARGET_FPS }
        },
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error: any) {
      console.error('[Enhanced Mobile] Camera flip failed:', error);
      setError(`Camera flip failed: ${error.message}`);
    }
  };

  // Get connection status icon and color
  const getConnectionIcon = () => {
    if (!isConnected) return <WifiOff className="h-4 w-4 text-red-500" />;
    
    switch (connectionQuality) {
      case 'excellent':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'good':
        return <Wifi className="h-4 w-4 text-yellow-500" />;
      case 'poor':
        return <Wifi className="h-4 w-4 text-orange-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-black text-white p-4">
      <div className="w-full max-w-md">
        {/* Enhanced Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Enhanced Mobile Camera</h1>
          <div className="flex items-center space-x-2">
            {getConnectionIcon()}
            <div className="flex items-center text-sm">
              {isStreaming ? (
                <>
                  <Activity className="h-4 w-4 mr-1 text-green-500 animate-pulse" />
                  <span className="text-green-500">Streaming {currentFPS.toFixed(1)} FPS</span>
                </>
              ) : isConnected ? (
                <>
                  <Check className="h-4 w-4 mr-1 text-green-500" />
                  <span className="text-green-500">Connected</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-1 text-yellow-500" />
                  <span className="text-yellow-500">Connecting...</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Video Display */}
        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-4">
          {stream ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full object-cover opacity-0"
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Smartphone className="h-12 w-12 text-gray-500 mb-2" />
              <p className="text-gray-500 text-center">
                {autoConnected ? 'Camera initializing...' : 'Camera not active'}
              </p>
            </div>
          )}
          
          {/* Enhanced Metrics Overlay */}
          {isStreaming && (
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 px-3 py-2 rounded text-xs">
              <div className="flex items-center space-x-4">
                <span>Frames: {framesSent}</span>
                <span>FPS: {currentFPS.toFixed(1)}</span>
                <span>Latency: {latency}ms</span>
                <span className={`capitalize ${
                  connectionQuality === 'excellent' ? 'text-green-400' :
                  connectionQuality === 'good' ? 'text-yellow-400' :
                  connectionQuality === 'poor' ? 'text-orange-400' : 'text-red-400'
                }`}>
                  {connectionQuality}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Controls */}
        <div className="flex justify-between mb-4">
          <Button
            onClick={async () => {
              if (!isStreaming) {
                await startEnhancedStreaming();
              } else {
                stopStreaming();
              }
            }}
            variant={isStreaming ? "outline" : "default"}
            className="flex-1 mr-2"
            disabled={!stream}
          >
            <Camera className="h-4 w-4 mr-2" />
            {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
          </Button>
          
          <Button
            onClick={handleFlipCamera}
            variant="outline"
            className="flex-1 ml-2"
            disabled={!stream}
          >
            <FlipHorizontal className="h-4 w-4 mr-2" />
            Flip Camera
          </Button>
        </div>

        {/* Enhanced Status Information */}
        <div className="bg-gray-900 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-semibold mb-2">Connection Status</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Session ID:</span>
              <span className="font-mono">{sessionId || 'Not connected'}</span>
            </div>
            <div className="flex justify-between">
              <span>Auto-Connected:</span>
              <span className={autoConnected ? 'text-green-400' : 'text-gray-400'}>
                {autoConnected ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Target FPS:</span>
              <span>{STREAMING_CONFIG.TARGET_FPS}</span>
            </div>
            <div className="flex justify-between">
              <span>Current FPS:</span>
              <span className={currentFPS >= 25 ? 'text-green-400' : 'text-yellow-400'}>
                {currentFPS.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Quality:</span>
              <span>{STREAMING_CONFIG.QUALITY_SETTINGS.width}x{STREAMING_CONFIG.QUALITY_SETTINGS.height}</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
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

        {/* Footer */}
        <div className="text-center text-gray-400 text-xs mt-6">
          <p>Enhanced Mobile Camera with 30 FPS Streaming</p>
          <p className="mt-1">
            Automatic connection and dual window support enabled
          </p>
        </div>
      </div>
    </div>
  );
}
