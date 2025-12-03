// In-memory storage for mobile camera connections
// In a production environment, this would be stored in a database or Redis
export const mobileConnections: Record<string, {
  connected: boolean;
  streamUrl: string | null;
  lastUpdated: number;
  timestamp?: number; // Client timestamp
  frameCount?: number; // Track number of frames received
  lastAccessed?: number; // Track when this connection was last accessed
}> = {};

// Clean up stale connections periodically
setInterval(() => {
  const now = Date.now();
  let cleanupCount = 0;
  
  Object.keys(mobileConnections).forEach(sessionId => {
    const connection = mobileConnections[sessionId];
    // Remove connections that haven't been accessed in 5 minutes
    if (now - (connection.lastAccessed || connection.lastUpdated) > 5 * 60 * 1000) {
      delete mobileConnections[sessionId];
      cleanupCount++;
    }
  });
  
  if (cleanupCount > 0) {
    console.log(`Cleaned up ${cleanupCount} stale mobile camera connections`);
  }
}, 60000); // Run cleanup every minute
