import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { session_id, secondary_camera_required } = data;

    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      );
    }

    // Call the AI service to configure camera settings
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    const response = await fetch(`${aiServiceUrl}/setup/camera/configure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id,
        secondary_camera_required: secondary_camera_required || false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('AI service error:', errorData);
      return NextResponse.json(
        { error: 'Failed to configure camera', details: errorData },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error configuring camera:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
