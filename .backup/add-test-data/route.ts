import { NextRequest, NextResponse } from 'next/server';
import { mobileStorage, globalMobileConnections, globalMobileFrames } from '@/app/api/setup/global-storage';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId') || `test_${Date.now()}`;
    
    // Use the singleton to add test data
    mobileStorage.addTestData(sessionId);
    
    return NextResponse.json({
      success: true,
      sessionId,
      timestamp: Date.now(),
      message: 'Test data added successfully',
      connectionCount: Object.keys(globalMobileConnections).length,
      frameCount: Object.keys(globalMobileFrames).length
    });
  } catch (error) {
    console.error('Error adding test data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
