import { NextRequest, NextResponse } from 'next/server';
// Using singleton storage
import { mobileStorage, globalMobileConnections, globalMobileFrames } from '@/app/api/setup/global-storage';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    // Get connection status
    const connection = globalMobileConnections ? globalMobileConnections[sessionId] : null;
    const frame = globalMobileFrames ? globalMobileFrames[sessionId] : null;
    
    return NextResponse.json({
      sessionId,
      connectionExists: !!connection,
      frameExists: !!frame,
      connection: connection ? {
        connected: connection.connected,
        lastUpdated: connection.lastUpdated,
        frameCount: connection.frameCount,
        timestamp: connection.timestamp,
        streamUrl: connection.streamUrl,
        connectionAge: connection.lastUpdated ? Date.now() - connection.lastUpdated : null
      } : null,
      frame: frame ? {
        timestamp: frame.timestamp,
        frameCount: frame.frameCount,
        frameAge: frame.timestamp ? Date.now() - frame.timestamp : null,
        frameDataLength: frame.frameData ? frame.frameData.length : 0
      } : null,
      allConnections: Object.keys(globalMobileConnections || {}),
      allFrames: Object.keys(globalMobileFrames || {})
    });
  } catch (error) {
    console.error('Error testing mobile connection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
