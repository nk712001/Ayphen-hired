import * as yaml from 'js-yaml';
import * as fs from 'fs';
import { join } from 'path';

describe('Pod Security Policies', () => {
  let psp: any;
  let clusterRole: any;
  let clusterRoleBinding: any;

  beforeAll(() => {
    const pspFile = fs.readFileSync(
      join(__dirname, '../pod-security-policies.yaml'),
      'utf8'
    );
    const documents = yaml.loadAll(pspFile);
    if (!Array.isArray(documents)) {
      throw new Error('Failed to parse YAML documents');
    }
    [psp, clusterRole, clusterRoleBinding] = documents;
  });

  describe('PodSecurityPolicy', () => {
    it('should have correct metadata', () => {
      expect(psp.apiVersion).toBe('policy/v1beta1');
      expect(psp.kind).toBe('PodSecurityPolicy');
      expect(psp.metadata.name).toBe('ayphen-restricted');
    });

    it('should enforce non-privileged containers', () => {
      expect(psp.spec.privileged).toBe(false);
      expect(psp.spec.allowPrivilegeEscalation).toBe(false);
    });

    it('should require dropping all capabilities', () => {
      expect(psp.spec.requiredDropCapabilities).toContain('ALL');
    });

    it('should restrict volume types', () => {
      const allowedVolumes = [
        'configMap',
        'emptyDir',
        'projected',
        'secret',
        'downwardAPI',
        'persistentVolumeClaim'
      ];

      expect(psp.spec.volumes).toEqual(expect.arrayContaining(allowedVolumes));
      expect(psp.spec.volumes).toHaveLength(allowedVolumes.length);
    });

    it('should prevent host namespace sharing', () => {
      expect(psp.spec.hostNetwork).toBe(false);
      expect(psp.spec.hostIPC).toBe(false);
      expect(psp.spec.hostPID).toBe(false);
    });

    it('should enforce non-root user requirement', () => {
      expect(psp.spec.runAsUser.rule).toBe('MustRunAsNonRoot');
    });

    it('should configure SELinux', () => {
      expect(psp.spec.seLinux.rule).toBe('RunAsAny');
    });

    it('should configure supplemental groups', () => {
      expect(psp.spec.supplementalGroups.rule).toBe('MustRunAs');
      expect(psp.spec.supplementalGroups.ranges).toEqual([
        { min: 1, max: 65535 }
      ]);
    });

    it('should configure fsGroup', () => {
      expect(psp.spec.fsGroup.rule).toBe('MustRunAs');
      expect(psp.spec.fsGroup.ranges).toEqual([
        { min: 1, max: 65535 }
      ]);
    });

    it('should enforce read-only root filesystem', () => {
      expect(psp.spec.readOnlyRootFilesystem).toBe(true);
    });
  });

  describe('ClusterRole', () => {
    it('should have correct metadata', () => {
      expect(clusterRole.apiVersion).toBe('rbac.authorization.k8s.io/v1');
      expect(clusterRole.kind).toBe('ClusterRole');
      expect(clusterRole.metadata.name).toBe('psp:restricted');
    });

    it('should define correct rules', () => {
      expect(clusterRole.rules).toHaveLength(1);
      expect(clusterRole.rules[0]).toEqual({
        apiGroups: ['policy'],
        resources: ['podsecuritypolicies'],
        verbs: ['use'],
        resourceNames: ['ayphen-restricted']
      });
    });
  });

  describe('ClusterRoleBinding', () => {
    it('should have correct metadata', () => {
      expect(clusterRoleBinding.apiVersion).toBe('rbac.authorization.k8s.io/v1');
      expect(clusterRoleBinding.kind).toBe('ClusterRoleBinding');
      expect(clusterRoleBinding.metadata.name).toBe('default:restricted');
    });

    it('should bind to correct role', () => {
      expect(clusterRoleBinding.roleRef).toEqual({
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'ClusterRole',
        name: 'psp:restricted'
      });
    });

    it('should bind to default service account', () => {
      expect(clusterRoleBinding.subjects).toHaveLength(1);
      expect(clusterRoleBinding.subjects[0]).toEqual({
        kind: 'ServiceAccount',
        name: 'default',
        namespace: 'default'
      });
    });
  });
});
