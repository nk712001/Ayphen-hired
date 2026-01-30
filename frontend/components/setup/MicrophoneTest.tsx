'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';

interface MicrophoneTestProps {
  onComplete: () => void;
}

// Declare WebKit types
interface Window {
  webkitAudioContext: typeof AudioContext;
}

// Extended MediaRecorder type
interface ExtendedMediaRecorder extends MediaRecorder {
  finalDuration?: number;
  audioContext?: AudioContext;
  levelCheckInterval?: number;
  startTime?: number;
}

// Audio settings type
interface AudioSettings {
  channelCount: number;
  sampleRate: number;
  sampleSize: number;
  autoGainControl: boolean;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  latency?: { ideal: number };
  power?: { ideal: number };
}

// MediaRecorder options type
interface MediaRecorderOptions {
  mimeType?: string;
  audioBitsPerSecond?: number;
  videoBitsPerSecond?: number;
  bitsPerSecond?: number;
}

export const MicrophoneTest: React.FC<MicrophoneTestProps> = ({ onComplete }): JSX.Element => {

  // Generate session ID
  const [sessionId] = useState(() => `voice_${Date.now()}_${Math.floor(Math.random() * 10000)}`);

  const [step, setStep] = useState<'intro' | 'permission' | 'quality' | 'recognition' | 'complete'>('intro');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [testSentence, setTestSentence] = useState('');
  const [audioQuality, setAudioQuality] = useState(0);
  const [recognitionAccuracy, setRecognitionAccuracy] = useState(0);
  const [transcribedText, setTranscribedText] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<ExtendedMediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const finalDurationRef = useRef<number>(0);

  // Initialize speech recognition session
  useEffect(() => {
    const initSession = async () => {
      try {
        console.log(`[MIC TEST] Initializing session: ${sessionId}`);

        const response = await fetch('/api/setup/speech-test/init-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        });

        if (!response.ok) {
          console.error('[MIC TEST] Failed to initialize speech session');
          setError('Failed to initialize speech test. Please refresh the page and try again.');
          setSessionReady(false);
          return;
        }

        const result = await response.json();
        console.log('[MIC TEST] ✅ Session initialized:', result);

        // Verify session was actually created
        if (result.status !== 'success') {
          console.error('[MIC TEST] Session initialization returned non-success status');
          setError('Failed to initialize speech test. Please refresh the page and try again.');
          setSessionReady(false);
          return;
        }

        // Session is ready
        setSessionReady(true);
        console.log('[MIC TEST] ✅ Session ready for recording');
      } catch (err) {
        console.error('[MIC TEST] Error initializing speech session:', err);
        setError('Failed to initialize speech test. Please check your connection and try again.');
        setSessionReady(false);
      }
    };

    initSession();

    // Cleanup on unmount
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [sessionId]);

  // Get a test sentence when entering the quality or recognition step
  useEffect(() => {
    if ((step === 'quality' || step === 'recognition') && !testSentence) {
      fetchTestSentence();
    }
  }, [step, testSentence]);

  const fetchTestSentence = async () => {
    try {
      const response = await fetch('/api/setup/speech-test/get-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, step: step })
      });
      const data = await response.json();
      if (data.sentence) {
        setTestSentence(data.sentence);
      } else {
        setError('Failed to get test sentence. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching test sentence:', err);
      setError('Failed to get test sentence. Please try again.');
    }
  };

  const startRecording = async () => {
    try {

      // Reset recording state
      audioChunksRef.current = [];
      setIsRecording(true);

      // Start recording timer with high precision
      const startTime = performance.now();
      recordingTimerRef.current = setInterval(() => {
        const currentTime = performance.now();
        const newDuration = (currentTime - startTime) / 1000;
        setRecordingDuration(newDuration);
        console.log(`[MIC TEST] ⏱️ Duration update: ${newDuration.toFixed(2)}s`);
      }, 50);

      // Store start time in ref for final duration calculation
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.startTime = startTime;
      }

      // Configure audio recording
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/wav',
        'audio/mp4'
      ];

      // Find best supported format
      let selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      if (!selectedMimeType) {
        console.warn('[MIC TEST] No supported audio MIME types found, using default');
      }

      // Configure recorder options
      let options: MediaRecorderOptions = {
        audioBitsPerSecond: 256000,  // 256 kbps for high quality
        mimeType: selectedMimeType
      };

      console.log('[MIC TEST] Using audio format:', {
        mimeType: selectedMimeType,
        bitrate: options.audioBitsPerSecond
      });

      // Request audio stream with optimal settings
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Essential settings
          channelCount: 1,          // Mono audio
          sampleRate: 16000,        // Match backend sample rate
          sampleSize: 16,           // 16-bit audio

          // Quality settings
          autoGainControl: true,     // Enable auto-gain for better levels
          echoCancellation: false,   // Disable echo cancellation
          noiseSuppression: false,   // Disable noise suppression

          // Advanced settings if supported
          ...(typeof AudioContext !== 'undefined' && {
            latency: { ideal: 0 },
            power: { ideal: 1.0 }
          })
        }
      });

      // Get and validate audio track
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        throw new Error('No audio track available');
      }

      // Log detailed track info
      const settings = audioTrack.getSettings();
      const capabilities = audioTrack.getCapabilities();
      console.log('[MIC TEST] Audio track info:', {
        settings,
        capabilities,
        constraints: audioTrack.getConstraints(),
        ready: audioTrack.readyState,
        muted: audioTrack.muted
      });

      // Verify essential settings
      if (settings.sampleRate !== 16000) {
        console.warn(`[MIC TEST] Sample rate mismatch: got ${settings.sampleRate}Hz, wanted 16000Hz`);
      }
      if (settings.channelCount !== 1) {
        console.warn(`[MIC TEST] Channel count mismatch: got ${settings.channelCount}, wanted 1`);
      }

      // Create MediaRecorder with mono audio
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('MediaRecorder data available:', { size: event.data.size, type: event.data.type });
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Get final duration from ref (set in stopRecording)
        const finalDuration = finalDurationRef.current;
        console.log(`[MIC TEST] Final duration on stop: ${finalDuration.toFixed(2)}s`);

        // Create audio blob with proper MIME type
        const mimeType = mediaRecorder.mimeType || 'audio/webm;codecs=opus';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        // Store final duration in blob for async processing
        Object.defineProperty(audioBlob, 'duration', {
          value: finalDuration,
          writable: false
        });

        console.log('[MIC TEST] Created audio blob:', {
          size: audioBlob.size,
          type: audioBlob.type,
          chunks: audioChunksRef.current.length,
          chunkSizes: audioChunksRef.current.map(chunk => chunk.size)
        });

        // Convert to base64
        const base64Audio = await blobToBase64(audioBlob);
        console.log('[MIC TEST] Converted to base64, length:', base64Audio.length);

        // Process the recording
        await processRecording(base64Audio);
      };

      // Create AudioContext for monitoring
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const sourceNode = audioContext.createMediaStreamSource(stream);
      const analyserNode = audioContext.createAnalyser();
      analyserNode.fftSize = 2048;
      sourceNode.connect(analyserNode);

      // Monitor audio levels with improved sensitivity
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);
      const levelCheckInterval = setInterval(() => {
        analyserNode.getFloatTimeDomainData(dataArray);
        const rms = Math.sqrt(dataArray.reduce((sum, x) => sum + x * x, 0) / bufferLength);
        const normalizedLevel = Math.min(1.0, rms * 100); // Scale up for better detection
        console.log(`[MIC TEST] Live audio level: ${normalizedLevel.toFixed(6)} (raw RMS: ${rms.toFixed(6)})`);
      }, 100);

      // Start recording with small chunks
      mediaRecorder.start(50);  // 50ms chunks for better resolution
      console.log('[MIC TEST] Started recording:', {
        mimeType: mediaRecorder.mimeType,
        bitrate: mediaRecorder.audioBitsPerSecond,
        state: mediaRecorder.state,
        contextSampleRate: audioContext.sampleRate
      });

      // Auto-stop after 10 seconds
      const stopTimeout = setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          console.log('[MIC TEST] Auto-stopping after 10 seconds');
          stopRecording();
          clearInterval(levelCheckInterval);
          audioContext.close();
        }
      }, 10000);

      // Store for cleanup
      (mediaRecorder as any).levelCheckInterval = levelCheckInterval;
      (mediaRecorder as any).audioContext = audioContext;
      (mediaRecorder as any).stopTimeout = stopTimeout;

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording. Please ensure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    // Save final duration BEFORE clearing timer
    const finalDuration = recordingDuration;
    finalDurationRef.current = finalDuration; // Store in ref for onstop handler
    console.log(`[MIC TEST] 🎙️ Stopping recording at duration: ${finalDuration.toFixed(1)}s`);

    // Stop duration timer
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    // Stop audio monitoring
    if (mediaRecorderRef.current) {
      const recorder = mediaRecorderRef.current as any;
      if (recorder.levelCheckInterval) {
        clearInterval(recorder.levelCheckInterval);
      }
      if (recorder.audioContext) {
        recorder.audioContext.close();
      }
      if (recorder.stopTimeout) {
        clearTimeout(recorder.stopTimeout);
      }
    }

    // Stop recording if active
    if (mediaRecorderRef.current?.state === 'recording') {
      console.log(`[MIC TEST] 🎙️ Final duration before stop: ${finalDuration.toFixed(1)}s`);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);

      // Log final state
      console.log('[MIC TEST] Recording stopped:', {
        duration: finalDuration,
        chunks: audioChunksRef.current.length,
        totalSize: audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0)
      });
    }
  };

  const processRecording = async (base64Audio: string) => {
    try {
      // Get the final duration from ref
      const finalDuration = finalDurationRef.current;
      console.log(`[MIC TEST] Processing recording - Final duration: ${finalDuration.toFixed(1)}s`);

      if (finalDuration < 2) {
        console.log(`[MIC TEST] ⚠️ Recording too short: ${finalDuration.toFixed(1)}s (minimum 2s required)`);
        setError(`Recording too short (${finalDuration.toFixed(1)}s). Please record for at least 3 seconds.`);
        setIsProcessing(false);
        return;
      }
      console.log('[MIC TEST] 🔍 DEBUGGING - Audio length:', base64Audio.length, 'Reference:', testSentence);

      const response = await fetch('/api/setup/speech-test/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_data: base64Audio, reference_text: testSentence, session_id: sessionId })
      });

      const data = await response.json();
      console.log('[MIC TEST] 🔍 RAW API RESPONSE:', JSON.stringify(data, null, 2));

      if (data.status === 'complete') {
        setAudioQuality(data.audio_quality?.overall_quality || 0);
        setRecognitionAccuracy(data.recognition_accuracy || 0);
        setTranscribedText(data.transcribed_text || '');
        setFeedback(data.feedback || '');
        setShowResults(true);

        if (data.recognition_accuracy >= 0.8) {
          setStep('complete');
        }
      } else {
        setError('Failed to process recording. Please try again.');
      }
    } catch (err) {
      console.error('Error processing recording:', err);
      setError('Failed to process recording. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  return (
    <div className="flex flex-col items-center gap-6 p-4 w-full">
      <h2 className="text-2xl font-semibold text-foreground">Microphone Test</h2>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg w-full text-center">
          {error}
        </div>
      )}

      {step === 'intro' && (
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">Let&apos;s test your microphone to ensure it&apos;s working properly.</p>
          <button
            onClick={() => setStep('permission')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Start Test
          </button>
        </div>
      )}

      {step === 'permission' && (
        <div className="text-center">
          <h3 className="text-xl mb-4 font-medium text-foreground">Microphone Access</h3>
          <p className="mb-4 text-muted-foreground">Click &quot;Start Test&quot; to begin the microphone test.</p>
          <button
            onClick={() => setStep('quality')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Start Microphone Test
          </button>
        </div>
      )}

      {(step === 'quality' || step === 'recognition') && (
        <div className="text-center max-w-2xl w-full">
          {testSentence && (
            <div className="mb-6 bg-muted/30 p-6 rounded-xl border border-border">
              <p className="text-muted-foreground mb-2 text-sm uppercase tracking-wide font-medium">📢 Please read this slogan aloud:</p>
              <p className="text-2xl font-bold text-foreground">{testSentence}</p>
            </div>
          )}

          <div className="mb-4">
            {isRecording && (
              <div className="text-destructive mb-3 font-medium animate-pulse">
                ⏺ Recording... {recordingDuration.toFixed(1)}s
              </div>
            )}

            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing || !testSentence || !sessionReady}
              className={`px-8 py-3 rounded-full font-bold shadow-sm transition-all text-white ${isRecording
                ? 'bg-destructive hover:bg-destructive/90'
                : isProcessing || !sessionReady
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary hover:bg-primary/90'
                }`}
            >
              {isProcessing ? (
                'Processing...'
              ) : isRecording ? (
                'Stop Recording'
              ) : (
                'Start Recording'
              )}
            </button>
          </div>

          {showResults && recognitionAccuracy > 0 && (
            <div className="mt-8 space-y-6 animate-in fade-in duration-500">
              <h4 className="text-lg font-semibold text-foreground border-b border-border pb-2">Analysis Results</h4>

              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Audio Quality</p>
                  <p className="text-sm font-bold text-foreground">
                    {audioQuality >= 0.8
                      ? 'Excellent'
                      : audioQuality >= 0.6
                        ? 'Fair'
                        : 'Poor'}
                  </p>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-1000 ${audioQuality >= 0.8
                      ? 'bg-green-500'
                      : audioQuality >= 0.6
                        ? 'bg-yellow-500'
                        : 'bg-destructive'
                      }`}
                    style={{ width: `${audioQuality * 100}%` }}
                  />
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <p className="text-sm font-medium text-muted-foreground">Recognition Accuracy</p>
                  <p className="text-sm font-bold text-foreground">
                    {(recognitionAccuracy * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="w-full bg-secondary rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-1000 ${recognitionAccuracy >= 0.8
                      ? 'bg-green-500'
                      : recognitionAccuracy >= 0.6
                        ? 'bg-yellow-500'
                        : 'bg-destructive'
                      }`}
                    style={{ width: `${recognitionAccuracy * 100}%` }}
                  />
                </div>
              </div>

              {showResults && recognitionAccuracy > 0 && (
                <div className="mt-6 text-left bg-card border border-border rounded-xl p-5 shadow-sm">
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Original Text</p>
                    <p className="font-medium text-foreground">{testSentence}</p>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">AI Heard</p>
                    <p className="font-mono text-sm bg-muted p-2 rounded text-foreground">{transcribedText}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    {recognitionAccuracy >= 0.95 && (
                      <p className="text-green-500 font-medium flex items-center">✨ Perfect! Your speech was crystal clear.</p>
                    )}
                    {recognitionAccuracy >= 0.8 && recognitionAccuracy < 0.95 && (
                      <p className="text-green-500 font-medium flex items-center">✓ Great job! Your speech was clear and accurate.</p>
                    )}
                    {recognitionAccuracy >= 0.6 && recognitionAccuracy < 0.8 && (
                      <p className="text-yellow-500 font-medium flex items-center">⚠️ Fair. Try speaking more clearly and slowly.</p>
                    )}
                    {recognitionAccuracy < 0.6 && (
                      <p className="text-destructive font-medium flex items-center">❌ Please try again, speaking clearly and at a normal pace.</p>
                    )}
                  </div>

                  {feedback && (
                    <div className="mt-4 p-3 bg-muted rounded-lg text-sm italic text-muted-foreground">
                      {feedback}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step === 'complete' && (
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h3 className="text-xl font-bold mb-2 text-foreground">Test Complete</h3>
          <p className="text-muted-foreground mb-6">Your microphone is working properly!</p>
          <button
            onClick={onComplete}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-medium transition-colors w-full sm:w-auto"
          >
            Continue to Assessment
          </button>
        </div>
      )}

      {step !== 'intro' && step !== 'complete' && (
        <div className="mt-8 border-t border-border w-full pt-4">
          <button
            onClick={() => {
              setShowResults(false);
              setRecognitionAccuracy(0);
              setAudioQuality(0);
              setTranscribedText('');
              setFeedback('');
              setError(null);
              setStep('intro');
            }}
            className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors flex items-center justify-center w-full"
          >
            ← Start Over
          </button>
        </div>
      )}
    </div>
  );
};
