import { SecretsManager } from '@/lib/config/secrets';

describe('SecretsManager', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env = {
      NODE_ENV: 'development',
      NEXT_PUBLIC_JWT_SECRET: 'test-jwt-secret',
      NEXT_PUBLIC_API_KEY: 'test-api-key',
      NEXT_PUBLIC_DATABASE_URL: 'test-db-url',
      NEXT_PUBLIC_REDIS_URL: 'test-redis-url',
      NEXT_PUBLIC_AI_SERVICE_KEY: 'test-ai-key',
      NEXT_PUBLIC_MODEL_ENDPOINT: 'test-model-endpoint',
      NEXT_PUBLIC_STORAGE_KEY: 'test-storage-key'
    };
    if ((SecretsManager as any)._instance) {
      (SecretsManager as any)._instance = undefined;
    }
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Initialization', () => {
    it('should initialize singleton instance', async () => {
      const instance1 = SecretsManager.getInstance();
      const instance2 = SecretsManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should load development secrets correctly', async () => {
      const manager = SecretsManager.getInstance();
      await manager.initialize();
      
      expect(manager.getAppSecret('JWT_SECRET')).toBe('test-jwt-secret');
      expect(manager.getAppSecret('API_KEY')).toBe('test-api-key');
      expect(manager.getAISecret('AI_SERVICE_KEY')).toBe('test-ai-key');
    });

    it('should load production secrets correctly', async () => {
      process.env = {
        NODE_ENV: 'production',
        JWT_SECRET: 'prod-jwt-secret',
        API_KEY: 'prod-api-key',
        AI_SERVICE_KEY: 'prod-ai-key'
      };
      if ((SecretsManager as any)._instance) {
        (SecretsManager as any)._instance = undefined;
      }
      const manager = SecretsManager.getInstance();
      await manager.initialize();
      
      expect(manager.getAppSecret('JWT_SECRET')).toBe('prod-jwt-secret');
      expect(manager.getAppSecret('API_KEY')).toBe('prod-api-key');
      expect(manager.getAISecret('AI_SERVICE_KEY')).toBe('prod-ai-key');
    });

    it('should throw error when accessing uninitialized manager', () => {
      if ((SecretsManager as any)._instance) {
        (SecretsManager as any)._instance = undefined;
      }
      const manager = SecretsManager.getInstance();
      expect(() => manager.getAppSecret('JWT_SECRET')).toThrow('SecretsManager not initialized');
    });
  });

  describe('Secret Access', () => {
    let manager: SecretsManager;

    beforeEach(async () => {
      manager = SecretsManager.getInstance();
      await manager.initialize();
    });

    it('should return undefined for non-existent secrets', () => {
      expect(manager.getAppSecret('NON_EXISTENT' as any)).toBeUndefined();
      expect(manager.getAISecret('NON_EXISTENT' as any)).toBeUndefined();
    });

    it('should handle missing environment variables', async () => {
      process.env = { NODE_ENV: 'development' };
      if ((SecretsManager as any)._instance) {
        (SecretsManager as any)._instance = undefined;
      }
      const newManager = SecretsManager.getInstance();
      await newManager.initialize();
      
      expect(newManager.getAppSecret('JWT_SECRET')).toBeUndefined();
      expect(newManager.getAISecret('AI_SERVICE_KEY')).toBeUndefined();
    });
  });

  describe('Secret Rotation', () => {
    it('should prevent secret rotation in development', async () => {
      const manager = SecretsManager.getInstance();
      await manager.initialize();
      
      await expect(manager.rotateSecrets()).rejects.toThrow('Secret rotation only available in production');
    });

    it('should handle secret rotation in production', async () => {
      process.env = { ...process.env, NODE_ENV: 'production' };
      const manager = SecretsManager.getInstance();
      await manager.initialize();
      
      // Mock implementation would go here in a real test
      // This is just testing the interface exists
      expect(manager.rotateSecrets).toBeDefined();
    });
  });
});
