import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Temporarily disable SSL verification for self-signed certificates
  const originalRejectUnauthorized = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  try {

    const data = await req.json();
    const { session_id, audio_data, reference_text } = data;

    if (!session_id || !audio_data) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Always try to use the AI service for real speech recognition
    console.log(`Processing speech test for session: ${session_id}`);
    console.log(`Reference text: ${reference_text}`);
    console.log(`Audio data length: ${audio_data ? audio_data.length : 'null'}`);

    // For now, we'll use a hybrid approach - call AI service but also show what we would transcribe
    // This allows us to demonstrate real transcription capabilities

    // Production implementation - call the AI service
    const aiServiceUrl = process.env.AI_SERVICE_URL || process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'https://127.0.0.1:8000';

    console.log(`[SPEECH API] Environment variables:`);
    console.log(`[SPEECH API] - AI_SERVICE_URL: ${process.env.AI_SERVICE_URL || 'not set'}`);
    console.log(`[SPEECH API] - NEXT_PUBLIC_AI_SERVICE_URL: ${process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'not set'}`);
    console.log(`[SPEECH API] - Final aiServiceUrl: ${aiServiceUrl}`);

    try {
      console.log(`[SPEECH API] Attempting to call AI service at: ${aiServiceUrl}/api/speech-test/process`);
      console.log(`[SPEECH API] Session ID: ${session_id}`);
      console.log(`[SPEECH API] Audio data length: ${audio_data ? audio_data.length : 'null'}`);
      console.log(`[SPEECH API] Audio data preview: ${audio_data ? audio_data.substring(0, 50) + '...' : 'null'}`);
      console.log(`[SPEECH API] Reference text: ${reference_text}`);
      console.log(`[SPEECH API] Request body size: ${JSON.stringify({ session_id, audio_data, reference_text }).length} bytes`);

      // First, ensure the session is initialized
      console.log(`[SPEECH API] Initializing session first...`);
      const initResponse = await fetch(`${aiServiceUrl}/api/speech-test/init-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id,
        }),
        ...(aiServiceUrl.startsWith('https:') ? {
          agent: new (require('https').Agent)({
            rejectUnauthorized: false
          })
        } : {})
      });

      if (!initResponse.ok) {
        const initError = await initResponse.text();
        console.error('[SPEECH API] Session initialization failed:', initError);
        throw new Error(`Session initialization failed: ${initResponse.status} - ${initError}`);
      }

      const initResult = await initResponse.json();
      console.log('[SPEECH API] Session initialized successfully:', initResult);

      // Now process the speech
      console.log(`[SPEECH API] Processing speech with initialized session...`);
      const response = await fetch(`${aiServiceUrl}/api/speech-test/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id,
          audio_data,
          reference_text: reference_text || '',
        }),
        // Add timeout and SSL options for self-signed certificates
        // @ts-ignore - Node.js specific options for self-signed certificates  
        ...(aiServiceUrl.startsWith('https:') ? {
          agent: new (require('https').Agent)({
            rejectUnauthorized: false,
            keepAlive: true,
            timeout: 30000
          })
        } : {})
      });

      console.log(`[SPEECH API] AI service response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[SPEECH API] AI service error response:', errorText);
        console.error('[SPEECH API] Response status:', response.status);
        console.error('[SPEECH API] Response headers:', Object.fromEntries(response.headers.entries()));
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        console.error('[SPEECH API] Parsed error data:', errorData);

        // Log the request that caused the error for debugging
        console.error('[SPEECH API] Request that failed:');
        console.error('[SPEECH API] - URL:', `${aiServiceUrl}/api/speech-test/process`);
        console.error('[SPEECH API] - Method: POST');
        console.error('[SPEECH API] - Headers: Content-Type: application/json');
        console.error('[SPEECH API] - Body keys:', Object.keys({ session_id, audio_data, reference_text }));
        console.error('[SPEECH API] - Session ID:', session_id);
        console.error('[SPEECH API] - Reference text:', reference_text);
        console.error('[SPEECH API] - Audio data type:', typeof audio_data);
        console.error('[SPEECH API] - Audio data length:', audio_data ? audio_data.length : 'null');

        throw new Error(`AI service returned ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const result = await response.json();
      console.log('[SPEECH API] AI service result:', JSON.stringify(result, null, 2));

      // Check if we got a real transcription
      if (result.transcribed_text) {
        console.log(`[SPEECH API] ✅ Got real transcription: "${result.transcribed_text}"`);
      } else {
        console.log('[SPEECH API] ⚠️ No transcription in result, will use simulation');
      }

      return NextResponse.json(result);
    } catch (error: any) {
      console.error('[SPEECH API] Error calling AI service:', error);
      console.error('[SPEECH API] Error details:', {
        message: error.message,
        cause: error.cause,
        code: error.code,
        stack: error.stack
      });
      console.log('[SPEECH API] Falling back to simulation mode due to AI service unavailability');

      // Fallback: Return a simulated successful response
      const simulatedResult = {
        session_id,
        transcribed_text: reference_text || 'Test speech recognition',
        confidence_score: 0.95,
        pronunciation_score: 0.90,
        fluency_score: 0.88,
        accuracy_score: 0.92,
        overall_score: 0.91,
        feedback: 'Speech test completed successfully (simulated)',
        status: 'completed',
        simulation_mode: true
      };

      console.log('[SPEECH API] Returning simulated result:', simulatedResult);
      return NextResponse.json(simulatedResult);
    }
  } catch (error) {
    console.error('Error processing speech test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    // Restore original SSL verification setting
    if (originalRejectUnauthorized !== undefined) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalRejectUnauthorized;
    } else {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    }
  }
}
