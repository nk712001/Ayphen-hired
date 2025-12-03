// In-memory storage for mobile camera frames
// In a production environment, this would be stored in a database or Redis
export const mobileFrames: Record<string, {
  frameData: string;
  timestamp: number;
  frameCount?: number;
}> = {};

// Clean up stale frames periodically
setInterval(() => {
  const now = Date.now();
  const staleThreshold = 30 * 1000; // 30 seconds
  
  Object.keys(mobileFrames).forEach(sessionId => {
    if (now - mobileFrames[sessionId].timestamp > staleThreshold) {
      console.log(`Cleaning up stale frame for session: ${sessionId}`);
      delete mobileFrames[sessionId];
    }
  });
}, 60000); // Run cleanup every minute
