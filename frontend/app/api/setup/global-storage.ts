// Define types for our storage
export interface MobileConnection {
  connected: boolean;
  streamUrl: string | null;
  lastUpdated: number;
  timestamp?: number;
  frameCount?: number;
  lastAccessed?: number;
}

export interface MobileFrame {
  frameData: string;
  timestamp: number;
  frameCount?: number;
}

// Create a singleton class for mobile storage
class MobileStorage {
  private static instance: MobileStorage;
  private connections: Record<string, MobileConnection>;
  private frames: Record<string, MobileFrame>;
  private initialized: boolean;

  private constructor() {
    this.connections = {};
    this.frames = {};
    this.initialized = false;
    this.initialize();
  }

  public static getInstance(): MobileStorage {
    if (!MobileStorage.instance) {
      MobileStorage.instance = new MobileStorage();
    }
    return MobileStorage.instance;
  }

  private initialize() {
    if (this.initialized) return;
    
    this.initialized = true;
    
    // Set up cleanup for stale connections
    setInterval(() => {
      const now = Date.now();
      let cleanupCount = 0;
      
      Object.keys(this.connections).forEach(sessionId => {
        const connection = this.connections[sessionId];
        // Remove connections that haven't been accessed in 5 minutes
        if (now - (connection.lastAccessed || connection.lastUpdated) > 5 * 60 * 1000) {
          delete this.connections[sessionId];
          cleanupCount++;
        }
      });
      
      if (cleanupCount > 0) {
      }
    }, 60000); // Run cleanup every minute
    
    // Set up cleanup for stale frames
    setInterval(() => {
      const now = Date.now();
      let cleanupCount = 0;
      
      Object.keys(this.frames).forEach(sessionId => {
        const frame = this.frames[sessionId];
        // Remove frames that are older than 30 seconds
        if (now - frame.timestamp > 30000) {
          delete this.frames[sessionId];
          cleanupCount++;
        }
      });
      
      if (cleanupCount > 0) {
      }
    }, 60000); // Run cleanup every minute
  }

  public getConnections(): Record<string, MobileConnection> {
    return this.connections;
  }

  public getFrames(): Record<string, MobileFrame> {
    return this.frames;
  }

  public addTestData(sessionId: string): void {
    const now = Date.now();
    
    // Add test connection
    this.connections[sessionId] = {
      connected: true,
      streamUrl: `/api/setup/mobile-stream/${sessionId}`,
      lastUpdated: now,
      lastAccessed: now,
      timestamp: now,
      frameCount: 1
    };
    
    // Add test frame
    this.frames[sessionId] = {
      frameData: 'TEST_FRAME_DATA',
      timestamp: now,
      frameCount: 1
    };
    
  }
  
  public updateConnection(sessionId: string, connected: boolean, streamUrl: string | null): void {
    const now = Date.now();
    const existingConnection = this.connections[sessionId] || { frameCount: 0 };
    
    this.connections[sessionId] = {
      connected,
      streamUrl,
      lastUpdated: now,
      lastAccessed: now,
      timestamp: now,
      frameCount: (existingConnection.frameCount || 0) + 1
    };
    
  }
  
  public updateFrame(sessionId: string, frameData: string): void {
    const now = Date.now();
    const existingFrame = this.frames[sessionId] || { frameCount: 0 };
    
    this.frames[sessionId] = {
      frameData,
      timestamp: now,
      frameCount: (existingFrame.frameCount || 0) + 1
    };
    
  }
}

// Create the singleton instance
const mobileStorage = MobileStorage.getInstance();

// Export the storage objects
export const globalMobileConnections = mobileStorage.getConnections();
export const globalMobileFrames = mobileStorage.getFrames();

// Export the singleton for direct access
export { mobileStorage };

