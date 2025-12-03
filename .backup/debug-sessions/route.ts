import { NextRequest, NextResponse } from 'next/server';
import { globalMobileConnections, globalMobileFrames } from '../global-storage';

/**
 * GET handler for debugging session IDs and connections
 * This route helps debug session ID mismatches
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const targetSessionId = url.searchParams.get('sessionId');
  
  console.log('[DEBUG] Session debug requested for:', targetSessionId);
  
  // Get all current connections and frames
  const allConnections = Object.keys(globalMobileConnections);
  const allFrames = Object.keys(globalMobileFrames);
  
  // Detailed connection info
  const connectionDetails = Object.entries(globalMobileConnections).map(([sessionId, connection]) => ({
    sessionId,
    connected: connection.connected,
    lastUpdated: connection.lastUpdated,
    frameCount: connection.frameCount || 0,
    age: Date.now() - connection.lastUpdated
  }));
  
  // Detailed frame info
  const frameDetails = Object.entries(globalMobileFrames).map(([sessionId, frame]) => ({
    sessionId,
    frameCount: frame.frameCount || 0,
    timestamp: frame.timestamp,
    age: Date.now() - frame.timestamp
  }));
  
  // Check if target session exists
  const targetExists = targetSessionId ? {
    inConnections: globalMobileConnections[targetSessionId] ? true : false,
    inFrames: globalMobileFrames[targetSessionId] ? true : false,
    connectionDetails: globalMobileConnections[targetSessionId] || null,
    frameDetails: globalMobileFrames[targetSessionId] || null
  } : null;
  
  const debugInfo = {
    timestamp: Date.now(),
    targetSessionId,
    targetExists,
    summary: {
      totalConnections: allConnections.length,
      totalFrames: allFrames.length,
      activeConnections: connectionDetails.filter(c => c.age < 30000).length,
      recentFrames: frameDetails.filter(f => f.age < 30000).length
    },
    allConnectionIds: allConnections,
    allFrameIds: allFrames,
    connectionDetails,
    frameDetails,
    sessionIdPatterns: {
      uuidFormat: allConnections.filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)),
      emergencyFormat: allConnections.filter(id => id.includes('-') && id.length > 20 && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    }
  };
  
  console.log('[DEBUG] Session debug info:', JSON.stringify(debugInfo, null, 2));
  
  return NextResponse.json(debugInfo, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Pragma': 'no-cache'
    }
  });
}
