import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory store for mobile connections
const mobileConnections = new Map<string, { connected: boolean; lastSeen: number }>();

// Helper for CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const connection = mobileConnections.get(sessionId);

    if (!connection) {
      return NextResponse.json({ connected: false }, { headers: corsHeaders });
    }

    // Check if connection is recent (within last 30 seconds)
    const isRecent = Date.now() - connection.lastSeen < 30000;

    return NextResponse.json({
      connected: connection.connected && isRecent
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error checking mobile connection:', error);
    return NextResponse.json({ connected: false }, { headers: corsHeaders });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const { connected } = await request.json();

    mobileConnections.set(sessionId, {
      connected: connected || true,
      lastSeen: Date.now()
    });

    return NextResponse.json({ success: true }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error updating mobile connection:', error);
    return NextResponse.json({ error: 'Failed to update connection' }, { status: 500, headers: corsHeaders });
  }
}