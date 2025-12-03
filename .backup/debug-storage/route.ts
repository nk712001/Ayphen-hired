import { NextRequest, NextResponse } from 'next/server';
import { mobileStorage, globalMobileConnections, globalMobileFrames } from '@/app/api/setup/global-storage';

export async function GET(req: NextRequest) {
  try {
    // Get all session IDs
    const connectionIds = Object.keys(globalMobileConnections || {});
    const frameIds = Object.keys(globalMobileFrames || {});
    
    // Get current timestamp
    const now = Date.now();
    
    // Check for problematic session IDs
    const nullSessionId = connectionIds.includes('null');
    const undefinedSessionId = connectionIds.includes('undefined');
    
    // Create a detailed report
    const report = {
      timestamp: now,
      formattedTime: new Date(now).toLocaleString(),
      environment: process.env.NODE_ENV || 'unknown',
      hasProblematicIds: nullSessionId || undefinedSessionId,
      problematicIds: {
        hasNullSessionId: nullSessionId,
        hasUndefinedSessionId: undefinedSessionId
      },
      connections: {
        count: connectionIds.length,
        sessionIds: connectionIds,
        details: connectionIds.map(id => ({
          sessionId: id,
          isProblematic: id === 'null' || id === 'undefined',
          connected: globalMobileConnections[id].connected,
          lastUpdated: globalMobileConnections[id].lastUpdated,
          age: now - globalMobileConnections[id].lastUpdated,
          frameCount: globalMobileConnections[id].frameCount || 0,
          streamUrl: globalMobileConnections[id].streamUrl
        }))
      },
      frames: {
        count: frameIds.length,
        sessionIds: frameIds,
        details: frameIds.map(id => ({
          sessionId: id,
          isProblematic: id === 'null' || id === 'undefined',
          timestamp: globalMobileFrames[id].timestamp,
          age: now - globalMobileFrames[id].timestamp,
          frameCount: globalMobileFrames[id].frameCount || 0,
          dataLength: globalMobileFrames[id].frameData ? globalMobileFrames[id].frameData.length : 0
        }))
      },
      // Check for matching session IDs
      matchingSessions: connectionIds.filter(id => frameIds.includes(id))
    };
    
    return NextResponse.json(report);
  } catch (error) {
    console.error('Error in debug storage endpoint:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
