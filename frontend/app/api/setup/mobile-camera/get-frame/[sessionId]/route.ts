import { NextRequest, NextResponse } from 'next/server';
import { mobileFrames } from '@/lib/mobile-frame-store';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const frameInfo = mobileFrames.get(sessionId);

    if (!frameInfo) {
      return NextResponse.json({ frameData: null, available: false });
    }

    // Check if frame is recent (within last 5 seconds)
    const isRecent = Date.now() - frameInfo.timestamp < 5000;

    if (!isRecent) {
      return NextResponse.json({ frameData: null, available: false });
    }

    return NextResponse.json({
      frameData: frameInfo.frameData,
      available: true,
      timestamp: frameInfo.timestamp
    });

  } catch (error) {
    console.error('Error getting mobile camera frame:', error);
    return NextResponse.json({ frameData: null, available: false });
  }
}