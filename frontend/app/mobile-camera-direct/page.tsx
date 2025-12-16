'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Check, X } from 'lucide-react';

export default function MobileCameraDirect() {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('sessionId') || '';
  
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [framesSent, setFramesSent] = useState(0);
  
  // Function to start the camera
  const startCamera = async () => {
    try {
      console.log('Attempting to start camera...');
      
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      
      setStream(mediaStream);
      setIsConnected(true);
      setIsConnecting(false);
      
      console.log('Camera started successfully');
      return true;
    } catch (error) {
      console.error('Error starting camera:', error);
      setError(`Camera access error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConnecting(false);
      return false;
    }
  };
  
  // Function to send connection status
  const sendConnectionStatus = async (connected: boolean) => {
    try {
      const response = await fetch(`/api/setup/check-mobile-camera?sessionId=${sessionId}&heartbeat=true&t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('Connection status sent:', connected, response.status);
      return response.ok;
    } catch (error) {
      console.error('Error sending connection status:', error);
      return false;
    }
  };
  
  // Function to send a frame
  const sendFrame = async (videoElement: HTMLVideoElement) => {
    if (!videoElement || !sessionId) return;
    
    try {
      // Create a canvas to capture the current frame
      const canvas = document.createElement('canvas');
      const width = videoElement.videoWidth || 640;
      const height = videoElement.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;
      
      // Draw the current video frame to the canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear the canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        // Draw the current video frame
        ctx.drawImage(videoElement, 0, 0, width, height);
        
        // Add a timestamp and device info
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(`${new Date().toLocaleTimeString()} | Mobile Camera | ${sessionId}`, 10, height - 10);
        
        // Convert to base64 with lower quality for better performance
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        const frameData = dataUrl.split(',')[1];
        
        // Send the frame directly to the frame endpoint
        const response = await fetch(`/api/setup/mobile-frame/${sessionId}?t=${Date.now()}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          body: JSON.stringify({
            frameData,
            timestamp: Date.now()
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setFramesSent(prev => prev + 1);
          return true;
        }
      }
    } catch (error) {
      console.error('Error sending frame:', error);
    }
    
    return false;
  };
  
  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setIsConnecting(false);
      return;
    }
    
    console.log('Starting direct camera connection with session ID:', sessionId);
    
    // Send initial heartbeat
    sendConnectionStatus(true);
    
    // Start the camera
    startCamera();
    
    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      sendConnectionStatus(false);
    };
  }, [sessionId]);
  
  // Set up frame sending
  useEffect(() => {
    if (!stream || !isConnected) return;
    
    const videoElement = document.getElementById('camera-feed') as HTMLVideoElement;
    if (!videoElement) return;
    
    // Set up the video element
    videoElement.srcObject = stream;
    videoElement.play().catch(err => console.error('Error playing video:', err));
    
    // Send frames periodically
    const frameInterval = setInterval(() => {
      sendFrame(videoElement);
    }, 500); // 2 fps
    
    // Send connection status periodically
    const connectionInterval = setInterval(() => {
      sendConnectionStatus(true);
    }, 5000);
    
    return () => {
      clearInterval(frameInterval);
      clearInterval(connectionInterval);
    };
  }, [stream, isConnected]);
  
  return (
    <div className="flex flex-col items-center min-h-screen bg-black text-white p-4">
      <Card className="w-full max-w-md bg-gray-900 text-white border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Camera className="mr-2 h-6 w-6" />
            Mobile Camera
          </CardTitle>
          <CardDescription className="text-gray-400">
            Session ID: {sessionId || 'Not provided'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isConnecting ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
              <p>Connecting camera...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  id="camera-feed"
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                  <Check className="h-3 w-3 mr-1" />
                  Live
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg">
                <div>
                  <p className="text-sm text-gray-400">Connection Status</p>
                  <p className="font-medium flex items-center">
                    {isConnected ? (
                      <>
                        <Check className="h-4 w-4 text-green-500 mr-1" />
                        Connected
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4 text-red-500 mr-1" />
                        Disconnected
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Frames Sent</p>
                  <p className="font-medium text-center">{framesSent}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="w-full border-gray-700 hover:bg-gray-800"
          >
            Reconnect Camera
          </Button>
        </CardFooter>
      </Card>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Keep this page open to maintain the camera connection</p>
        <p>Your camera feed is being sent to the main application</p>
      </div>
    </div>
  );
}
