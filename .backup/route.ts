import { NextRequest, NextResponse } from 'next/server';
import { mobileStorage } from '../global-storage';

// Simple in-memory rate limiting
interface RateLimit {
  lastRequest: number;
  tokens: number;
  lastRefill: number;
  requestCount: number;
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

// Token bucket rate limit function for POST requests - optimized for video streaming
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
    // Try to parse the request body
    let sessionId, frameData;
    try {
      const body = await req.json();
      sessionId = body.sessionId;
      frameData = body.frameData;
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    // Validate required fields
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    if (!frameData) {
      return NextResponse.json({ error: 'Frame data is required' }, { status: 400 });
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
    
    // Update the mobile frame in global storage
    mobileStorage.updateFrame(sessionId, frameData);
    
    // Also update the connection status to ensure it's marked as connected
    mobileStorage.updateConnection(sessionId, true, `/api/setup/mobile-stream/${sessionId}`);
    
    // Return success with minimal response to save bandwidth
    return NextResponse.json({
      success: true,
      sessionId
    });
  } catch (error) {
    console.error('Error processing mobile frame:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
