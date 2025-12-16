'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ProctorClient } from './ProctorClient';
import { useRouter } from 'next/navigation';

interface ProctoringOptions {
  videoRequired?: boolean;
}

interface ProctoringContextType {
  isProctoringActive: boolean;
  isCameraActive: boolean;
  isMicrophoneActive: boolean;
  isScreenShared: boolean;
  violations: any[];
  metrics: any;
  stream: MediaStream | null;
  secondaryStream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  startProctoring: (options?: ProctoringOptions) => Promise<void>;
  stopProctoring: () => void;
  toggleCamera: () => Promise<void>;
  toggleMicrophone: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  startMonitoring: () => void;
  startAudioProcessing: () => void;
  stopAudioProcessing: () => void;
}

const ProctoringContext = createContext<ProctoringContextType | undefined>(undefined);

export const ProctoringProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isProctoringActive, setIsProctoringActive] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [isScreenShared, setIsScreenShared] = useState(false);
  const [violations, setViolations] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [secondaryStream, setSecondaryStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const [proctorClient, setProctorClient] = useState<ProctorClient | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const frameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Attach stream to video element when it changes
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    };
  }, [stream]);

  // Helper to capture video frame as base64
  const captureVideoFrameAsBase64 = useCallback((video: HTMLVideoElement | null): string | null => {
    if (!video) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg').split(',')[1]; // base64 only
  }, []);

  // Helper to generate a session ID
  const generateSessionId = useCallback(() => `sess_${Date.now()}_${Math.floor(Math.random() * 10000)}`, []);

  // Helper to capture audio data as base64
  const captureAudioData = useCallback((): string | null => {
    if (!analyserRef.current) {
      console.log('No analyser available for audio capture');
      return null;
    }

    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(dataArray);

    // Normalize audio data to [-1, 1] range
    const maxVal = Math.max(...dataArray.map(Math.abs));
    if (maxVal > 0) {
      for (let i = 0; i < dataArray.length; i++) {
        dataArray[i] = dataArray[i] / maxVal;
      }
    }

    // Calculate RMS with improved normalization
    const rms = Math.sqrt(dataArray.reduce((sum, val) => sum + val * val, 0) / dataArray.length);
    const normalizedRms = Math.min(1.0, rms * 100); // Scale up for better detection
    console.log('[AUDIO] RMS level:', rms.toFixed(6), 'Normalized:', normalizedRms.toFixed(6), 'Buffer length:', bufferLength);

    // More sensitive threshold using normalized value
    const isVoice = normalizedRms >= 0.005; // Use normalized threshold
    if (!isVoice) {
      console.log('[AUDIO] Frame too quiet, may be silence');
    } else {
      console.log('[AUDIO] Voice activity detected, Level:', normalizedRms.toFixed(6));
    }


    // Convert to base64
    const buffer = new ArrayBuffer(dataArray.length * 4);
    const view = new Float32Array(buffer);
    for (let i = 0; i < dataArray.length; i++) {
      view[i] = dataArray[i];
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }, []);

  // Setup audio processing
  const setupAudioProcessing = useCallback((mediaStream: MediaStream) => {
    try {
      if (!window.AudioContext && !(window as any).webkitAudioContext) return;
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(mediaStream);

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      console.log('Audio processing setup complete', {
        sampleRate: audioContext.sampleRate,
        fftSize: analyser.fftSize,
        frequencyBinCount: analyser.frequencyBinCount
      });
    } catch (error) {
      console.error('Error setting up audio processing:', error);
    }
  }, []);

  const startProctoring = useCallback(async (options?: ProctoringOptions) => {
    try {
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      // Request media access based on options
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: options?.videoRequired ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        } : false,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,  // Enable auto gain for better voice detection
          sampleRate: 16000,
          channelCount: 1
        },
      });

      // Check if audio track is available
      const audioTracks = mediaStream.getAudioTracks();
      console.log('[MIC DEBUG] Audio tracks available:', audioTracks.length);
      if (audioTracks.length > 0) {
        console.log('[MIC DEBUG] Audio track settings:', audioTracks[0].getSettings());
        console.log('[MIC DEBUG] Audio track state:', {
          enabled: audioTracks[0].enabled,
          muted: audioTracks[0].muted,
          readyState: audioTracks[0].readyState
        });
        // Set microphone as active if we have audio tracks
        setIsMicrophoneActive(true);
        console.log('[MIC DEBUG] Setting microphone active');
      } else {
        console.error('[MIC DEBUG] No audio tracks found in media stream');
        setIsMicrophoneActive(false);
      }
      setStream(mediaStream);
      setIsProctoringActive(true);

      // Only set camera active if we requested video
      if (options?.videoRequired) {
        const videoTracks = mediaStream.getVideoTracks();
        setIsCameraActive(videoTracks.length > 0);
      }

      if (videoRef.current && options?.videoRequired) {
        videoRef.current.srcObject = mediaStream;
      }

      // Setup audio processing
      setupAudioProcessing(mediaStream);

      // Setup AI session and ProctorClient
      const sid = generateSessionId();
      setSessionId(sid);
      const client = new ProctorClient(
        sid,
        (violation) => setViolations((prev) => [...prev, violation]),
        (metrics) => {
          console.log('Context received metrics:', metrics); // Debug log
          setMetrics(metrics);
        },
        (status) => {
          console.log('Connection status:', status); // Debug log
        }
      );
      client.connect();
      setProctorClient(client);

      // Start sending video frames every 500ms
      if (frameTimerRef.current) clearInterval(frameTimerRef.current);
      frameTimerRef.current = setInterval(() => {
        const frame = captureVideoFrameAsBase64(videoRef.current);
        if (frame && client) {
          client.sendVideoFrame(frame);
        }
      }, 500);

      // Audio processing will be started explicitly when needed
      // Do not automatically start audio frame sending
    } catch (error) {
      console.error('Error accessing media devices:', error);
      // Handle error (e.g., show error message to user)
    }
  }, [stream, captureVideoFrameAsBase64, setupAudioProcessing, generateSessionId]);

  const stopProctoring = useCallback(() => {
    console.log('🛑 stopProctoring() called - starting cleanup process');

    // Clean up ProctorClient and timers
    if (proctorClient) {
      console.log('🔌 Disconnecting proctor client');
      proctorClient.disconnect();
    }
    if (frameTimerRef.current) {
      console.log('⏰ Clearing frame timer');
      clearInterval(frameTimerRef.current);
    }
    if (audioTimerRef.current) {
      console.log('🎵 Clearing audio timer');
      clearInterval(audioTimerRef.current);
    }

    // Clean up audio context
    if (audioContextRef.current) {
      console.log('🔊 Closing audio context');
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    setProctorClient(null);
    setSessionId(null);

    // Stop all media tracks
    if (stream) {
      console.log('📹 Stopping media stream tracks:', stream.getTracks().length);
      stream.getTracks().forEach((track, index) => {
        console.log(`  📹 Stopping track ${index + 1}: ${track.kind} (${track.label})`);
        track.stop();
      });
      setStream(null);
      console.log('✅ All media tracks stopped');
    } else {
      console.log('⚠️ No media stream found to stop');
    }

    // Update state
    setIsProctoringActive(false);
    setIsCameraActive(false);
    setIsMicrophoneActive(false);
    setIsScreenShared(false);

    console.log('✅ stopProctoring() completed - all cameras and microphones should be off');
  }, [proctorClient, stream]);

  const toggleCamera = useCallback(async () => {
    // If no stream or no video track, always request a new stream
    let videoTrack = stream?.getVideoTracks()[0];
    if (!stream || !videoTrack) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: isMicrophoneActive,
        });
        if (stream) stream.getTracks().forEach(track => track.stop());
        setStream(newStream);
        setIsCameraActive(true);
        if (videoRef.current) videoRef.current.srcObject = newStream;
      } catch (error) {
        console.error('Error enabling camera:', error);
      }
      return;
    }

    // If the track is ended, request a new stream
    if (videoTrack.readyState === 'ended' || !videoTrack.enabled) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          },
          audio: isMicrophoneActive,
        });
        if (stream) stream.getTracks().forEach(track => track.stop());
        setStream(newStream);
        setIsCameraActive(true);
        if (videoRef.current) videoRef.current.srcObject = newStream;
      } catch (error) {
        console.error('Error toggling camera:', error);
      }
      return;
    }

    // Otherwise, toggle the camera by stopping the track if turning off, or requesting a new stream if turning on
    if (videoTrack.enabled) {
      // Turn off: stop the track
      videoTrack.stop();
      setIsCameraActive(false);
    }
  }, [stream, isMicrophoneActive]);

  const toggleMicrophone = useCallback(async () => {
    try {
      if (!stream) {
        // If no stream exists, request new microphone access
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: 16000
          }
        });
        setStream(newStream);
        setIsMicrophoneActive(true);
        setupAudioProcessing(newStream);
        return;
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        // No audio track, request new one
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            sampleRate: 16000
          }
        });

        // Stop old tracks
        stream.getTracks().forEach(track => track.stop());

        // Update stream with new tracks
        setStream(newStream);
        setIsMicrophoneActive(true);
        setupAudioProcessing(newStream);
        return;
      }

      // Toggle existing track
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicrophoneActive(audioTrack.enabled);

      // If re-enabling microphone, setup audio processing again
      if (audioTrack.enabled) {
        setupAudioProcessing(stream);
      }
    } catch (error) {
      console.error('Error toggling microphone:', error);
      setIsMicrophoneActive(false);
    }
  }, [stream, setupAudioProcessing]);

  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenShared) {
        // Stop screen sharing
        if (stream) {
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.stop();
            const newStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: isMicrophoneActive,
            });
            setStream(newStream);
            if (videoRef.current) {
              videoRef.current.srcObject = newStream;
            }
          }
        }
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: isMicrophoneActive,
        });

        // Replace the video track in the existing stream
        if (stream) {
          const videoTrack = screenStream.getVideoTracks()[0];
          const audioTrack = stream.getAudioTracks()[0];

          const newStream = new MediaStream();
          if (videoTrack) newStream.addTrack(videoTrack);
          if (audioTrack) newStream.addTrack(audioTrack);

          setStream(newStream);
          if (videoRef.current) {
            videoRef.current.srcObject = newStream;
          }
        }
      }

      setIsScreenShared(prev => !prev);
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  }, [isScreenShared, stream, isMicrophoneActive]);

  const startAudioProcessing = useCallback(() => {
    if (!stream || !proctorClient) return;

    // Setup audio processing if not already setup
    if (!analyserRef.current) {
      setupAudioProcessing(stream);
    }

    // Start sending audio frames
    if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    audioTimerRef.current = setInterval(() => {
      if (!analyserRef.current) {
        console.log('No analyser available, skipping audio frame');
        return;
      }

      const audioData = captureAudioData();
      if (audioData && proctorClient) {
        console.log('✓ Sending audio frame, length:', audioData.length, 'client connected');
        proctorClient.sendAudioFrame(audioData);
      }
    }, 200);
  }, [stream, proctorClient, setupAudioProcessing, captureAudioData]);

  const stopAudioProcessing = useCallback(() => {
    if (audioTimerRef.current) {
      clearInterval(audioTimerRef.current);
      audioTimerRef.current = null;
    }
  }, []);

  const startMonitoring = useCallback(() => { }, []);

  // Monitoring is now handled by backend via ProctorClient. No simulation needed.
  // Refactoring to use stable references or functional updates where possible?
  // Easier: Just wrap the value object in useMemo and only include start/stop functions if they are stable.
  // But start/stop depend on state.

  // Approach 2: Use useMemo for the value object.
  const contextValue = React.useMemo(() => ({
    isProctoringActive,
    isCameraActive,
    isMicrophoneActive,
    isScreenShared,
    violations,
    metrics,
    stream,
    secondaryStream,
    videoRef,
    startProctoring,
    stopProctoring,
    toggleCamera,
    toggleMicrophone,
    toggleScreenShare,
    startMonitoring,
    startAudioProcessing,
    stopAudioProcessing,
  }), [
    isProctoringActive, isCameraActive, isMicrophoneActive, isScreenShared,
    violations, metrics, stream, secondaryStream,
    // Functions technically change every render, causing this object to change.
    // We MUST memoize the functions first.
  ]);

  // Real Fix:
  // Memoize functions.
  // But stopProctoring uses state.
  // If we put state in dependency array, it still changes when state changes.
  // But `metrics` changing shouldn't change `stopProctoring`.

  return (
    <ProctoringContext.Provider value={contextValue}>
      {children}
    </ProctoringContext.Provider>
  );
};


export const useProctoring = (): ProctoringContextType => {
  const context = useContext(ProctoringContext);
  if (!context) {
    throw new Error('useProctoring must be used within a ProctoringProvider');
  }
  return context;
};
