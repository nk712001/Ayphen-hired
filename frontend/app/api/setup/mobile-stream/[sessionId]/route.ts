import { NextRequest, NextResponse } from 'next/server';

// Import the singleton storage for mobile camera frames
// This allows us to access the frames stored by the mobile camera
import { mobileStorage, globalMobileFrames, globalMobileConnections } from '@/app/api/setup/global-storage';

// Base64 encoded placeholder image (green background with text)
const PLACEHOLDER_FRAME = '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';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    console.log(`Mobile stream request received for session: ${sessionId}`);
    
    // Check if the connection exists in global storage
    const connection = globalMobileConnections[sessionId];
    const frame = globalMobileFrames[sessionId];
    const now = Date.now();
    
    // If we have a frame, return it regardless of connection status
    // This makes the system more resilient to temporary connection issues
    if (frame) {
      // Check if frame is stale (more than 120 seconds old - increased for resilience)
      // But always return the frame even if stale - better to have old data than no data
      if (now - frame.timestamp > 120000) {
        console.log(`Stale frame data for session: ${sessionId}, age: ${now - frame.timestamp}ms`);
        // For stale frames, return the frame anyway but with a warning
        return NextResponse.json({
          frameData: frame.frameData,
          timestamp: frame.timestamp,
          frameCount: frame.frameCount,
          warning: 'Frame data is stale',
          staleTime: now - frame.timestamp,
          connected: true // Force connected status
        }, {
          headers: {
            'Cache-Control': 'no-store, max-age=0',
            'Pragma': 'no-cache'
          }
        });
      }
      
      console.log(`Returning frame data for session: ${sessionId}, frame count: ${frame.frameCount}`);
      
      // Update the connection's lastAccessed timestamp to keep it fresh
      if (connection) {
        connection.lastAccessed = now;
      } else {
        // If we have a frame but no connection, create a connection
        mobileStorage.updateConnection(sessionId, true, `/api/setup/mobile-stream/${sessionId}`);
        console.log(`Created connection from frame data for session: ${sessionId}`);
      }
      
      return NextResponse.json({
        frameData: frame.frameData,
        timestamp: frame.timestamp,
        frameCount: frame.frameCount
      }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      });
    } else if (connection && connection.connected) {
      // We have a connection but no frame - return a placeholder frame
      console.log(`Connection exists but no frame data for session: ${sessionId}, returning placeholder`);
      return NextResponse.json({
        frameData: PLACEHOLDER_FRAME,
        timestamp: now,
        frameCount: 0,
        warning: 'Using placeholder frame',
        connected: true
      }, {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      });
    } else {
      // No connection or frame exists - return 404
      console.log(`No connection or frame found for session: ${sessionId}, returning 404`);
      return NextResponse.json({
        error: 'No mobile camera connection found',
        connected: false
      }, { status: 404 });
    }
  } catch (error) {
    console.error('Error getting mobile camera stream:', error);
    // Return error status
    return NextResponse.json({
      error: 'Error processing mobile camera stream',
      connected: false
    }, { status: 500 });
  }
}
