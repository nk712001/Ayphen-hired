'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

// Simple test page to verify mobile camera functionality
export default function MobileCameraTestPage() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Loading...');
  const [frameCount, setFrameCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get session ID
  useEffect(() => {
    const urlSessionId = searchParams?.get('sessionId');
    if (urlSessionId) {
      setSessionId(urlSessionId);
      setStatus('Session ID found: ' + urlSessionId);
    } else {
      setStatus('No session ID in URL');
    }
  }, [searchParams]);

  // Initialize camera
  const startCamera = async () => {
    try {
      setStatus('Requesting camera access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStatus('Camera started successfully');
      }
    } catch (error: any) {
      setStatus('Camera error: ' + error.message);
    }
  };

  // Send connection status
  const sendConnection = async (connected: boolean) => {
    if (!sessionId) return;
    
    try {
      const response = await fetch('/api/setup/mobile-camera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          connected,
          timestamp: Date.now(),
          enhanced: false
        })
      });
      
      if (response.ok) {
        setStatus(prev => prev + ` | Connection ${connected ? 'sent' : 'disconnected'}`);
      } else {
        setStatus(prev => prev + ` | Connection failed: ${response.status}`);
      }
    } catch (error: any) {
      setStatus(prev => prev + ` | Connection error: ${error.message}`);
    }
  };

  // Send frame
  const sendFrame = async () => {
    if (!videoRef.current || !canvasRef.current || !sessionId) return;
    
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const frameData = dataUrl.split(',')[1];
      
      const response = await fetch(`/api/setup/mobile-frame/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameData,
          timestamp: Date.now()
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setFrameCount(result.frameCount || frameCount + 1);
        setStatus(prev => `Frames sent: ${result.frameCount || frameCount + 1} | Last: ${new Date().toLocaleTimeString()}`);
      } else {
        setStatus(prev => prev + ` | Frame failed: ${response.status}`);
      }
    } catch (error: any) {
      setStatus(prev => prev + ` | Frame error: ${error.message}`);
    }
  };

  // Start streaming
  const startStreaming = () => {
    if (intervalRef.current) return;
    
    // Send connection status
    sendConnection(true);
    
    // Start sending frames every 500ms (2 FPS for testing)
    intervalRef.current = setInterval(sendFrame, 500);
    setStatus(prev => prev + ' | Streaming started');
  };

  // Stop streaming
  const stopStreaming = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    sendConnection(false);
    setStatus(prev => prev + ' | Streaming stopped');
  };

  return (
    <div className="p-4 bg-black text-white min-h-screen">
      <h1 className="text-xl font-bold mb-4">Mobile Camera Test</h1>
      
      <div className="mb-4">
        <p className="text-sm">{status}</p>
      </div>
      
      <div className="mb-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full max-w-md border border-gray-600"
        />
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </div>
      
      <div className="space-y-2">
        <button
          onClick={startCamera}
          className="block w-full p-2 bg-blue-600 text-white rounded"
        >
          Start Camera
        </button>
        
        <button
          onClick={startStreaming}
          className="block w-full p-2 bg-green-600 text-white rounded"
          disabled={!sessionId}
        >
          Start Streaming
        </button>
        
        <button
          onClick={stopStreaming}
          className="block w-full p-2 bg-red-600 text-white rounded"
        >
          Stop Streaming
        </button>
        
        <button
          onClick={sendFrame}
          className="block w-full p-2 bg-yellow-600 text-white rounded"
          disabled={!sessionId}
        >
          Send Single Frame
        </button>
      </div>
      
      <div className="mt-4 text-xs">
        <p>Session ID: {sessionId || 'None'}</p>
        <p>Frames sent: {frameCount}</p>
        <p>User Agent: {navigator.userAgent}</p>
      </div>
    </div>
  );
}
