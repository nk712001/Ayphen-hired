import { NextRequest, NextResponse } from 'next/server';
import { mobileStorage, globalMobileFrames, globalMobileConnections } from '@/app/api/setup/global-storage';

// Rate limiting settings - store last request time for each session
const rateLimitMap: Record<string, number> = {};
const MIN_REQUEST_INTERVAL = 200; // ms between requests

// Base64 encoded placeholder image (green background with text)
// This is a small green image with "Mobile Camera Connected" text
const PLACEHOLDER_FRAME = 'iVBORw0KGgoAAAANSUhEUgAAAUAAAADwCAYAAABxLb1rAAABhGlDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TpSIVBTuIOGSoThZERRy1CkWoEGqFVh1MbvqhNGlIUlwcBdeCgx+LVQcXZ10dXAVB8APE0clJ0UVK/F9SaBHjwXE/3t173L0DhGaVqWbPOKBqlpFOxMVcflUMvCKIEMIYQkRipp7MLGbhOb7u4ePrXZxneZ/7cwwoBZMBPpF4jumGRbxBPLNp6Zz3iSOsJCnE58QTBl2Q+JHrsstvnEsOCzwzYmbSPHGEWCx1sdzFrGyoxFPEUUXVKN+fc1nhvMVZrdZZ+578heGCtpLlOs0RJLCEJFIQIaOOCqqwEKdVI8VEmvbjHv4Rx58il0yuChg5FlCDBunxg//B727N4uSEmxROAv0vtv0xCgR2gVbDtr+Pbbt1AgSegSut499oAjOfpDc6WvQIGNwGLq47mrIHXO4AQ0+GbMqu5Kcp5PPA+xl9UxYI3QJ9a15vzX2cPgBp6ip5AxwcAqMlyl73eHdPd2//nmn39wOZXHKjm0XKWg==';

/**
 * POST handler for receiving frame data from the mobile camera
 * This route is used to receive frame data from the mobile camera for a given session ID
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    
    if (!sessionId) {
      console.error('Session ID is missing in mobile-frame POST request');
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Prevent 'null' string from being used as a session ID
    if (sessionId === 'null') {
      console.error('Session ID is literally "null" string in mobile-frame POST request - rejecting');
      return NextResponse.json({ error: 'Invalid session ID: "null"' }, { status: 400 });
    }
    
    // Apply rate limiting
    const now = Date.now();
    const lastRequest = rateLimitMap[sessionId] || 0;
    const timeSinceLastRequest = now - lastRequest;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      console.log(`Rate limiting request for session ${sessionId}, last request was ${timeSinceLastRequest}ms ago`);
      return NextResponse.json({ 
        error: 'Too many requests', 
        retryAfter: MIN_REQUEST_INTERVAL - timeSinceLastRequest 
      }, { 
        status: 429,
        headers: {
          'Retry-After': `${(MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000}`,
          'X-RateLimit-Limit': `${1000 / MIN_REQUEST_INTERVAL} per second`,
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': `${now + (MIN_REQUEST_INTERVAL - timeSinceLastRequest)}`
        }
      });
    }
    
    // Update rate limit timestamp
    rateLimitMap[sessionId] = now;
    
    // Parse the request body
    let frameData, timestamp;
    
    try {
      const body = await req.json();
      frameData = body.frameData;
      timestamp = body.timestamp;
      
      console.log(`Mobile frame data received for session: ${sessionId}, data length: ${frameData ? frameData.length : 0}`);
    } catch (error) {
      console.error('Error parsing request body:', error);
      
      // Try to get the body as text if JSON parsing fails
      try {
        const textBody = await req.text();
        console.log(`Received non-JSON body, length: ${textBody.length}`);
        
        // If the body starts with 'data:image', it might be a direct data URL
        if (textBody.startsWith('data:image')) {
          const parts = textBody.split(',');
          if (parts.length > 1) {
            frameData = parts[1]; // Extract the base64 part
            console.log('Extracted frame data from data URL');
          }
        }
      } catch (e) {
        console.error('Error reading request body as text:', e);
      }
    }
    
    // If we still don't have frame data, return an error
    if (!frameData) {
      console.log('No frame data found in request');
      return NextResponse.json({ 
        error: 'Frame data is required',
        received: req.headers.get('content-type')
      }, { status: 400 });
    }
    
    console.log(`Processing frame data for session: ${sessionId}, data length: ${frameData.length}`);
    
    // Ensure the connection is marked as connected
    const effectiveStreamUrl = `/api/setup/mobile-stream/${sessionId}`;
    mobileStorage.updateConnection(sessionId, true, effectiveStreamUrl);
    
    // Update the global storage with the frame data
    mobileStorage.updateFrame(sessionId, frameData);
    
    // Log all active connections and frames
    console.log(`All connections after update: ${Object.keys(globalMobileConnections).join(', ')}`);
    console.log(`All frames after update: ${Object.keys(globalMobileFrames).join(', ')}`);
    
    // Return success with cache control headers to prevent caching
    return NextResponse.json({
      success: true,
      message: 'Frame data received successfully',
      sessionId,
      timestamp: now,
      frameCount: globalMobileFrames[sessionId]?.frameCount || 0
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Pragma': 'no-cache',
        'Access-Control-Allow-Origin': '*', // Allow cross-origin requests
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Error processing mobile frame data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

/**
 * GET handler for retrieving the latest frame data
 * This allows the setup page to poll for new frames
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    
    if (!sessionId) {
      console.error('Session ID is missing in mobile-frame GET request');
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Prevent 'null' string from being used as a session ID
    if (sessionId === 'null') {
      console.error('Session ID is literally "null" string in mobile-frame GET request - rejecting');
      return NextResponse.json({ error: 'Invalid session ID: "null"' }, { status: 400 });
    }
    
    console.log(`Mobile frame data requested for session: ${sessionId}`);
    console.log(`All available frames: ${Object.keys(globalMobileFrames).join(', ')}`);
    
    // Check if the frame exists
    const frame = globalMobileFrames[sessionId];
    if (frame) {
      console.log(`Frame found for session ${sessionId}, frameCount: ${frame.frameCount}, timestamp: ${new Date(frame.timestamp).toISOString()}`);
      
      // Update the connection's lastAccessed timestamp
      const connection = globalMobileConnections[sessionId];
      if (connection) {
        connection.lastAccessed = Date.now();
      } else {
        // If we have a frame but no connection, create a connection
        mobileStorage.updateConnection(sessionId, true, `/api/setup/mobile-stream/${sessionId}`);
        console.log(`Created connection from frame request for session: ${sessionId}`);
      }
      
      // Return the frame data with cache control headers
      return NextResponse.json({
        frameData: frame.frameData,
        timestamp: frame.timestamp,
        frameCount: frame.frameCount || 0
      }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      });
    } else {
      // No frame found - check if we have a connection and return a placeholder
      const connection = globalMobileConnections[sessionId];
      if (connection && connection.connected) {
        console.log(`No frame but connection exists for session ${sessionId}, returning placeholder`);
        
        // Create a placeholder frame in the storage
        mobileStorage.updateFrame(sessionId, PLACEHOLDER_FRAME);
        
        return NextResponse.json({
          frameData: PLACEHOLDER_FRAME,
          timestamp: Date.now(),
          frameCount: 1,
          isPlaceholder: true
        }, {
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'Pragma': 'no-cache'
          }
        });
      } else {
        // No frame or connection found
        console.log(`No frame or connection found for session: ${sessionId}, returning 404`);
        return NextResponse.json({ error: 'No frame data found' }, { status: 404 });
      }
    }
  } catch (error) {
    console.error('Error retrieving mobile frame data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
