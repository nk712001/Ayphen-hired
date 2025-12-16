import { NextRequest, NextResponse } from 'next/server';
import { mobileStorage, globalMobileConnections, globalMobileFrames } from '@/app/api/setup/global-storage';

/**
 * POST handler for cleaning up problematic session IDs
 * This route is used to remove problematic session IDs like 'null' or 'undefined'
 */
export async function POST(req: NextRequest) {
  try {
    // Get all session IDs
    const connectionIds = Object.keys(globalMobileConnections || {});
    const frameIds = Object.keys(globalMobileFrames || {});
    
    // Track what we've cleaned up
    const cleanupReport = {
      removedConnections: [] as string[],
      removedFrames: [] as string[],
      timestamp: Date.now()
    };
    
    // Clean up problematic connection IDs
    connectionIds.forEach(id => {
      if (id === 'null' || id === 'undefined' || !id) {
        delete globalMobileConnections[id];
        cleanupReport.removedConnections.push(id);
      }
    });
    
    // Clean up problematic frame IDs
    frameIds.forEach(id => {
      if (id === 'null' || id === 'undefined' || !id) {
        delete globalMobileFrames[id];
        cleanupReport.removedFrames.push(id);
      }
    });
    
    // Log what we've done
    console.log('Cleaned up problematic session IDs:', cleanupReport);
    
    return NextResponse.json({
      success: true,
      message: 'Storage cleaned up successfully',
      ...cleanupReport
    });
  } catch (error) {
    console.error('Error cleaning up storage:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}

/**
 * GET handler for checking storage status
 */
export async function GET(req: NextRequest) {
  try {
    // Get all session IDs
    const connectionIds = Object.keys(globalMobileConnections || {});
    const frameIds = Object.keys(globalMobileFrames || {});
    
    // Check for problematic IDs
    const problematicConnectionIds = connectionIds.filter(id => id === 'null' || id === 'undefined' || !id);
    const problematicFrameIds = frameIds.filter(id => id === 'null' || id === 'undefined' || !id);
    
    return NextResponse.json({
      hasProblematicIds: problematicConnectionIds.length > 0 || problematicFrameIds.length > 0,
      problematicConnectionIds,
      problematicFrameIds,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error checking storage status:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
