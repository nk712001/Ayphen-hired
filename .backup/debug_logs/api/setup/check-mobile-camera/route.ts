import { NextRequest, NextResponse } from 'next/server';
import { mobileStorage, globalMobileConnections, globalMobileFrames } from '../global-storage';

// Simple in-memory rate limiting for the check-mobile-camera API
interface RateLimit {
  lastRequest: number;  // Timestamp of last request
  tokens: number;       // Available tokens
  lastRefill: number;   // Timestamp of last token refill
  requestCount: number; // Total number of requests
}

const rateLimits: Record<string, RateLimit> = {};

// Rate limiting function - extremely lenient for check-mobile-camera
const isRateLimited = (sessionId: string): boolean => {
  const now = Date.now();
  const limit = rateLimits[sessionId] || {
    lastRequest: 0,
    tokens: 20,        // Start with 20 tokens (much more lenient)
    lastRefill: now,   // Initialize refill time
    requestCount: 0    // Initialize request count
  };
  
  // Update request count
  limit.requestCount++;
  
  // Only apply rate limiting after a large number of requests
  // This allows many setup requests to go through without delay
  if (limit.requestCount < 100) {
    rateLimits[sessionId] = limit;
    return false; // Not rate limited for the first 100 requests
  }
  
  // Refill tokens very quickly (5 tokens per second)
  const timeSinceRefill = now - limit.lastRefill;
  const tokensToAdd = Math.floor(timeSinceRefill / 200); // 5 tokens per second
  
  if (tokensToAdd > 0) {
    limit.tokens = Math.min(limit.tokens + tokensToAdd, 20); // Max 20 tokens
    limit.lastRefill = now - (timeSinceRefill % 200);
  }
  
  // Check if we have tokens available
  if (limit.tokens > 0) {
    limit.tokens--;
    limit.lastRequest = now;
    rateLimits[sessionId] = limit;
    return false; // Not rate limited
  } else {
    // No tokens available, rate limited
    // But let's be even more lenient - only rate limit 1 in 5 requests when out of tokens
    if (Math.random() < 0.8) {
      return false; // 80% chance to let it through anyway
    }
    rateLimits[sessionId] = limit;
    return true;
  }
};

/**
 * GET handler for checking mobile camera connection status
 * This route is used to check if a mobile camera is connected for a given session ID
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('sessionId');
  
  // COMPREHENSIVE SESSION ID DEBUGGING
  console.log('[API] ===== SESSION ID DEBUG START =====');
  console.log('[API] Request URL:', req.url);
  console.log('[API] All URL search params:', Object.fromEntries(url.searchParams.entries()));
  console.log('[API] Raw sessionId from searchParams.get():', sessionId);
  console.log('[API] sessionId type:', typeof sessionId);
  console.log('[API] sessionId === null:', sessionId === null);
  console.log('[API] sessionId === "null":', sessionId === 'null');
  console.log('[API] sessionId stringified:', JSON.stringify(sessionId));
  console.log('[API] sessionId length:', sessionId?.length);
  console.log('[API] sessionId charCodes:', sessionId ? Array.from(sessionId).map(c => c.charCodeAt(0)) : 'N/A');
  console.log('[API] ===== SESSION ID DEBUG END =====');
  
  // Enhanced session ID validation with detailed logging
  const isValidSessionId = sessionId && 
                          sessionId !== 'null' && 
                          sessionId !== 'undefined' && 
                          sessionId.trim() !== '' && 
                          sessionId.length > 10;
  
  if (!isValidSessionId) {
    console.error('Session ID is invalid - rejecting check-mobile-camera request:', {
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
      },
      connected: false
    }, { status: 400 });
  }
  
  // TEMPORARILY DISABLED RATE LIMITING
  // Uncomment this block to re-enable rate limiting when needed
  /*
  if (isRateLimited(sessionId)) {
    console.log(`Rate limiting check-mobile-camera request for session: ${sessionId}`);
    
    // Return 429 with Retry-After header
    return NextResponse.json(
      { 
        error: 'Too many requests',
        message: 'Please try again later',
        connected: false // Important to include this so the UI doesn't break
      }, 
      { 
        status: 429,
        headers: {
          'Retry-After': '1', // Suggest retry after 1 second
          'Cache-Control': 'no-store, max-age=0'
        }
      }
    );
  }
  */
  
  // Log that rate limiting is disabled
  console.log(`Rate limiting disabled for session: ${sessionId}`);
  
  
  // Check if this is a heartbeat request
  const isHeartbeat = url.searchParams.get('heartbeat') === 'true';
  
  // Parse count parameter
  let count = 0;
  try {
    const countParam = url.searchParams.get('count') || '0';
    count = parseInt(countParam);
    
    // If count is unreasonably large (e.g., a timestamp was passed), reset it
    if (count > 1000000) {
      console.warn(`Received unusually large count: ${count}, resetting to 0`);
      count = 0;
    }
  } catch (e) {
    console.error('Error parsing count parameter:', e);
    count = 0;
  }
  
  // FIXED: Only create connections for actual mobile devices, not desktop polling
  // Check if this request is coming from a mobile device
  const userAgent = req.headers.get('user-agent') || '';
  const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // Only auto-create connections for mobile user agents or heartbeat requests
  if (!globalMobileConnections[sessionId] && (isMobileUserAgent || isHeartbeat)) {
    console.log(`Creating new connection for mobile session: ${sessionId} (mobile: ${isMobileUserAgent}, heartbeat: ${isHeartbeat})`);
    mobileStorage.updateConnection(sessionId, true, `/api/setup/mobile-stream/${sessionId}`);
  } else if (globalMobileConnections[sessionId]) {
    // Update the timestamp on existing connection
    globalMobileConnections[sessionId].lastAccessed = Date.now();
    globalMobileConnections[sessionId].lastUpdated = Date.now();
  }
  
  // For heartbeat requests, return immediate success
  if (isHeartbeat) {
    console.log(`Heartbeat received for session: ${sessionId}`);
    
    // Return a success response with connection info
    return NextResponse.json({
      success: true,
      connected: true,
      heartbeat: true,
      timestamp: Date.now(),
      streamUrl: `/api/setup/mobile-stream/${sessionId}`,
      message: 'Mobile camera connected via heartbeat'
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
  
  // Log the request but not too frequently
  if (count % 5 === 0) {
    console.log(`Mobile camera check #${count} - checking connection for session: ${sessionId}`);
  }
  
  try {
    // Check if debug mode is enabled
    const debug = url.searchParams.get('debug') === 'true';
    
    // Check if we have a connection in the storage
    const connection = globalMobileConnections[sessionId];
    const frame = globalMobileFrames[sessionId];
    const now = Date.now();
    
    console.log(`Checking mobile connection for session: ${sessionId}`);
    console.log(`Connection exists: ${!!connection}, Frame exists: ${!!frame}`);
    console.log(`All connection IDs: ${Object.keys(globalMobileConnections).join(', ')}`);
    console.log(`All frame IDs: ${Object.keys(globalMobileFrames).join(', ')}`);
    console.log('Using singleton storage pattern');
    
    // SPECIAL CASE: If this is a heartbeat request and we have a sessionId, create a connection
    // This helps establish connections from mobile devices that might have issues
    if (isHeartbeat && sessionId) {
      console.log(`Creating connection from heartbeat for session: ${sessionId}`);
      mobileStorage.updateConnection(sessionId, true, `/api/setup/mobile-stream/${sessionId}`);
      
      // Return success immediately
      return NextResponse.json({
        connected: true,
        streamUrl: `/api/setup/mobile-stream/${sessionId}`,
        message: 'Mobile camera connected via heartbeat',
        timestamp: now
      }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      });
    }
    
    // FIXED: Require both connection AND recent frames for true mobile connection
    if (connection && frame) {
      // Get ages if available
      const connectionAge = connection ? now - connection.lastUpdated : Infinity;
      const frameAge = frame ? now - frame.timestamp : Infinity;
      
      console.log(`Connection age: ${connectionAge}ms, Frame age: ${frameAge}ms`);
      
      // STRICTER: Require both connection AND recent frame (within 30 seconds)
      // This ensures we have an actual active mobile camera, not just polling
      if (connectionAge < 30000 && frameAge < 30000 && (frame.frameCount || 0) > 0) {
        console.log(`VERIFIED mobile connection found for session: ${sessionId} with ${frame.frameCount} frames`);
        
        // Return with debug info if requested and add caching headers
        const response = NextResponse.json({
          connected: true,
          streamUrl: `/api/setup/mobile-stream/${sessionId}`,
          frameCount: (frame?.frameCount || 0),
          lastUpdated: frame?.timestamp,
          connectionAge: Math.min(connectionAge, frameAge),
          forcedConnection: false,
          verified: true,
          message: 'Mobile camera connected and verified with active frames',
          debug: debug ? {
            connectionExists: !!connection,
            frameExists: !!frame,
            connectionAge,
            frameAge,
            allConnections: Object.keys(globalMobileConnections),
            allFrames: Object.keys(globalMobileFrames)
          } : undefined
        }, {
          headers: {
            // Cache for a short time to reduce load (2 seconds)
            'Cache-Control': 'private, max-age=2',
            'Vary': 'sessionId'
          }
        });
        
        return response;
      } else {
        console.log(`Connection exists but no recent frames for session: ${sessionId} (connectionAge: ${connectionAge}ms, frameAge: ${frameAge}ms)`);
      }
    } else if (connection && !frame) {
      console.log(`Connection exists but no frames received for session: ${sessionId}`);
    } else if (!connection && frame) {
      console.log(`Frames exist but no active connection for session: ${sessionId}`);
    } else {
      console.log(`No connection or frame found for session: ${sessionId}`);
    }
  } catch (err) {
    console.log('Error checking actual mobile connection:', err);
  }
  
  // No connection found, return not connected with caching headers
  return NextResponse.json({
    connected: false,
    message: 'Waiting for mobile camera connection...',
    attemptsRemaining: 100 // Large number to prevent auto-success
  }, {
    headers: {
      // Cache for a very short time to reduce load (1 second)
      'Cache-Control': 'private, max-age=1',
      'Vary': 'sessionId'
    }
  });
}
