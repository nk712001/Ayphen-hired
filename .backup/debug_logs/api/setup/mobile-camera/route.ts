import { NextRequest, NextResponse } from 'next/server';
import { mobileStorage, globalMobileConnections } from '../global-storage';

// Simple in-memory rate limiting for mobile camera API
interface RateLimit {
  lastRequest: number;  // Timestamp of last request
  tokens: number;       // Available tokens
  lastRefill: number;   // Timestamp of last token refill
  requestCount: number; // Total number of requests
}

const rateLimits: Record<string, RateLimit> = {};

// Clean up stale rate limits periodically
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 5 * 60 * 1000; // 5 minutes
  
  Object.keys(rateLimits).forEach(key => {
    if (now - rateLimits[key].lastRequest > staleThreshold) {
      delete rateLimits[key];
    }
  });
}, 5 * 60 * 1000);

// Token bucket rate limit function for POST requests - optimized for smoother video
const isRateLimited = (sessionId: string): boolean => {
  const now = Date.now();
  const maxTokens = 30;           // Increased maximum tokens (burst capacity) for smoother video
  const tokenRefillRate = 10;     // Increased tokens per second for video streaming
  const refillInterval = 1000;    // Refill interval in ms (1 second)
  
  // Initialize if this is a new session
  if (!rateLimits[sessionId]) {
    rateLimits[sessionId] = { 
      lastRequest: now, 
      tokens: maxTokens - 1, // Use one token for this request
      lastRefill: now,
      requestCount: 1 // Initialize request count
    };
    return false;
  }
  
  // Update request count and get the limit object
  const limit = rateLimits[sessionId];
  limit.requestCount = (limit.requestCount || 0) + 1;
  
  // Only apply rate limiting after a larger number of requests
  if (limit.requestCount < 100) {
    rateLimits[sessionId] = limit;
    return false; // Not rate limited for the first many requests
  }
  
  // Calculate token refill based on time elapsed
  const timeElapsed = now - limit.lastRefill;
  if (timeElapsed > 0) { // Refill even for small time intervals
    // Calculate how many tokens to add based on time elapsed
    const tokensToAdd = (timeElapsed / refillInterval) * tokenRefillRate;
    
    // Refill tokens up to max
    limit.tokens = Math.min(limit.tokens + tokensToAdd, maxTokens);
    limit.lastRefill = now;
  }
  
  // Check if we have tokens available
  if (limit.tokens > 0) {
    limit.tokens--;
    limit.lastRequest = now;
    return false; // Not rate limited
  } else {
    // Even when out of tokens, allow 50% of requests through to maintain some video
    if (Math.random() < 0.5) {
      limit.lastRequest = now;
      return false;
    }
    // No tokens available, rate limited
    return true;
  }
};

export async function POST(req: NextRequest) {
  try {
    const { sessionId, connected, streamUrl, timestamp, frameData } = await req.json();
    
    // Enhanced session ID validation with detailed logging
    const isValidSessionId = sessionId && 
                            sessionId !== 'null' && 
                            sessionId !== 'undefined' && 
                            sessionId.trim() !== '' && 
                            sessionId.length > 10;
    
    if (!isValidSessionId) {
      console.error('Session ID is invalid - rejecting mobile-camera POST request:', {
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
    
    // Apply rate limiting
    if (isRateLimited(sessionId)) {
      return NextResponse.json(
        { error: 'Too many requests', message: 'Please try again later' },
        { 
          status: 429,
          headers: { 'Retry-After': '1' } // Suggest retry after 1 second
        }
      );
    }
    
    // Process the connection status update
    console.log(`Mobile camera connection update for session ${sessionId}: ${connected ? 'connected' : 'disconnected'}`);
    
    // Update the global storage with the connection status
    const effectiveStreamUrl = connected ? `/api/setup/mobile-stream/${sessionId}` : null;
    mobileStorage.updateConnection(sessionId, connected, effectiveStreamUrl);
    
    // If connected and we have frame data, update the frame
    if (connected && frameData) {
      // Add the real frame data from the mobile device
      mobileStorage.updateFrame(sessionId, frameData);
      console.log(`Added real frame data for session: ${sessionId}`);
    }
    
    // Return success
    return NextResponse.json({
      success: true,
      message: `Mobile camera ${connected ? 'connected' : 'disconnected'} successfully`,
      sessionId,
      timestamp: Date.now(),
      frameCount: globalMobileConnections[sessionId]?.frameCount || 0
    });
  } catch (error) {
    console.error('Error processing mobile camera connection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
