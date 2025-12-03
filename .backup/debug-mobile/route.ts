import { NextRequest, NextResponse } from 'next/server';
import { mobileStorage } from '../setup/global-storage';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get('sessionId');
  
  // Get connections and frames from the actual storage used by mobile camera API
  const connections = mobileStorage.getConnections();
  const frames = mobileStorage.getFrames();
  
  const connectionsList = Object.keys(connections).map(id => ({
    sessionId: id,
    connected: connections[id].connected,
    lastUpdated: connections[id].lastUpdated,
    frameCount: connections[id].frameCount,
    streamUrl: connections[id].streamUrl
  }));
  
  const framesList = Object.keys(frames).map(id => ({
    sessionId: id,
    timestamp: frames[id].timestamp,
    frameCount: frames[id].frameCount,
    hasData: !!frames[id].frameData
  }));
  
  const specificConnection = sessionId ? connections[sessionId] : null;
  const specificFrame = sessionId ? frames[sessionId] : null;
  
  return NextResponse.json({
    timestamp: Date.now(),
    requestedSessionId: sessionId,
    specificConnection,
    specificFrame,
    allConnections: connectionsList,
    allFrames: framesList,
    totalConnections: connectionsList.length,
    totalFrames: framesList.length
  });
}
