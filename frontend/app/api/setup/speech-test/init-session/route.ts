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
    const aiServiceUrl = process.env.AI_SERVICE_URL || process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'https://127.0.0.1:8000';
    
    try {
      const response = await fetch(`${aiServiceUrl}/api/speech-test/init-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id,
        }),
        // @ts-ignore - Node.js specific options for self-signed certificates
        agent: new (require('https').Agent)({
          rejectUnauthorized: false
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
      console.error('[INIT SESSION] AI service unavailable, using fallback mode:', error);
      
      // Return success with fallback mode when AI service is unavailable
      return NextResponse.json({
        status: 'success',
        session_id,
        mode: 'fallback',
        message: 'Session initialized in fallback mode (AI service unavailable)'
      });
    }
  } catch (error) {
    console.error('Error initializing session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
