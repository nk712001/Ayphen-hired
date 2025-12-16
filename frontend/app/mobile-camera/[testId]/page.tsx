'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Camera, CheckCircle } from 'lucide-react';

// Global type for mobile frame interval
declare global {
  interface Window {
    mobileFrameInterval?: NodeJS.Timeout;
  }
}

export default function MobileCameraPage() {
  const params = useParams();
  const testId = params?.testId as string;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Debug: Log the full URL
    console.log('Full URL:', window.location.href);
    console.log('Search params:', window.location.search);

    // Get session ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlSessionId = urlParams.get('sessionId');

    console.log('All URL params:', Object.fromEntries(urlParams));

    if (urlSessionId) {
      setSessionId(urlSessionId);
      console.log('Mobile camera using session ID:', urlSessionId);
    } else {
      console.error('No session ID found in URL');
      console.log('Available params:', Array.from(urlParams.keys()));
    }
  }, []);

  // Don't auto-start camera, wait for user interaction
  useEffect(() => {
    // Just log that we have session ID, don't start camera automatically
    if (sessionId) {
      console.log('Session ID ready:', sessionId);
    }

    // Cleanup on unmount
    return () => {
      if (window.mobileFrameInterval) {
        clearInterval(window.mobileFrameInterval);
        window.mobileFrameInterval = undefined;
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [sessionId, stream]);

  const setupCamera = async () => {
    try {
      console.log('Requesting camera access...');

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }

      // Try with basic constraints first
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      console.log('Camera access granted!');
      console.log('Media stream:', mediaStream);
      console.log('Video tracks:', mediaStream.getVideoTracks());

      setStream(mediaStream);

      if (videoRef.current) {
        const video = videoRef.current;
        console.log('Setting srcObject to video element');

        // Clear any existing srcObject first
        video.srcObject = null;

        // Set the new stream
        video.srcObject = mediaStream;

        console.log('Stream assigned, srcObject:', video.srcObject);
        console.log('Video readyState after assignment:', video.readyState);

        // Wait for metadata to load before playing
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
          console.log('Video readyState:', video.readyState);

          video.play().then(() => {
            console.log('Video playing successfully');
            // Start frame capture after video is playing
            setTimeout(startFrameCapture, 500);
          }).catch(error => {
            console.error('Video play failed:', error);
          });
        };

        // Force load if metadata doesn't load automatically
        setTimeout(() => {
          if (video.readyState === 0) {
            console.log('Forcing video load');
            video.load();
          }
        }, 1000);
      } else {
        console.error('Video ref is null!');
      }
      setIsConnected(true);
      // Report initial connection
      reportConnection();
    } catch (error: any) {
      console.error('Camera access failed:', error);
      setError(error.message || 'Camera access denied');
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.log('Video or canvas ref not available');
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Check if video is ready
    if (video.readyState < 2) {
      console.log('Video not ready, readyState:', video.readyState);
      return null;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('Video dimensions not available:', video.videoWidth, 'x', video.videoHeight);
      return null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Canvas context not available');
      return null;
    }

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const frameData = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      console.log('Frame captured successfully, size:', frameData.length);
      return frameData;
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    }
  };

  const reportConnection = async () => {
    if (!sessionId) return;

    try {
      await fetch(`/api/mobile-connection-status/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connected: true })
      });
    } catch (error) {
      console.error('Failed to report connection:', error);
    }
  };

  const sendFrame = async (frameData: string) => {
    if (!sessionId) {
      console.error('No session ID available for sending frame');
      return;
    }

    try {
      console.log('Sending frame to API...');
      console.log('API URL: /api/setup/mobile-camera');
      console.log('Session ID:', sessionId);
      console.log('Frame data length:', frameData.length);

      const requestBody = {
        sessionId,
        frameData,
        connected: true,
        timestamp: Date.now()
      };

      console.log('Request body keys:', Object.keys(requestBody));

      const response = await fetch('/api/setup/mobile-camera', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const responseData = await response.json();
        console.log('Server response:', responseData);

        const newCount = frameCount + 1;
        setFrameCount(newCount);
        console.log('Frame sent successfully, count:', newCount);

        // Report connection status every 10 frames
        if (newCount % 10 === 0) {
          reportConnection();
        }
      } else {
        console.error('Failed to send frame, status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error: any) {
      console.error('Network error sending frame:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
  };

  const startFrameCapture = () => {
    console.log('Starting frame capture...');
    const interval = setInterval(() => {
      const frameData = captureFrame();
      if (frameData) {
        console.log('Captured frame, sending...');
        sendFrame(frameData);
      } else {
        console.log('No frame data captured');
      }
    }, 200); // Send frame every 200ms (5fps)

    // Store interval for cleanup
    window.mobileFrameInterval = interval;

    return () => {
      console.log('Stopping frame capture');
      clearInterval(interval);
    };
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Secondary Camera</h1>
          <p className="text-gray-300">Test ID: {testId}</p>
          <p className="text-gray-400 text-sm">Session: {sessionId}</p>
          <p className="text-gray-400 text-sm">Environment Monitoring</p>
          <div className="mt-2 text-xs text-gray-500">
            <p>Protocol: {window.location.protocol}</p>
            <p>Host: {window.location.host}</p>
            <p>Camera API: {navigator.mediaDevices ? '✓' : '✗'}</p>
            <p>Full URL: {window.location.href}</p>
            <p>Search: {window.location.search}</p>
          </div>
        </div>

        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span>Camera Connected</span>
            </div>

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full rounded-lg bg-gray-800"
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="text-center text-sm text-gray-400">
              Keep this camera active during the test
              <div className="mt-2 text-xs">
                Frames sent: {frameCount}
              </div>
              <button
                onClick={async () => {
                  try {
                    console.log('Manual frame test clicked');
                    const video = videoRef.current;
                    console.log('Video element:', video);
                    console.log('Video srcObject:', video?.srcObject);
                    console.log('Video readyState:', video?.readyState);
                    console.log('Video dimensions:', video?.videoWidth, 'x', video?.videoHeight);
                    console.log('Stream state:', stream);

                    // If video doesn't have stream but we have one, reassign it
                    if (video && stream && !video.srcObject) {
                      console.log('Reassigning stream to video element');
                      video.srcObject = stream;
                      await new Promise(resolve => {
                        video.onloadedmetadata = () => {
                          console.log('Stream reassigned, playing video');
                          video.play().then(resolve).catch(resolve);
                        };
                      });
                    }

                    if (!video || !canvasRef.current || !sessionId) {
                      console.error('Missing required elements');
                      return;
                    }

                    const frameData = captureFrame();
                    if (frameData) {
                      console.log('Manual frame captured, size:', frameData.length);
                      await sendFrame(frameData);
                    } else {
                      console.log('Manual frame capture failed');
                    }
                  } catch (error) {
                    console.error('Manual test error:', error);
                  }
                }}
                className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-xs"
              >
                Test Frame Send
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <Camera className="w-16 h-16 mx-auto text-gray-400" />
            <div>
              <h2 className="text-lg font-medium mb-2">Enable Camera Access</h2>
              <p className="text-gray-400 mb-4">Tap the button below to start your camera</p>
              <button
                onClick={setupCamera}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
                disabled={!sessionId}
              >
                📷 Start Camera
              </button>
              {!sessionId && (
                <p className="text-red-400 text-sm mt-2">Waiting for session ID...</p>
              )}
              {error && (
                <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  <p className="font-bold">Camera Error:</p>
                  <p className="text-sm">{error}</p>
                  <p className="text-xs mt-2">
                    Please check your browser settings and allow camera access.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}