/**
 * Enhanced Streaming Configuration
 * Centralized configuration for 30 FPS dual window mobile streaming
 */

export interface EnhancedStreamingConfig {
  // Performance Settings
  targetFPS: number;
  maxFPS: number;
  minFPS: number;
  frameInterval: number;
  
  // Quality Settings
  video: {
    width: number;
    height: number;
    compression: number;
    format: string;
  };
  
  // Network Settings
  connection: {
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    heartbeatInterval: number;
    reconnectDelay: number;
  };
  
  // Rate Limiting
  rateLimiting: {
    maxRequestsPerSecond: number;
    minRequestInterval: number;
    burstAllowance: number;
    windowSize: number;
  };
  
  // Performance Monitoring
  monitoring: {
    metricsUpdateInterval: number;
    performanceHistorySize: number;
    alertThresholds: {
      criticalFPSRatio: number;
      warningFPSRatio: number;
      maxLatency: number;
      maxJitter: number;
    };
  };
  
  // Dual Window Settings
  dualWindow: {
    enabled: boolean;
    syncTolerance: number;
    bufferSize: number;
    fallbackEnabled: boolean;
  };
  
  // Error Handling
  errorHandling: {
    maxConsecutiveErrors: number;
    errorCooldownPeriod: number;
    autoRecoveryEnabled: boolean;
    fallbackToStandardMode: boolean;
  };
}

// Default Enhanced Streaming Configuration
export const DEFAULT_ENHANCED_CONFIG: EnhancedStreamingConfig = {
  // Target 30 FPS with some tolerance
  targetFPS: 30,
  maxFPS: 35,
  minFPS: 20,
  frameInterval: 33.33, // 1000ms / 30fps
  
  // Optimized video quality for mobile streaming
  video: {
    width: 640,
    height: 480,
    compression: 0.8,
    format: 'jpeg'
  },
  
  // Network settings optimized for real-time streaming
  connection: {
    timeout: 5000,
    retryAttempts: 5,
    retryDelay: 1000,
    heartbeatInterval: 3000,
    reconnectDelay: 2000
  },
  
  // Rate limiting to allow 30+ FPS
  rateLimiting: {
    maxRequestsPerSecond: 35,
    minRequestInterval: 25, // 40 FPS max to allow buffer
    burstAllowance: 10,
    windowSize: 1000
  },
  
  // Performance monitoring settings
  monitoring: {
    metricsUpdateInterval: 1000,
    performanceHistorySize: 30,
    alertThresholds: {
      criticalFPSRatio: 0.7, // Alert if FPS drops below 70% of target
      warningFPSRatio: 0.9,  // Warning if FPS drops below 90% of target
      maxLatency: 200,       // Alert if latency exceeds 200ms
      maxJitter: 50          // Alert if jitter exceeds 50ms
    }
  },
  
  // Dual window streaming settings
  dualWindow: {
    enabled: true,
    syncTolerance: 100,     // Allow 100ms sync difference between windows
    bufferSize: 3,          // Buffer 3 frames for smooth playback
    fallbackEnabled: true   // Fall back to single window if dual fails
  },
  
  // Error handling and recovery
  errorHandling: {
    maxConsecutiveErrors: 5,
    errorCooldownPeriod: 5000,
    autoRecoveryEnabled: true,
    fallbackToStandardMode: true
  }
};

// Environment-specific configurations
export const DEVELOPMENT_CONFIG: Partial<EnhancedStreamingConfig> = {
  connection: {
    ...DEFAULT_ENHANCED_CONFIG.connection,
    timeout: 10000, // Longer timeout for development
    retryAttempts: 10
  },
  monitoring: {
    ...DEFAULT_ENHANCED_CONFIG.monitoring,
    metricsUpdateInterval: 500 // More frequent updates for debugging
  }
};

export const PRODUCTION_CONFIG: Partial<EnhancedStreamingConfig> = {
  connection: {
    ...DEFAULT_ENHANCED_CONFIG.connection,
    timeout: 3000, // Shorter timeout for production
    retryAttempts: 3
  },
  errorHandling: {
    ...DEFAULT_ENHANCED_CONFIG.errorHandling,
    maxConsecutiveErrors: 3,
    errorCooldownPeriod: 3000
  }
};

// Mobile-specific optimizations
export const MOBILE_OPTIMIZED_CONFIG: Partial<EnhancedStreamingConfig> = {
  video: {
    ...DEFAULT_ENHANCED_CONFIG.video,
    width: 480,
    height: 360,
    compression: 0.7 // Higher compression for mobile bandwidth
  },
  rateLimiting: {
    ...DEFAULT_ENHANCED_CONFIG.rateLimiting,
    maxRequestsPerSecond: 25, // Slightly lower for mobile
    minRequestInterval: 35
  }
};

// High-performance configuration for optimal conditions
export const HIGH_PERFORMANCE_CONFIG: Partial<EnhancedStreamingConfig> = {
  targetFPS: 30,
  maxFPS: 40,
  video: {
    ...DEFAULT_ENHANCED_CONFIG.video,
    width: 720,
    height: 540,
    compression: 0.9 // Higher quality
  },
  rateLimiting: {
    ...DEFAULT_ENHANCED_CONFIG.rateLimiting,
    maxRequestsPerSecond: 40,
    minRequestInterval: 20
  }
};

/**
 * Get configuration based on environment and device capabilities
 */
export function getOptimalConfig(
  environment: 'development' | 'production' = 'production',
  deviceType: 'mobile' | 'desktop' = 'mobile',
  networkQuality: 'high' | 'medium' | 'low' = 'medium'
): EnhancedStreamingConfig {
  let config = { ...DEFAULT_ENHANCED_CONFIG };
  
  // Apply environment-specific settings
  if (environment === 'development') {
    config = { ...config, ...DEVELOPMENT_CONFIG };
  } else {
    config = { ...config, ...PRODUCTION_CONFIG };
  }
  
  // Apply device-specific optimizations
  if (deviceType === 'mobile') {
    config = { ...config, ...MOBILE_OPTIMIZED_CONFIG };
  }
  
  // Apply network quality optimizations
  if (networkQuality === 'high') {
    config = { ...config, ...HIGH_PERFORMANCE_CONFIG };
  } else if (networkQuality === 'low') {
    // Low network quality optimizations
    config.targetFPS = 20;
    config.video.compression = 0.6;
    config.rateLimiting.maxRequestsPerSecond = 20;
    config.rateLimiting.minRequestInterval = 45;
  }
  
  return config;
}

/**
 * Validate configuration values
 */
export function validateConfig(config: EnhancedStreamingConfig): boolean {
  const errors: string[] = [];
  
  if (config.targetFPS <= 0 || config.targetFPS > 60) {
    errors.push('Target FPS must be between 1 and 60');
  }
  
  if (config.frameInterval !== 1000 / config.targetFPS) {
    errors.push('Frame interval must match target FPS');
  }
  
  if (config.video.compression < 0.1 || config.video.compression > 1.0) {
    errors.push('Video compression must be between 0.1 and 1.0');
  }
  
  if (config.rateLimiting.minRequestInterval < 10) {
    errors.push('Minimum request interval must be at least 10ms');
  }
  
  if (errors.length > 0) {
    console.error('Configuration validation errors:', errors);
    return false;
  }
  
  return true;
}

/**
 * Dynamic configuration adjustment based on performance metrics
 */
export function adjustConfigForPerformance(
  config: EnhancedStreamingConfig,
  metrics: {
    averageFPS: number;
    averageLatency: number;
    dropRate: number;
    networkStability: number;
  }
): Partial<EnhancedStreamingConfig> {
  const adjustments: Partial<EnhancedStreamingConfig> = {};
  
  // Adjust target FPS based on actual performance
  if (metrics.averageFPS < config.targetFPS * 0.8) {
    adjustments.targetFPS = Math.max(15, Math.floor(metrics.averageFPS * 1.1));
    console.log(`Reducing target FPS to ${adjustments.targetFPS} due to performance`);
  }
  
  // Adjust quality based on network conditions
  if (metrics.averageLatency > 300 || metrics.dropRate > 0.1) {
    adjustments.video = {
      ...config.video,
      compression: Math.max(0.5, config.video.compression - 0.1)
    };
    console.log('Reducing video quality due to network issues');
  }
  
  // Adjust rate limiting based on network stability
  if (metrics.networkStability < 0.8) {
    adjustments.rateLimiting = {
      ...config.rateLimiting,
      minRequestInterval: config.rateLimiting.minRequestInterval * 1.2
    };
    console.log('Increasing request interval due to network instability');
  }
  
  return adjustments;
}

// Export commonly used configurations
export const CONFIGS = {
  DEFAULT: DEFAULT_ENHANCED_CONFIG,
  DEVELOPMENT: { ...DEFAULT_ENHANCED_CONFIG, ...DEVELOPMENT_CONFIG },
  PRODUCTION: { ...DEFAULT_ENHANCED_CONFIG, ...PRODUCTION_CONFIG },
  MOBILE: { ...DEFAULT_ENHANCED_CONFIG, ...MOBILE_OPTIMIZED_CONFIG },
  HIGH_PERFORMANCE: { ...DEFAULT_ENHANCED_CONFIG, ...HIGH_PERFORMANCE_CONFIG }
};
