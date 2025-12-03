import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, frameData } = body;

    if (!sessionId || !frameData) {
      return NextResponse.json(
        { success: false, error: 'Missing sessionId or frameData' },
        { status: 400 }
      );
    }

    console.log('[PRIMARY_CAMERA_API] Analyzing primary camera frame for session:', sessionId);
    console.log('[PRIMARY_CAMERA_API] Frame data length:', frameData.length);

    // Call the AI service primary camera analysis endpoint
    const aiServiceUrl = `https://127.0.0.1:8000/api/primary-camera-analysis/${sessionId}`;
    
    const response = await fetch(aiServiceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        frameData: frameData
      }),
      // Handle self-signed certificates
      // @ts-ignore
      rejectUnauthorized: false
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PRIMARY_CAMERA_API] AI service error:', response.status, errorText);
      return NextResponse.json(
        { 
          success: false, 
          error: `AI service error: ${response.status}`,
          details: errorText
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('[PRIMARY_CAMERA_API] Analysis result:', result);

    if (result.status === 'success') {
      return NextResponse.json({
        success: true,
        analysis: result.analysis,
        timestamp: result.timestamp
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: result.message || 'Analysis failed',
          details: result
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[PRIMARY_CAMERA_API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
