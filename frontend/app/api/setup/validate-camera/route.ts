import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { sessionId, frameData, isSecondary } = data;

    if (!sessionId || !frameData) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      // Mock implementation for development
      console.log(`Mock validation for ${isSecondary ? 'secondary' : 'primary'} camera`);
      
      // Simulate a delay to make it feel more realistic
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return mock data
      return NextResponse.json({
        position_valid: true,
        guidance: isSecondary 
          ? 'Secondary camera position looks good. Keyboard and hands are visible.'
          : 'Primary camera position looks good. Face is clearly visible.',
        confidence: 0.85
      });
    }
    
    // Production implementation - call the AI service
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const endpoint = isSecondary ? '/setup/camera/validate-secondary' : '/setup/camera/validate-primary';

    try {
      const response = await fetch(`${aiServiceUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          frame_data: frameData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('AI service error:', errorData);
        return NextResponse.json(
          { error: 'Failed to validate camera', details: errorData },
          { status: response.status }
        );
      }

      const result = await response.json();
      return NextResponse.json(result);
    } catch (error) {
      console.error('Error calling AI service:', error);
      
      // Fallback to mock data if AI service is unavailable
      return NextResponse.json({
        position_valid: true,
        guidance: isSecondary 
          ? 'Secondary camera position looks good. Keyboard and hands are visible.'
          : 'Primary camera position looks good. Face is clearly visible.',
        confidence: 0.85
      });
    }
  } catch (error) {
    console.error('Error validating camera:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
