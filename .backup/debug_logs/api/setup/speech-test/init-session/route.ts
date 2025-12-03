import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { session_id } = data;

    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing session_id parameter' },
        { status: 400 }
      );
    }

    console.log(`[INIT SESSION] Initializing AI session: ${session_id}`);

    // Call the AI service to initialize the session
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'https://localhost:8000';
    
    try {
      const response = await fetch(`${aiServiceUrl}/api/speech-test/init-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id,
        }),
        signal: AbortSignal.timeout(5000), // 5 second timeout
        // @ts-ignore - Node.js specific options for self-signed certificates
        ...(process.env.NODE_ENV === 'development' && {
          agent: new (require('https').Agent)({
            rejectUnauthorized: false
          })
        })
      });

      console.log(`[INIT SESSION] AI service response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('[INIT SESSION] AI service error:', errorData);
        throw new Error(`AI service returned ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      console.log('[INIT SESSION] ✅ Session initialized successfully:', result);
      
      return NextResponse.json(result);
    } catch (error) {
      console.error('[INIT SESSION] Error calling AI service:', error);
      
      // Return error so frontend knows session is not ready
      return NextResponse.json(
        { 
          status: 'error',
          message: 'AI service unavailable. Please try again later.',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error initializing session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
