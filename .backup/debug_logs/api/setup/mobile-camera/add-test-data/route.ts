import { NextRequest, NextResponse } from 'next/server';
import { mobileStorage } from '../../global-storage';

/**
 * Special endpoint to add test data for the mobile camera
 * This is only used by the manual override button
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { sessionId } = await req.json();
    
    // Validate session ID
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }
    
    console.log(`Adding test data for mobile camera session: ${sessionId}`);
    
    // Add test data to the global storage
    mobileStorage.addTestData(sessionId);
    
    return NextResponse.json({
      success: true,
      message: 'Test data added successfully',
      sessionId,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error adding test data for mobile camera:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
