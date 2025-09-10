import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { join } from 'path';
import { describe, test, expect, beforeAll } from '@jest/globals';

interface NetworkPolicyPort {
  port?: number;
  protocol?: 'TCP' | 'UDP';
}

interface NetworkPolicyPeer {
  namespaceSelector?: {
    matchLabels: Record<string, string>;
  };
  podSelector?: {
    matchLabels: Record<string, string>;
  };
}

interface NetworkPolicyRule {
  from?: NetworkPolicyPeer[];
  to?: NetworkPolicyPeer[];
  ports?: NetworkPolicyPort[];
}

interface NetworkPolicy {
  apiVersion: 'networking.k8s.io/v1';
  kind: 'NetworkPolicy';
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    podSelector: {
      matchLabels: Record<string, string>;
    };
    policyTypes: Array<'Ingress' | 'Egress'>;
    ingress?: NetworkPolicyRule[];
    egress?: NetworkPolicyRule[];
  };
}

describe('Network Policies', () => {
  let policies: NetworkPolicy[];

  beforeAll(() => {
    const policiesPath = join(__dirname, '../network-policies.yaml');
    const yamlContent = fs.readFileSync(policiesPath, 'utf8');
    policies = yaml.loadAll(yamlContent) as NetworkPolicy[];
  });

  test('should have valid network policies defined', () => {
    expect(policies).toBeDefined();
    expect(policies.length).toBeGreaterThan(0);

    policies.forEach(policy => {
      expect(policy.apiVersion).toBe('networking.k8s.io/v1');
      expect(policy.kind).toBe('NetworkPolicy');
      expect(policy.metadata.name).toBeDefined();
      expect(policy.metadata.namespace).toBeDefined();
      expect(policy.spec.podSelector).toBeDefined();
      expect(policy.spec.policyTypes).toEqual(
        expect.arrayContaining(['Ingress', 'Egress'])
      );
    });
  });

  describe('Ingress Rules', () => {
    test('should have valid ingress rules', () => {
      const policiesWithIngress = policies.filter(policy => policy.spec.ingress);
      expect(policiesWithIngress.length).toBeGreaterThan(0);

      policiesWithIngress.forEach(policy => {
        policy.spec.ingress?.forEach(rule => {
          if (rule.from) {
            rule.from.forEach(from => {
              if (from.namespaceSelector) {
                expect(from.namespaceSelector.matchLabels).toBeDefined();
              }
              if (from.podSelector) {
                expect(from.podSelector.matchLabels).toBeDefined();
              }
            });
          }

          if (rule.ports) {
            rule.ports.forEach(port => {
              if (port.port) {
                expect(typeof port.port).toBe('number');
                expect(port.port).toBeGreaterThan(0);
                expect(port.port).toBeLessThan(65536);
              }
              if (port.protocol) {
                expect(['TCP', 'UDP']).toContain(port.protocol);
              }
            });
          }
        });
      });
    });

    test('should enforce namespace isolation', () => {
      const ingressPolicies = policies.filter(policy => 
        policy.spec.policyTypes.includes('Ingress')
      );

      ingressPolicies.forEach(policy => {
        if (policy.spec.ingress) {
          policy.spec.ingress.forEach(rule => {
            if (rule.from) {
              rule.from.forEach(from => {
                if (from.namespaceSelector) {
                  // Ensure namespace selectors are specific
                  expect(Object.keys(from.namespaceSelector.matchLabels).length).toBeGreaterThan(0);
                }
              });
            }
          });
        }
      });
    });
  });

  describe('Egress Rules', () => {
    test('should have valid egress rules', () => {
      const policiesWithEgress = policies.filter(policy => policy.spec.egress);
      expect(policiesWithEgress.length).toBeGreaterThan(0);

      policiesWithEgress.forEach(policy => {
        policy.spec.egress?.forEach(rule => {
          if (rule.to) {
            rule.to.forEach(to => {
              if (to.namespaceSelector) {
                expect(to.namespaceSelector.matchLabels).toBeDefined();
              }
              if (to.podSelector) {
                expect(to.podSelector.matchLabels).toBeDefined();
              }
            });
          }

          if (rule.ports) {
            rule.ports.forEach(port => {
              if (port.port) {
                expect(typeof port.port).toBe('number');
                expect(port.port).toBeGreaterThan(0);
                expect(port.port).toBeLessThan(65536);
              }
              if (port.protocol) {
                expect(['TCP', 'UDP']).toContain(port.protocol);
              }
            });
          }
        });
      });
    });

    test('should restrict external access', () => {
      const egressPolicies = policies.filter(policy => 
        policy.spec.policyTypes.includes('Egress')
      );

      egressPolicies.forEach(policy => {
        if (policy.spec.egress) {
          policy.spec.egress.forEach(rule => {
            if (rule.to) {
              rule.to.forEach(to => {
                // Ensure egress rules are specific
                expect(to.namespaceSelector || to.podSelector).toBeDefined();
              });
            }
          });
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should have specific selectors', () => {
      policies.forEach(policy => {
        // Pod selectors should be specific
        expect(Object.keys(policy.spec.podSelector.matchLabels).length).toBeGreaterThan(0);

        // Check ingress rules
        policy.spec.ingress?.forEach(rule => {
          rule.from?.forEach(from => {
            if (from.namespaceSelector) {
              expect(Object.keys(from.namespaceSelector.matchLabels).length).toBeGreaterThan(0);
            }
            if (from.podSelector) {
              expect(Object.keys(from.podSelector.matchLabels).length).toBeGreaterThan(0);
            }
          });
        });

        // Check egress rules
        policy.spec.egress?.forEach(rule => {
          rule.to?.forEach(to => {
            if (to.namespaceSelector) {
              expect(Object.keys(to.namespaceSelector.matchLabels).length).toBeGreaterThan(0);
            }
            if (to.podSelector) {
              expect(Object.keys(to.podSelector.matchLabels).length).toBeGreaterThan(0);
            }
          });
        });
      });
    });

    test('should have defined ports and protocols', () => {
      policies.forEach(policy => {
        // Check ingress ports
        policy.spec.ingress?.forEach(rule => {
          rule.ports?.forEach(port => {
            expect(port.port).toBeDefined();
            expect(port.protocol).toBeDefined();
          });
        });

        // Check egress ports
        policy.spec.egress?.forEach(rule => {
          rule.ports?.forEach(port => {
            expect(port.port).toBeDefined();
            expect(port.protocol).toBeDefined();
          });
        });
      });
    });
  });
});
