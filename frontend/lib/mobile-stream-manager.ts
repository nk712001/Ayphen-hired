/**
 * Enhanced Mobile Stream Manager
 * Handles QR-based mobile connection with dual window streaming at 30 FPS
 * Provides automatic connection, reconnection logic, and performance optimization
 */

export interface StreamWindow {
  id: string;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  videoElement?: HTMLVideoElement;
  lastFrameTime: number;
  frameCount: number;
  fps: number;
}

export interface ConnectionMetrics {
  connected: boolean;
  frameRate: number;
  latency: number;
  droppedFrames: number;
  totalFrames: number;
  connectionTime: number;
  lastFrameReceived: number;
}

export interface MobileStreamConfig {
  sessionId: string;
  targetFPS: number;
  maxRetries: number;
  reconnectDelay: number;
  frameTimeout: number;
  qualitySettings: {
    width: number;
    height: number;
    compression: number;
  };
}

export class MobileStreamManager {
  private config: MobileStreamConfig;
  private streamWindows: Map<string, StreamWindow> = new Map();
  private connectionMetrics: ConnectionMetrics;
  private frameInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;
  private retryCount: number = 0;
  private frameBuffer: Map<number, string> = new Map();
  private expectedFrameSequence: number = 0;
  private onConnectionChange?: (connected: boolean) => void;
  private onMetricsUpdate?: (metrics: ConnectionMetrics) => void;
  private onError?: (error: string) => void;

  constructor(config: MobileStreamConfig) {
    this.config = {
      ...config,
      targetFPS: config.targetFPS || 30,
      maxRetries: config.maxRetries || 10,
      reconnectDelay: config.reconnectDelay || 2000,
      frameTimeout: config.frameTimeout || 5000,
      qualitySettings: {
        width: config.qualitySettings?.width || 640,
        height: config.qualitySettings?.height || 480,
        compression: config.qualitySettings?.compression || 0.8
      }
    };

    this.connectionMetrics = {
      connected: false,
      frameRate: 0,
      latency: 0,
      droppedFrames: 0,
      totalFrames: 0,
      connectionTime: 0,
      lastFrameReceived: 0
    };

    this.initializeConnection();
  }

  /**
   * Validate session ID
   */
  private isValidSessionId(sessionId: string): boolean {
    return Boolean(sessionId) && 
           sessionId !== 'null' && 
           sessionId !== 'undefined' && 
           sessionId.trim() !== '' &&
           sessionId.length > 5; // Basic length check
  }

  /**
   * Initialize the mobile connection with automatic detection
   */
  private async initializeConnection(): Promise<void> {
    console.log(`[MobileStreamManager] Initializing connection for session: ${this.config.sessionId}`);
    
    // Validate session ID before proceeding
    if (!this.isValidSessionId(this.config.sessionId)) {
      const error = `Invalid session ID: "${this.config.sessionId}"`;
      console.error('[MobileStreamManager]', error);
      this.handleError(error);
      return;
    }
    
    try {
      // Check if mobile is already connected
      const connectionStatus = await this.checkMobileConnection();
      
      if (connectionStatus.connected) {
        console.log('[MobileStreamManager] Mobile already connected, starting streams');
        await this.startStreaming();
      } else {
        console.log('[MobileStreamManager] Mobile not connected, starting polling');
        this.startConnectionPolling();
      }
    } catch (error) {
      console.error('[MobileStreamManager] Failed to initialize connection:', error);
      this.handleError(`Initialization failed: ${error}`);
    }
  }

  /**
   * Start polling for mobile connection
   */
  private startConnectionPolling(): void {
    const pollInterval = setInterval(async () => {
      try {
        const connectionStatus = await this.checkMobileConnection();
        
        if (connectionStatus.connected && !this.isConnected) {
          console.log('[MobileStreamManager] Mobile connection detected!');
          clearInterval(pollInterval);
          await this.startStreaming();
        }
      } catch (error) {
        console.warn('[MobileStreamManager] Connection polling error:', error);
      }
    }, 1000); // Poll every second

    // Stop polling after 5 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (!this.isConnected) {
        this.handleError('Connection timeout - mobile device not found');
      }
    }, 300000);
  }

  /**
   * Check mobile connection status
   */
  private async checkMobileConnection(): Promise<{ connected: boolean; frameCount?: number }> {
    // Double-check session ID before making request
    if (!this.isValidSessionId(this.config.sessionId)) {
      throw new Error(`Invalid session ID for connection check: "${this.config.sessionId}"`);
    }

    const response = await fetch(
      `/api/setup/check-mobile-camera?sessionId=${encodeURIComponent(this.config.sessionId)}&enhanced=true&t=${Date.now()}`,
      {
        headers: { 'Cache-Control': 'no-cache' }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Connection check failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`[MobileStreamManager] Connection check result:`, result);
    return result;
  }

  /**
   * Start streaming to dual windows
   */
  private async startStreaming(): Promise<void> {
    if (this.isConnected) {
      console.log('[MobileStreamManager] Already streaming');
      return;
    }

    console.log('[MobileStreamManager] Starting dual window streaming at 30 FPS');
    
    this.isConnected = true;
    this.connectionMetrics.connected = true;
    this.connectionMetrics.connectionTime = Date.now();
    this.retryCount = 0;

    // Notify connection change
    this.onConnectionChange?.(true);

    // Start frame fetching at target FPS
    const frameIntervalMs = 1000 / this.config.targetFPS;
    this.frameInterval = setInterval(() => {
      this.fetchAndRenderFrame();
    }, frameIntervalMs);

    // Start heartbeat to maintain connection
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 5000);

    console.log(`[MobileStreamManager] Streaming started with ${frameIntervalMs}ms interval (${this.config.targetFPS} FPS)`);
  }

  /**
   * Fetch frame from mobile and render to all windows
   */
  private async fetchAndRenderFrame(): Promise<void> {
    // Validate session ID before fetching frame
    if (!this.isValidSessionId(this.config.sessionId)) {
      console.error('[MobileStreamManager] Cannot fetch frame with invalid session ID:', this.config.sessionId);
      return;
    }

    try {
      const startTime = Date.now();
      
      const response = await fetch(
        `/api/setup/mobile-frame-enhanced/${encodeURIComponent(this.config.sessionId)}?enhanced=true&windowId=primary&t=${startTime}&r=${Math.random()}`,
        {
          headers: { 
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          signal: AbortSignal.timeout(this.config.frameTimeout)
        }
      );

      if (!response.ok) {
        throw new Error(`Frame fetch failed: ${response.status}`);
      }

      const frameData = await response.json();
      
      if (frameData.frameData) {
        const latency = Date.now() - startTime;
        await this.renderFrameToAllWindows(frameData.frameData, frameData.frameCount || 0);
        this.updateMetrics(latency, frameData.frameCount || 0);
      } else {
        console.warn('[MobileStreamManager] No frame data received');
      }

    } catch (error) {
      console.error('[MobileStreamManager] Frame fetch error:', error);
      this.handleFrameError();
    }
  }

  /**
   * Render frame to all registered stream windows
   */
  private async renderFrameToAllWindows(frameData: string, frameCount: number): Promise<void> {
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        const now = Date.now();
        
        // Render to all stream windows
        this.streamWindows.forEach((window, windowId) => {
          try {
            // Clear canvas
            window.context.fillStyle = '#000';
            window.context.fillRect(0, 0, window.canvas.width, window.canvas.height);
            
            // Draw frame
            window.context.drawImage(img, 0, 0, window.canvas.width, window.canvas.height);
            
            // Add overlay information
            this.addFrameOverlay(window, frameCount, now);
            
            // Update window metrics
            window.lastFrameTime = now;
            window.frameCount++;
            
            // Calculate FPS for this window
            if (window.frameCount > 1) {
              const timeDiff = now - (window.lastFrameTime - (1000 / this.config.targetFPS));
              window.fps = 1000 / timeDiff;
            }
            
          } catch (error) {
            console.error(`[MobileStreamManager] Error rendering to window ${windowId}:`, error);
          }
        });
        
        resolve();
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load frame image'));
      };
      
      img.src = `data:image/jpeg;base64,${frameData}`;
    });
  }

  /**
   * Add frame overlay with metrics and timestamp
   */
  private addFrameOverlay(window: StreamWindow, frameCount: number, timestamp: number): void {
    const ctx = window.context;
    
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, window.canvas.width, 120);
    
    // Text styling
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    
    // Frame information
    ctx.fillText(`Frame #${frameCount}`, 10, 20);
    ctx.fillText(`Window: ${window.id}`, 10, 35);
    ctx.fillText(`FPS: ${window.fps.toFixed(1)}`, 10, 50);
    ctx.fillText(`Latency: ${this.connectionMetrics.latency}ms`, 10, 65);
    ctx.fillText(`Time: ${new Date(timestamp).toLocaleTimeString()}`, 10, 80);
    ctx.fillText(`Session: ${this.config.sessionId}`, 10, 95);
    
    // Connection status indicator
    ctx.fillStyle = this.isConnected ? '#4CAF50' : '#F44336';
    ctx.beginPath();
    ctx.arc(window.canvas.width - 20, 20, 8, 0, 2 * Math.PI);
    ctx.fill();
  }

  /**
   * Update connection metrics
   */
  private updateMetrics(latency: number, frameCount: number): void {
    const now = Date.now();
    
    this.connectionMetrics.latency = latency;
    this.connectionMetrics.totalFrames++;
    this.connectionMetrics.lastFrameReceived = now;
    
    // Calculate frame rate
    if (this.connectionMetrics.totalFrames > 1) {
      const timeDiff = now - this.connectionMetrics.connectionTime;
      this.connectionMetrics.frameRate = (this.connectionMetrics.totalFrames * 1000) / timeDiff;
    }
    
    // Notify metrics update
    this.onMetricsUpdate?.(this.connectionMetrics);
  }

  /**
   * Handle frame fetch errors
   */
  private handleFrameError(): void {
    this.connectionMetrics.droppedFrames++;
    
    if (this.retryCount < this.config.maxRetries) {
      this.retryCount++;
      console.log(`[MobileStreamManager] Frame error, retry ${this.retryCount}/${this.config.maxRetries}`);
    } else {
      console.error('[MobileStreamManager] Max retries reached, attempting reconnection');
      this.attemptReconnection();
    }
  }

  /**
   * Attempt to reconnect to mobile device
   */
  private async attemptReconnection(): Promise<void> {
    console.log('[MobileStreamManager] Attempting reconnection...');
    
    this.stopStreaming();
    
    this.reconnectTimeout = setTimeout(async () => {
      try {
        const connectionStatus = await this.checkMobileConnection();
        
        if (connectionStatus.connected) {
          console.log('[MobileStreamManager] Reconnection successful');
          await this.startStreaming();
        } else {
          console.log('[MobileStreamManager] Mobile still not connected, retrying...');
          this.attemptReconnection();
        }
      } catch (error) {
        console.error('[MobileStreamManager] Reconnection failed:', error);
        this.handleError(`Reconnection failed: ${error}`);
      }
    }, this.config.reconnectDelay);
  }

  /**
   * Send heartbeat to maintain connection
   */
  private async sendHeartbeat(): Promise<void> {
    // Validate session ID before sending heartbeat
    if (!this.isValidSessionId(this.config.sessionId)) {
      console.error('[MobileStreamManager] Cannot send heartbeat with invalid session ID:', this.config.sessionId);
      return;
    }

    try {
      await fetch(
        `/api/setup/check-mobile-camera?sessionId=${encodeURIComponent(this.config.sessionId)}&heartbeat=true&t=${Date.now()}`,
        {
          headers: { 'Cache-Control': 'no-cache' }
        }
      );
    } catch (error) {
      console.warn('[MobileStreamManager] Heartbeat failed:', error);
    }
  }

  /**
   * Register a new stream window
   */
  public registerStreamWindow(windowId: string, canvas: HTMLCanvasElement): void {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D context from canvas');
    }

    const streamWindow: StreamWindow = {
      id: windowId,
      canvas,
      context,
      lastFrameTime: 0,
      frameCount: 0,
      fps: 0
    };

    this.streamWindows.set(windowId, streamWindow);
    console.log(`[MobileStreamManager] Registered stream window: ${windowId}`);
  }

  /**
   * Unregister a stream window
   */
  public unregisterStreamWindow(windowId: string): void {
    this.streamWindows.delete(windowId);
    console.log(`[MobileStreamManager] Unregistered stream window: ${windowId}`);
  }

  /**
   * Set event handlers
   */
  public setEventHandlers(handlers: {
    onConnectionChange?: (connected: boolean) => void;
    onMetricsUpdate?: (metrics: ConnectionMetrics) => void;
    onError?: (error: string) => void;
  }): void {
    this.onConnectionChange = handlers.onConnectionChange;
    this.onMetricsUpdate = handlers.onMetricsUpdate;
    this.onError = handlers.onError;
  }

  /**
   * Get current connection metrics
   */
  public getMetrics(): ConnectionMetrics {
    return { ...this.connectionMetrics };
  }

  /**
   * Stop streaming
   */
  private stopStreaming(): void {
    if (this.frameInterval) {
      clearInterval(this.frameInterval);
      this.frameInterval = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    this.isConnected = false;
    this.connectionMetrics.connected = false;
    this.onConnectionChange?.(false);
  }

  /**
   * Handle errors
   */
  private handleError(error: string): void {
    console.error(`[MobileStreamManager] Error: ${error}`);
    this.onError?.(error);
  }

  /**
   * Cleanup and destroy the manager
   */
  public destroy(): void {
    console.log('[MobileStreamManager] Destroying stream manager');
    
    this.stopStreaming();
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.streamWindows.clear();
    this.frameBuffer.clear();
  }
}
