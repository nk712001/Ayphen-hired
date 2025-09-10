import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { join } from 'path';
import { describe, test, expect, beforeAll } from '@jest/globals';

interface RoleRule {
  apiGroups: string[];
  resources: string[];
  verbs: string[];
}

interface Role {
  apiVersion: 'rbac.authorization.k8s.io/v1';
  kind: 'Role';
  metadata: {
    name: string;
    namespace: string;
  };
  rules: RoleRule[];
}

interface Subject {
  kind: 'User' | 'Group' | 'ServiceAccount';
  name: string;
  namespace?: string;
}

interface RoleBinding {
  apiVersion: 'rbac.authorization.k8s.io/v1';
  kind: 'RoleBinding';
  metadata: {
    name: string;
    namespace: string;
  };
  roleRef: {
    apiGroup: 'rbac.authorization.k8s.io';
    kind: 'Role';
    name: string;
  };
  subjects: Subject[];
}

describe('RBAC Configuration', () => {
  let adminRole: Role;
  let viewerRole: Role;
  let adminBinding: RoleBinding;
  let viewerBinding: RoleBinding;

  beforeAll(() => {
    const rbacFile = fs.readFileSync(
      join(__dirname, '../rbac.yaml'),
      'utf8'
    );
    const documents = yaml.loadAll(rbacFile) as [Role, Role, RoleBinding, RoleBinding];
    [adminRole, viewerRole, adminBinding, viewerBinding] = documents;
  });

  describe('Admin Role', () => {
    test('should have correct metadata', () => {
      expect(adminRole.apiVersion).toBe('rbac.authorization.k8s.io/v1');
      expect(adminRole.kind).toBe('Role');
      expect(adminRole.metadata.name).toBe('ayphen-admin');
      expect(adminRole.metadata.namespace).toBe('default');
    });

    test('should have required permissions', () => {
      expect(adminRole.rules).toBeDefined();
      expect(adminRole.rules.length).toBeGreaterThan(0);

      const allResources = adminRole.rules.flatMap(rule => rule.resources);
      const allVerbs = adminRole.rules.flatMap(rule => rule.verbs);

      // Admin should have full access to core resources
      expect(allResources).toEqual(expect.arrayContaining([
        'secrets',
        'configmaps',
        'pods',
        'services',
        'deployments'
      ]));

      // Admin should have all permissions
      expect(allVerbs).toEqual(expect.arrayContaining([
        'get',
        'list',
        'watch',
        'create',
        'update',
        'patch',
        'delete'
      ]));
    });
  });

  describe('Viewer Role', () => {
    test('should have correct metadata', () => {
      expect(viewerRole.apiVersion).toBe('rbac.authorization.k8s.io/v1');
      expect(viewerRole.kind).toBe('Role');
      expect(viewerRole.metadata.name).toBe('ayphen-viewer');
      expect(viewerRole.metadata.namespace).toBe('default');
    });

    test('should have read-only permissions', () => {
      expect(viewerRole.rules).toBeDefined();
      expect(viewerRole.rules.length).toBeGreaterThan(0);

      viewerRole.rules.forEach(rule => {
        // Viewer should only have read permissions
        expect(rule.verbs).toEqual(expect.arrayContaining(['get', 'list', 'watch']));
        expect(rule.verbs).not.toEqual(
          expect.arrayContaining(['create', 'update', 'patch', 'delete'])
        );
      });
    });
  });

  describe('Role Bindings', () => {
    test('admin binding should have correct configuration', () => {
      expect(adminBinding.apiVersion).toBe('rbac.authorization.k8s.io/v1');
      expect(adminBinding.kind).toBe('RoleBinding');
      expect(adminBinding.metadata.name).toBe('ayphen-admin-binding');
      expect(adminBinding.metadata.namespace).toBe('default');

      expect(adminBinding.roleRef.kind).toBe('Role');
      expect(adminBinding.roleRef.name).toBe('ayphen-admin');
      expect(adminBinding.roleRef.apiGroup).toBe('rbac.authorization.k8s.io');

      expect(adminBinding.subjects).toBeDefined();
      expect(adminBinding.subjects.length).toBeGreaterThan(0);
      adminBinding.subjects.forEach(subject => {
        expect(['User', 'Group', 'ServiceAccount']).toContain(subject.kind);
        expect(subject.name).toBeDefined();
      });
    });

    test('viewer binding should have correct configuration', () => {
      expect(viewerBinding.apiVersion).toBe('rbac.authorization.k8s.io/v1');
      expect(viewerBinding.kind).toBe('RoleBinding');
      expect(viewerBinding.metadata.name).toBe('ayphen-viewer-binding');
      expect(viewerBinding.metadata.namespace).toBe('default');

      expect(viewerBinding.roleRef.kind).toBe('Role');
      expect(viewerBinding.roleRef.name).toBe('ayphen-viewer');
      expect(viewerBinding.roleRef.apiGroup).toBe('rbac.authorization.k8s.io');

      expect(viewerBinding.subjects).toBeDefined();
      expect(viewerBinding.subjects.length).toBeGreaterThan(0);
      viewerBinding.subjects.forEach(subject => {
        expect(['User', 'Group', 'ServiceAccount']).toContain(subject.kind);
        expect(subject.name).toBeDefined();
      });
    });
  });

  describe('Security Best Practices', () => {
    test('roles should have explicit resource names', () => {
      const allRoles = [adminRole, viewerRole];
      allRoles.forEach(role => {
        role.rules.forEach(rule => {
          // Resources should be explicitly named, no wildcards
          expect(rule.resources).not.toContain('*');
          // API groups should be explicitly named
          expect(rule.apiGroups).not.toContain('*');
        });
      });
    });

    test('bindings should reference valid roles', () => {
      expect(adminBinding.roleRef.name).toBe(adminRole.metadata.name);
      expect(viewerBinding.roleRef.name).toBe(viewerRole.metadata.name);
    });

    test('subjects should have valid configurations', () => {
      const allBindings = [adminBinding, viewerBinding];
      allBindings.forEach(binding => {
        binding.subjects.forEach(subject => {
          if (subject.kind === 'ServiceAccount') {
            expect(subject.namespace).toBeDefined();
          }
          expect(subject.name).not.toBe('system:anonymous');
          expect(subject.name).not.toBe('*');
        });
      });
    });
  });
});
