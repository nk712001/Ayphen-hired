export interface AppSecrets {
  JWT_SECRET: string;
  API_KEY: string;
  DATABASE_URL: string;
  REDIS_URL: string;
}

export interface AIServiceSecrets {
  AI_SERVICE_KEY: string;
  MODEL_ENDPOINT: string;
  STORAGE_KEY: string;
}

export class SecretsManager {
  private static instance: SecretsManager;
  private appSecrets: Partial<AppSecrets> = {};
  private aiSecrets: Partial<AIServiceSecrets> = {};
  private initialized = false;

  private constructor() {}

  static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // In production, these will be loaded from Kubernetes secrets
      if (process.env.NODE_ENV === 'production') {
        this.appSecrets = {
          JWT_SECRET: process.env.JWT_SECRET,
          API_KEY: process.env.API_KEY,
          DATABASE_URL: process.env.DATABASE_URL,
          REDIS_URL: process.env.REDIS_URL,
        };

        this.aiSecrets = {
          AI_SERVICE_KEY: process.env.AI_SERVICE_KEY,
          MODEL_ENDPOINT: process.env.MODEL_ENDPOINT,
          STORAGE_KEY: process.env.STORAGE_KEY,
        };
      } else {
        // In development, load from .env.local
        this.appSecrets = {
          JWT_SECRET: process.env.NEXT_PUBLIC_JWT_SECRET,
          API_KEY: process.env.NEXT_PUBLIC_API_KEY,
          DATABASE_URL: process.env.NEXT_PUBLIC_DATABASE_URL,
          REDIS_URL: process.env.NEXT_PUBLIC_REDIS_URL,
        };

        this.aiSecrets = {
          AI_SERVICE_KEY: process.env.NEXT_PUBLIC_AI_SERVICE_KEY,
          MODEL_ENDPOINT: process.env.NEXT_PUBLIC_MODEL_ENDPOINT,
          STORAGE_KEY: process.env.NEXT_PUBLIC_STORAGE_KEY,
        };
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize secrets:', error);
      throw new Error('Secrets initialization failed');
    }
  }

  getAppSecret<K extends keyof AppSecrets>(key: K): AppSecrets[K] | undefined {
    if (!this.initialized) {
      throw new Error('SecretsManager not initialized');
    }
    return this.appSecrets[key];
  }

  getAISecret<K extends keyof AIServiceSecrets>(key: K): AIServiceSecrets[K] | undefined {
    if (!this.initialized) {
      throw new Error('SecretsManager not initialized');
    }
    return this.aiSecrets[key];
  }

  // Rotate secrets in production (called by admin API)
  async rotateSecrets(): Promise<void> {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('Secret rotation only available in production');
    }

    try {
      // Implementation would call Kubernetes API to rotate secrets
      // This is a placeholder for the actual implementation
      await this.initialize();
    } catch (error) {
      console.error('Failed to rotate secrets:', error);
      throw new Error('Secret rotation failed');
    }
  }
}
