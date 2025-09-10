import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { join } from 'path';
import { describe, test, expect, beforeAll } from '@jest/globals';

interface SecretMetadata {
  name: string;
  namespace: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

interface SecretData {
  [key: string]: string;
}

interface KubernetesSecret {
  apiVersion: 'v1';
  kind: 'Secret';
  metadata: SecretMetadata;
  type: 'Opaque';
  data?: SecretData;
  stringData?: SecretData;
}

interface SealedSecretData {
  [key: string]: string;
}

interface SealedSecret {
  apiVersion: 'bitnami.com/v1alpha1';
  kind: 'SealedSecret';
  metadata: SecretMetadata;
  spec: {
    encryptedData: SealedSecretData;
    template: {
      metadata: SecretMetadata;
      type: 'Opaque';
    };
  };
}

describe('Secrets Configuration', () => {
  let appSecrets: KubernetesSecret;
  let aiSecrets: KubernetesSecret;
  let sealedSecrets: SealedSecret;

  beforeAll(() => {
    const secretsFile = fs.readFileSync(
      join(__dirname, '../secrets.yaml'),
      'utf8'
    );
    const documents = yaml.loadAll(secretsFile) as [KubernetesSecret, KubernetesSecret, SealedSecret];
    [appSecrets, aiSecrets, sealedSecrets] = documents;
  });

  describe('Application Secrets', () => {
    test('should have correct metadata', () => {
      expect(appSecrets.apiVersion).toBe('v1');
      expect(appSecrets.kind).toBe('Secret');
      expect(appSecrets.metadata.name).toBe('ayphen-app-secrets');
      expect(appSecrets.metadata.namespace).toBe('default');
      expect(appSecrets.type).toBe('Opaque');
    });

    test('should have required secret data', () => {
      expect(appSecrets.stringData).toBeDefined();
      const requiredKeys = ['JWT_SECRET', 'API_KEY', 'DATABASE_URL', 'REDIS_URL'];
      const definedKeys = Object.keys(appSecrets.stringData!);
      expect(definedKeys).toEqual(expect.arrayContaining(requiredKeys));

      Object.values(appSecrets.stringData!).forEach(value => {
        expect(value).toMatch(/\${[A-Z_]+}/);
      });
    });
  });

  describe('AI Service Secrets', () => {
    test('should have correct metadata', () => {
      expect(aiSecrets.apiVersion).toBe('v1');
      expect(aiSecrets.kind).toBe('Secret');
      expect(aiSecrets.metadata.name).toBe('ayphen-ai-service-secrets');
      expect(aiSecrets.metadata.namespace).toBe('default');
      expect(aiSecrets.type).toBe('Opaque');
    });

    test('should have required secret data', () => {
      expect(aiSecrets.stringData).toBeDefined();
      const requiredKeys = ['AI_SERVICE_KEY', 'MODEL_ENDPOINT', 'STORAGE_KEY'];
      const definedKeys = Object.keys(aiSecrets.stringData!);
      expect(definedKeys).toEqual(expect.arrayContaining(requiredKeys));

      Object.values(aiSecrets.stringData!).forEach(value => {
        expect(value).toMatch(/\${[A-Z_]+}/);
      });
    });
  });

  describe('Sealed Secrets', () => {
    test('should have correct metadata', () => {
      expect(sealedSecrets.apiVersion).toBe('bitnami.com/v1alpha1');
      expect(sealedSecrets.kind).toBe('SealedSecret');
      expect(sealedSecrets.metadata.name).toBe('ayphen-sealed-secrets');
      expect(sealedSecrets.metadata.namespace).toBe('default');
    });

    test('should have encrypted data', () => {
      expect(sealedSecrets.spec.encryptedData).toBeDefined();
      const keys = Object.keys(sealedSecrets.spec.encryptedData);
      expect(keys.length).toBeGreaterThan(0);
    });

    test('should have correct template', () => {
      expect(sealedSecrets.spec.template.metadata.name).toBeDefined();
      expect(sealedSecrets.spec.template.metadata.namespace).toBeDefined();
      expect(sealedSecrets.spec.template.type).toBe('Opaque');
    });
  });

  describe('Security Best Practices', () => {
    test('should not contain hardcoded secrets', () => {
      const allSecrets = [appSecrets, aiSecrets];
      
      allSecrets.forEach(secret => {
        if (secret.stringData) {
          Object.values(secret.stringData).forEach(value => {
            // Should not contain direct values, only env var references
            expect(value).not.toMatch(/^[A-Za-z0-9+/=]+$/);
            expect(value).not.toMatch(/^[0-9a-f-]+$/);
          });
        }
      });
    });

    test('should use stringData over data', () => {
      const allSecrets = [appSecrets, aiSecrets];
      
      allSecrets.forEach(secret => {
        expect(secret.stringData).toBeDefined();
        expect(secret.data).toBeUndefined();
      });
    });

    test('should not expose sensitive information in metadata', () => {
      const allSecrets = [appSecrets, aiSecrets, sealedSecrets];
      
      allSecrets.forEach(secret => {
        if (secret.metadata.labels) {
          Object.values(secret.metadata.labels).forEach(value => {
            expect(value).not.toMatch(/^[A-Za-z0-9+/=]+$/);
          });
        }
        
        if (secret.metadata.annotations) {
          Object.values(secret.metadata.annotations).forEach(value => {
            expect(value).not.toMatch(/^[A-Za-z0-9+/=]+$/);
          });
        }
      });
    });
  });
});
