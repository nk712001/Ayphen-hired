type ViolationType = 'no_face' | 'multiple_faces' | 'gaze_violation' | 'prohibited_object' | 'continuous_speech' | 'suspicious_sound';
type ViolationSeverity = 'critical' | 'high' | 'medium' | 'low';

interface Violation {
  type: ViolationType;
  severity: ViolationSeverity;
  confidence: number;
  message?: string;
  details?: any;
}

interface ProctorMetrics {
  face_confidence: number;
  gaze_score: number;
  objects_detected: number;
  voice_activity_level?: number;
}

interface ProctorResult {
  status: 'clear' | 'violation' | 'error';
  violations: Violation[];
  metrics: ProctorMetrics;
  message?: string;
}

export class ProctorClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private sessionId: string;
  private onViolation: (violation: Violation) => void;
  private onMetrics: (metrics: ProctorMetrics) => void;
  private onConnectionChange: (status: 'connected' | 'disconnected' | 'reconnecting') => void;

  constructor(
    sessionId: string,
    onViolation: (violation: Violation) => void,
    onMetrics: (metrics: ProctorMetrics) => void,
    onConnectionChange: (status: 'connected' | 'disconnected' | 'reconnecting') => void
  ) {
    this.sessionId = sessionId;
    this.onViolation = onViolation;
    this.onMetrics = onMetrics;
    this.onConnectionChange = onConnectionChange;
  }

  private connectionAttempt = 0;
  private maxConnectionAttempts = 1;
  private useFallbackProtocol = false;
  private useTestServer = false;
  private useHttpFallback = false;

  public connect(): void {
    try {
      // Check if we're in a secure context
      const isSecureContext = typeof window !== 'undefined' && window.isSecureContext;
      console.log(`Running in ${isSecureContext ? 'secure' : 'non-secure'} context`);
      console.log(`Page protocol: ${typeof window !== 'undefined' ? window.location.protocol : 'unknown'}`);

      // If we are already in fallback mode, don't try WS
      if (this.useHttpFallback) {
        console.log('Skipping WebSocket connection (HTTP fallback active)');
        this.onConnectionChange('connected');
        return;
      }

      // Use the Next.js proxy for WebSockets to avoid SSL/Certificate issues
      // The proxy is configured in next.config.js to forward /ws-proxy/* to http://127.0.0.1:8000/*
      const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const protocol = isSecure ? 'wss:' : 'ws:';
      const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';

      // Construct URL using the proxy path
      // e.g., wss://localhost:3000/ws-proxy/ws/proctor/sessionId
      // Note: backend path is /ws/proctor/..., so we append that to /ws-proxy
      const wsUrl = `${protocol}//${host}/ws-proxy/ws/proctor/${this.sessionId}`;

      console.log('Using WebSocket Proxy for secure connection');
      console.log('Final WebSocket URL:', wsUrl);

      console.log(`Connecting to WebSocket URL (attempt ${this.connectionAttempt + 1}):`, wsUrl);

      // Only enforce WSS in production and not during fallback attempts
      if (process.env.NODE_ENV === 'production' && !wsUrl.startsWith('wss://') && this.connectionAttempt === 0) {
        console.warn('Production environment detected but not using secure WebSocket');
      }

      // Initialize WebSocket with secure protocol
      this.ws = new WebSocket(wsUrl);

      // Set secure WebSocket options
      if (this.ws) {
        // Use binary data for better performance and security
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          // Connection successful
          console.log('WebSocket connection established successfully');
          console.log('Connected to:', this.ws?.url);
          console.log('WebSocket protocol used:', this.ws?.url?.startsWith('wss://') ? 'WSS (Secure)' : 'WS (Insecure)');
          console.log('WebSocket ready state:', this.ws?.readyState);
          this.reconnectAttempts = 0;
          this.connectionAttempt = 0;
          this.onConnectionChange('connected');
        };

        this.ws.onclose = (event) => {
          console.log(`WebSocket closed with code ${event.code}, reason: ${event.reason}`);
          this.onConnectionChange('disconnected');

          // Handle specific close codes
          if (event.code === 1006) {
            console.error('WebSocket closed abnormally (code 1006). This typically indicates:');
            console.error('1. The server might not be running or accessible');
            console.error('2. A network issue prevented the connection from being established');
            console.error('3. The server might have rejected the connection without sending a close frame');
            console.error('4. Certificate validation issues with self-signed certificates');
            console.error('Try running the test server with: ./start-test-server.sh');
            console.error('Then test with: https://localhost:3000/simple-test.html');
            console.error('Or try connecting to the test server at: wss://127.0.0.1:8001/ws/proctor/test-session');
          }

          // Try fallback protocol if this was the first attempt
          if (this.connectionAttempt < this.maxConnectionAttempts) {
            this.connectionAttempt++;
            console.log(`Connection attempt ${this.connectionAttempt} of ${this.maxConnectionAttempts}`);

            // We don't await here since we can't make onclose async
            this.attemptReconnect().catch(error => {
              console.error('Reconnection failed:', error);
            });
          } else {
            console.error('All connection attempts failed');
            console.error('Please ensure the AI service or test server is running');
            console.error('Try running the test server with: ./start-test-server.sh');
            console.error('All WebSocket attempts failed. Switching to HTTP Proxy Fallback.');
            this.useHttpFallback = true;
            this.onConnectionChange('connected'); // Fake connection state for HTTP
            // Also notify that we are live via proxy
            console.log('✅ HTTP Fallback Mode Activated');
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          console.error('WebSocket URL that failed:', this.ws?.url);
          console.error('WebSocket ready state:', this.ws?.readyState);

          // Perform connection diagnostics
          console.error('CONNECTION DIAGNOSTICS:');
          console.error('- Page URL:', typeof window !== 'undefined' ? window.location.href : 'unknown');
          console.error('- Page protocol:', typeof window !== 'undefined' ? window.location.protocol : 'unknown');
          console.error('- Secure context:', typeof window !== 'undefined' ? window.isSecureContext : 'unknown');
          console.error('- AI service URL:', process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'default');

          // Check if this might be a certificate validation issue
          const errorString = error.toString().toLowerCase();
          if (errorString.includes('certificate') || errorString.includes('ssl') || errorString.includes('invalid')) {
            console.error('CERTIFICATE VALIDATION ERROR DETECTED');
            console.error('The browser is rejecting the self-signed certificate used for development.');
            console.error('Possible solutions:');
            console.error('1. Visit https://127.0.0.1:8000/health in your browser and accept the certificate warning');
            console.error('2. Open the accept-certificates.html page in the project root to follow step-by-step instructions');
            console.error('3. For production, use properly signed certificates from a trusted certificate authority');
          }
          // Check if this might be a mixed content issue
          else if (typeof window !== 'undefined' && window.isSecureContext) {
            console.error('This error may be due to mixed content restrictions.');
            console.error('The browser is blocking non-secure WebSocket (ws://) connections from a secure context (https://).');
            console.error('Possible solutions:');
            console.error('1. Run the AI service with HTTPS support');
            console.error('2. Run the frontend without HTTPS (npm run dev instead of npm run dev:secure)');
            console.error('3. Enable mixed content in your browser for development');

            // Try to fetch the AI service health endpoint (via Next.js proxy to avoid CORS/SSL issues)
            if (typeof fetch === 'function') {
              console.error('Checking AI service health via proxy...');
              fetch('/api/ai/health')
                .then(res => {
                  if (res.ok) console.error('AI service is REPORTING HEALTHY via proxy (Browser is blocking direct connection due to SSL/CORS)');
                  else console.error('AI service is UNREACHABLE (Status ' + res.status + ')');
                })
                .catch(e => console.error('AI service health check proxy failed:', e));
            }
          }

          // Don't close the connection here, let the onclose handler deal with reconnection
          // Only force close if we're stuck in a connecting state
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            console.log('WebSocket stuck in connecting state, forcing close');
            this.ws?.close();
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const result: ProctorResult = JSON.parse(event.data);
            this.handleMessage(result);
          } catch (error) {
            console.error('Error processing message:', error);
          }
        };
      }
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private handleMessage(result: any) {
    console.log('Received from backend:', result); // Debug log

    let processedResult: ProctorResult = {
      status: 'clear',
      violations: [],
      metrics: {
        face_confidence: 0,
        gaze_score: 0,
        objects_detected: 0
      }
    };

    // Case 1: Result is already a ProctorResult (has violations array)
    if (result.violations || result.status) {
      processedResult = result as ProctorResult;
    }
    // Case 2: Result is raw analysis object (like HTTP fallback)
    else if (result.analysis) {
      const analysis = result.analysis;

      processedResult.status = analysis.overall_compliance?.status === 'violation' ? 'violation' : 'clear';
      processedResult.metrics = {
        face_confidence: analysis.face_detection?.confidence || 0,
        gaze_score: analysis.gaze_tracking?.gaze_score || 0,
        objects_detected: analysis.object_detection?.detections?.length || 0
      };

      // Infer violations from analysis if not present
      if (analysis.face_detection?.faces_detected === 0) {
        processedResult.violations.push({ type: 'no_face', severity: 'high', confidence: 1.0, message: 'No face detected' });
      }
      if (analysis.object_detection?.detections?.length > 0) {
        processedResult.violations.push({ type: 'prohibited_object', severity: 'high', confidence: 1.0, message: 'Prohibited object detected' });
      }
      if (analysis.gaze_tracking?.gaze_score < 0.3) {
        processedResult.violations.push({ type: 'gaze_violation', severity: 'medium', confidence: 1.0, message: 'Looking away' });
      }

      // Add secondary camera violations if present in top-level result
      if (result.secondary_camera_violations) {
        result.secondary_camera_violations.forEach((v: any) => {
          processedResult.violations.push(v);
        });
      }
    }
    // Case 3: Result is directly the analysis object (sometimes happens with raw socket dumps)
    else if (result.face_detection || result.gaze_tracking) {
      const analysis = result;
      processedResult.metrics = {
        face_confidence: analysis.face_detection?.confidence || 0,
        gaze_score: analysis.gaze_tracking?.gaze_score || 0,
        objects_detected: analysis.object_detection?.detections?.length || 0
      };

      if (analysis.face_detection?.faces_detected === 0) {
        processedResult.violations.push({ type: 'no_face', severity: 'high', confidence: 1.0, message: 'No face detected' });
      }
      if (analysis.object_detection?.detections?.length > 0) {
        processedResult.violations.push({ type: 'prohibited_object', severity: 'high', confidence: 1.0, message: 'Prohibited object detected' });
      }
      if (analysis.gaze_tracking?.gaze_score < 0.3) {
        processedResult.violations.push({ type: 'gaze_violation', severity: 'medium', confidence: 1.0, message: 'Looking away' });
      }
    }

    // Handle violations
    if (processedResult.violations && processedResult.violations.length > 0) {
      console.log('⚠️ Processed violations:', processedResult.violations);
      processedResult.violations.forEach(violation => {
        this.onViolation(violation);
      });
    }

    // Update metrics
    if (processedResult.metrics) {
      // console.log('Updating metrics:', processedResult.metrics); // Reduced log noise
      this.onMetrics(processedResult.metrics);
    }
  }

  private async attemptReconnect(): Promise<void> {
    // Check if we've exceeded reconnect attempts
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.onConnectionChange('reconnecting');
      this.reconnectAttempts++;

      // Add a small delay before reconnecting
      const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

      console.log(`Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts})`);

      // Use a promise to make testing easier
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // Reset connection attempt counter since we're using a different counter for protocol fallback
          this.connect();
          resolve();
        }, delay);
      });
    }
    return Promise.resolve();
  }

  public async sendVideoFrame(frameData: string, secondaryFrameData?: string | null): Promise<void> {
    if (this.useHttpFallback) {
      // Use HTTP Proxy
      try {
        const response = await fetch('/api/ai/proctor/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: this.sessionId,
            frameData,
            secondaryFrameData: secondaryFrameData || undefined
          })
        });

        console.log(`📡 HTTP Proxy: Sent frame (size: ${frameData.length}, secondary: ${!!secondaryFrameData})`);

        if (response.ok) {
          const result = await response.json();
          // Transform API result to match WS result structure if needed
          // The API returns { status: 'success', analysis: {...} }
          // We need to map `analysis` to `ProctorResult`
          if (result.analysis) {
            const analysis = result.analysis;

            // Construct ProctorResult from analysis
            const proctorResult: ProctorResult = {
              status: analysis.overall_compliance?.status === 'violation' ? 'violation' : 'clear',
              violations: [],
              metrics: {
                face_confidence: analysis.face_detection?.confidence || 0,
                gaze_score: analysis.gaze_tracking?.gaze_score || 0,
                objects_detected: analysis.object_detection?.detections?.length || 0
              }
            };

            // Map violations
            // Primary camera risk assessment isn't exactly a list of violations, but we can infer
            if (analysis.face_detection?.faces_detected === 0) {
              proctorResult.violations.push({ type: 'no_face', severity: 'high', confidence: 1.0, message: 'No face detected' });
            }
            if (analysis.object_detection?.detections?.length > 0) {
              proctorResult.violations.push({ type: 'prohibited_object', severity: 'high', confidence: 1.0, message: 'Prohibited object detected' });
            }
            if (analysis.gaze_tracking?.gaze_score < 0.3) {
              proctorResult.violations.push({ type: 'gaze_violation', severity: 'medium', confidence: 1.0, message: 'Looking away' });
            }

            // Map secondary camera violations if present
            if (result.secondary_camera_violations) {
              result.secondary_camera_violations.forEach((v: any) => {
                proctorResult.violations.push(v);
              });
            }

            this.handleMessage(proctorResult);
          }
        }
      } catch (e) {
        console.error('HTTP Fallback Error:', e);
      }
    } else if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'video',
        data: frameData,
        secondary_data: secondaryFrameData || undefined
      }));
    }
  }

  public sendAudioFrame(frameData: string): void {
    if (this.useHttpFallback) {
      // Audio not supported via HTTP proxy yet
      return;
    }
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'audio',
        data: frameData
      }));
    }
  }

  public disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.useHttpFallback = false;
  }
}
