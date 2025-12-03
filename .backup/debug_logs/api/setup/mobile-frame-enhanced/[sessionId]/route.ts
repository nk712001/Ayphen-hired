import { NextRequest, NextResponse } from 'next/server';
import { mobileStorage, globalMobileFrames, globalMobileConnections } from '@/app/api/setup/global-storage';

// Enhanced rate limiting for 30 FPS streaming
const rateLimitMap: Record<string, { lastRequest: number; requestCount: number; windowStart: number }> = {};
const ENHANCED_MIN_INTERVAL = 25; // 40 FPS max (25ms interval) to allow for 30 FPS target with some buffer
const RATE_LIMIT_WINDOW = 1000; // 1 second window
const MAX_REQUESTS_PER_WINDOW = 35; // Allow up to 35 requests per second for 30 FPS + buffer

// Enhanced frame storage for dual window streaming
interface EnhancedFrameData {
  frameData: string;
  timestamp: number;
  frameCount: number;
  enhanced: boolean;
  targetFPS: number;
  quality: {
    width: number;
    height: number;
    compression: number;
  };
  performance: {
    captureTime: number;
    uploadTime: number;
    processingTime: number;
  };
}

const enhancedFrameStorage: Record<string, EnhancedFrameData> = {};

/**
 * Enhanced POST handler for receiving 30 FPS frame data from mobile camera
 * Optimized for dual window streaming with performance metrics
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const startProcessingTime = Date.now();
  
  try {
    const sessionId = params.sessionId;
    
    // Enhanced session ID validation with detailed logging
    const isValidSessionId = sessionId && 
                            sessionId !== 'null' && 
                            sessionId !== 'undefined' && 
                            sessionId.trim() !== '' && 
                            sessionId.length > 10;
    
    if (!isValidSessionId) {
      console.error('Session ID is invalid - rejecting request:', {
        sessionId,
        type: typeof sessionId,
        length: sessionId?.length,
        trimmed: sessionId?.trim()
      });
      
      return NextResponse.json({ 
        error: 'Session ID is invalid', 
        details: {
          received: sessionId,
          type: typeof sessionId,
          length: sessionId?.length,
          reason: !sessionId ? 'missing' : 
                 sessionId === 'null' ? 'null_string' :
                 sessionId === 'undefined' ? 'undefined_string' :
                 sessionId.trim() === '' ? 'empty_string' :
                 sessionId.length <= 10 ? 'too_short' : 'unknown'
        }
      }, { status: 400 });
    }
    
    // Enhanced rate limiting for 30 FPS
    const now = Date.now();
    const rateLimit = rateLimitMap[sessionId] || { 
      lastRequest: 0, 
      requestCount: 0, 
      windowStart: now 
    };
    
    // Reset window if needed
    if (now - rateLimit.windowStart >= RATE_LIMIT_WINDOW) {
      rateLimit.requestCount = 0;
      rateLimit.windowStart = now;
    }
    
    // Check rate limits
    const timeSinceLastRequest = now - rateLimit.lastRequest;
    if (timeSinceLastRequest < ENHANCED_MIN_INTERVAL) {
      return NextResponse.json({ 
        error: 'Rate limited for enhanced streaming', 
        retryAfter: ENHANCED_MIN_INTERVAL - timeSinceLastRequest,
        targetFPS: 30,
        actualInterval: timeSinceLastRequest
      }, { status: 429 });
    }
    
    if (rateLimit.requestCount >= MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json({ 
        error: 'Too many requests in window', 
        retryAfter: RATE_LIMIT_WINDOW - (now - rateLimit.windowStart),
        maxRequestsPerWindow: MAX_REQUESTS_PER_WINDOW
      }, { status: 429 });
    }
    
    // Update rate limiting
    rateLimit.lastRequest = now;
    rateLimit.requestCount++;
    rateLimitMap[sessionId] = rateLimit;
    
    // Parse enhanced request body
    let frameData, timestamp, enhanced, targetFPS, quality, captureTime;
    
    try {
      const body = await req.json();
      frameData = body.frameData;
      timestamp = body.timestamp || now;
      enhanced = body.enhanced || false;
      targetFPS = body.targetFPS || 30;
      quality = body.quality || { width: 640, height: 480, compression: 0.8 };
      captureTime = body.captureTime || timestamp;
      
      console.log(`[Enhanced Mobile Frame] Received frame for session: ${sessionId}, enhanced: ${enhanced}, targetFPS: ${targetFPS}`);
    } catch (error) {
      console.error('[Enhanced Mobile Frame] Error parsing request body:', error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    if (!frameData) {
      return NextResponse.json({ error: 'Frame data is required' }, { status: 400 });
    }
    
    // Update connection with enhanced metadata
    const streamUrl = `/api/setup/mobile-stream-enhanced/${sessionId}`;
    mobileStorage.updateConnection(sessionId, true, streamUrl);
    
    // Update frame storage with enhanced data
    mobileStorage.updateFrame(sessionId, frameData);
    
    // Store enhanced frame data for dual window streaming
    const currentFrame = globalMobileFrames[sessionId];
    const frameCount = currentFrame?.frameCount || 0;
    
    const uploadTime = Date.now();
    const processingTime = uploadTime - startProcessingTime;
    
    enhancedFrameStorage[sessionId] = {
      frameData,
      timestamp,
      frameCount,
      enhanced,
      targetFPS,
      quality,
      performance: {
        captureTime,
        uploadTime,
        processingTime
      }
    };
    
    // Calculate performance metrics
    const fps = frameCount > 0 ? 1000 / (uploadTime - (timestamp - 33.33)) : 0; // Estimate based on 30 FPS target
    const latency = uploadTime - captureTime;
    
    console.log(`[Enhanced Mobile Frame] Frame processed - Count: ${frameCount}, FPS: ${fps.toFixed(1)}, Latency: ${latency}ms`);
    
    // Return enhanced response with performance metrics
    return NextResponse.json({
      success: true,
      message: 'Enhanced frame received successfully',
      sessionId,
      frameCount,
      enhanced: true,
      performance: {
        targetFPS,
        estimatedFPS: Math.min(fps, targetFPS),
        latency,
        processingTime,
        quality
      },
      dualWindowReady: true,
      timestamp: uploadTime
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Enhanced-Streaming': 'true',
        'X-Target-FPS': targetFPS.toString(),
        'X-Frame-Count': frameCount.toString()
      }
    });
    
  } catch (error) {
    console.error('[Enhanced Mobile Frame] Error processing frame:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      enhanced: false 
    }, { status: 500 });
  }
}

/**
 * Enhanced GET handler for retrieving frames for dual window streaming
 * Optimized for 30 FPS delivery with performance metrics
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    const url = new URL(req.url);
    const enhanced = url.searchParams.get('enhanced') === 'true';
    const windowId = url.searchParams.get('windowId') || 'primary';
    
    // Enhanced session ID validation for GET requests
    const isValidSessionId = sessionId && 
                            sessionId !== 'null' && 
                            sessionId !== 'undefined' && 
                            sessionId.trim() !== '' && 
                            sessionId.length > 10;
    
    if (!isValidSessionId) {
      console.error('Session ID is invalid - rejecting GET request:', {
        sessionId,
        type: typeof sessionId,
        length: sessionId?.length,
        trimmed: sessionId?.trim()
      });
      
      return NextResponse.json({ 
        error: 'Session ID is invalid', 
        details: {
          received: sessionId,
          type: typeof sessionId,
          length: sessionId?.length,
          reason: !sessionId ? 'missing' : 
                 sessionId === 'null' ? 'null_string' :
                 sessionId === 'undefined' ? 'undefined_string' :
                 sessionId.trim() === '' ? 'empty_string' :
                 sessionId.length <= 10 ? 'too_short' : 'unknown'
        }
      }, { status: 400 });
    }
    
    console.log(`[Enhanced Mobile Frame GET] Retrieving frame for session: ${sessionId}, enhanced: ${enhanced}, window: ${windowId}`);
    
    // Check for enhanced frame data first
    const enhancedFrame = enhancedFrameStorage[sessionId];
    const standardFrame = globalMobileFrames[sessionId];
    
    if (enhancedFrame || standardFrame) {
      const frame = enhancedFrame || standardFrame;
      const connection = globalMobileConnections[sessionId];
      
      // Update connection access time
      if (connection) {
        connection.lastAccessed = Date.now();
      }
      
      // Prepare response data
      const responseData = {
        frameData: frame.frameData,
        timestamp: frame.timestamp,
        frameCount: frame.frameCount || 0,
        enhanced: enhancedFrame ? enhancedFrame.enhanced : false,
        windowId,
        dualWindowSupported: true
      };
      
      // Add enhanced metadata if available
      if (enhancedFrame) {
        Object.assign(responseData, {
          targetFPS: enhancedFrame.targetFPS,
          quality: enhancedFrame.quality,
          performance: enhancedFrame.performance,
          estimatedFPS: enhancedFrame.frameCount > 0 ? 
            1000 / (Date.now() - enhancedFrame.timestamp) : 0
        });
      }
      
      console.log(`[Enhanced Mobile Frame GET] Frame delivered - Count: ${responseData.frameCount}, Enhanced: ${responseData.enhanced}`);
      
      return NextResponse.json(responseData, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache',
          'X-Enhanced-Streaming': enhancedFrame ? 'true' : 'false',
          'X-Dual-Window-Support': 'true',
          'X-Window-ID': windowId
        }
      });
      
    } else {
      // No frame found - check connection and return appropriate response
      const connection = globalMobileConnections[sessionId];
      
      if (connection && connection.connected) {
        console.log(`[Enhanced Mobile Frame GET] No frame but connection exists for session ${sessionId}`);
        
        // Return placeholder for enhanced streaming
        const placeholderResponse = {
          frameData: 'iVBORw0KGgoAAAANSUhEUgAAAUAAAADwCAYAAABxLb1rAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TpSIVBTuIOGSoThZERRy1CkWoEGqFVh1MbvqhNGlIUlwcBdeCgx+LVQcXZ10dXAVB8APE0clJ0UVK',
          timestamp: Date.now(),
          frameCount: 1,
          isPlaceholder: true,
          enhanced: enhanced,
          windowId,
          dualWindowSupported: true,
          message: 'Waiting for enhanced mobile camera frames'
        };
        
        return NextResponse.json(placeholderResponse, {
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'Pragma': 'no-cache',
            'X-Enhanced-Streaming': 'placeholder',
            'X-Dual-Window-Support': 'true'
          }
        });
      } else {
        console.log(`[Enhanced Mobile Frame GET] No frame or connection found for session: ${sessionId}`);
        return NextResponse.json({ 
          error: 'No enhanced frame data found',
          enhanced: false,
          dualWindowSupported: false 
        }, { status: 404 });
      }
    }
    
  } catch (error) {
    console.error('[Enhanced Mobile Frame GET] Error retrieving frame:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      enhanced: false 
    }, { status: 500 });
  }
}

/**
 * Enhanced OPTIONS handler for CORS with dual window streaming support
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Enhanced-Streaming, X-Window-ID',
      'Access-Control-Expose-Headers': 'X-Enhanced-Streaming, X-Dual-Window-Support, X-Target-FPS, X-Frame-Count',
      'X-Enhanced-Streaming-Support': 'true',
      'X-Dual-Window-Support': 'true',
      'X-Max-FPS': '30'
    }
  });
}
