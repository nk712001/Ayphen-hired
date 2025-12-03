import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint for secondary camera AI analysis
 * Sends secondary camera frames to the AI service for comprehensive evaluation
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, frameData } = body;
    
    if (!sessionId || !frameData) {
      return NextResponse.json({ 
        error: 'Session ID and frame data are required' 
      }, { status: 400 });
    }
    
    // Use direct HTTP endpoint instead of WebSocket to avoid connection issues
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'https://127.0.0.1:8000';
    
    try {
      console.log('[HTTP_ANALYSIS] Sending frame to AI service via HTTP');
      console.log('[HTTP_ANALYSIS] AI Service URL:', aiServiceUrl);
      console.log('[HTTP_ANALYSIS] Session ID:', sessionId);
      console.log('[HTTP_ANALYSIS] Frame data length:', frameData.length);
      
      // For Node.js environment, disable SSL verification
      if (typeof process !== 'undefined' && process.env) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      }
      
      // Configure fetch with SSL handling for self-signed certificates
      const fetchOptions: RequestInit = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frameData: frameData
        })
      };
      
      console.log('[HTTP_ANALYSIS] Making request to:', `${aiServiceUrl}/api/secondary-camera-analysis/${sessionId}`);
      
      const response = await fetch(`${aiServiceUrl}/api/secondary-camera-analysis/${sessionId}`, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[HTTP_ANALYSIS] Real AI analysis received via HTTP');
      console.log('[HTTP_ANALYSIS] Analysis result:', result);
      
      return NextResponse.json({
        success: true,
        analysis: result.analysis,
        violation_prevention_status: result.violation_prevention_status,
        timestamp: result.timestamp || Date.now(),
        fallback: false
      });
      
    } catch (error) {
      console.error('[HTTP_ANALYSIS] Error connecting to AI service:', error);
      console.error('[HTTP_ANALYSIS] Error type:', typeof error);
      console.error('[HTTP_ANALYSIS] Error constructor:', error?.constructor?.name);
      
      if (error instanceof Error) {
        console.error('[HTTP_ANALYSIS] Error message:', error.message);
        console.error('[HTTP_ANALYSIS] Error stack:', error.stack);
      }
      
      return NextResponse.json({ 
        error: 'Failed to connect to AI service',
        details: error instanceof Error ? error.message : 'Unknown error',
        errorType: error?.constructor?.name || 'Unknown'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[HTTP_ANALYSIS] Error in secondary camera analysis:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
