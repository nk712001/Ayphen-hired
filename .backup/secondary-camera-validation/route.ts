import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore - WebSocket types not available
import WebSocket from 'ws';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, frameData } = await request.json();
    
    if (!sessionId || !frameData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing sessionId or frameData' 
      }, { status: 400 });
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'https://127.0.0.1:8000';
    
    // Create WebSocket connection to AI service for validation
    const validationResult = await new Promise((resolve, reject) => {
      const ws = new WebSocket(`${aiServiceUrl.replace('https', 'wss').replace('http', 'ws')}/ws/proctor/${sessionId}`, {
        rejectUnauthorized: false // For self-signed certificates
      });
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Validation timeout'));
      }, 10000); // 10 second timeout
      
      ws.on('open', () => {
        console.log('[VALIDATION API] WebSocket connected for validation');
        // Send secondary camera validation request
        ws.send(JSON.stringify({
          type: 'validate_secondary_camera',
          data: frameData
        }));
      });
      
      ws.on('message', (data: any) => {
        try {
          clearTimeout(timeout);
          const result = JSON.parse(data.toString());
          console.log('[VALIDATION API] Received validation result:', result);
          ws.close();
          resolve(result);
        } catch (error: any) {
          console.error('[VALIDATION API] Failed to parse validation response:', error);
          ws.close();
          reject(error);
        }
      });
      
      ws.on('error', (error: any) => {
        clearTimeout(timeout);
        console.error('[VALIDATION API] WebSocket error:', error);
        reject(error);
      });
      
      ws.on('close', () => {
        clearTimeout(timeout);
      });
    });

    return NextResponse.json({
      success: true,
      ...(typeof validationResult === 'object' && validationResult !== null ? validationResult : {})
    });

  } catch (error) {
    console.error('[VALIDATION API] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
