import { RBACManager, Permission } from '@/lib/auth/rbac';

describe('RBACManager', () => {
  let rbacManager: RBACManager;

  beforeEach(() => {
    rbacManager = RBACManager.getInstance();
  });

  describe('User Role Management', () => {
    it('should set and handle admin role correctly', () => {
      rbacManager.setUserRole('admin');
      expect(rbacManager.hasPermission('manage_users')).toBe(true);
      expect(rbacManager.hasPermission('create_test')).toBe(true);
      expect(rbacManager.hasPermission('manage_proctoring')).toBe(true);
    });

    it('should set and handle proctor role correctly', () => {
      rbacManager.setUserRole('proctor');
      expect(rbacManager.hasPermission('manage_proctoring')).toBe(true);
      expect(rbacManager.hasPermission('view_results')).toBe(true);
      expect(rbacManager.hasPermission('manage_users')).toBe(false);
    });

    it('should set and handle instructor role correctly', () => {
      rbacManager.setUserRole('instructor');
      expect(rbacManager.hasPermission('create_test')).toBe(true);
      expect(rbacManager.hasPermission('view_analytics')).toBe(true);
      expect(rbacManager.hasPermission('manage_proctoring')).toBe(false);
    });

    it('should set and handle student role correctly', () => {
      rbacManager.setUserRole('student');
      expect(rbacManager.hasPermission('take_test')).toBe(true);
      expect(rbacManager.hasPermission('view_results')).toBe(true);
      expect(rbacManager.hasPermission('create_test')).toBe(false);
    });
  });

  describe('Permission Checking', () => {
    beforeEach(() => {
      rbacManager.setUserRole('admin');
    });

    it('should check single permission correctly', () => {
      expect(rbacManager.hasPermission('manage_users')).toBe(true);
      expect(rbacManager.hasPermission('take_test')).toBe(false);
    });

    it('should check multiple permissions with hasAnyPermission', () => {
      const permissions: Permission[] = ['manage_users', 'create_test'];
      expect(rbacManager.hasAnyPermission(permissions)).toBe(true);
    });

    it('should check multiple permissions with hasAllPermissions', () => {
      const permissions: Permission[] = ['manage_users', 'create_test'];
      expect(rbacManager.hasAllPermissions(permissions)).toBe(true);
    });

    it('should handle non-existent role', () => {
      rbacManager.setUserRole(null);
      expect(rbacManager.hasPermission('manage_users')).toBe(false);
    });
  });

  describe('User Permissions', () => {
    it('should return correct permissions for admin', () => {
      rbacManager.setUserRole('admin');
      const permissions = rbacManager.getUserPermissions();
      expect(permissions).toContain('manage_users');
      expect(permissions).toContain('create_test');
      expect(permissions).toContain('manage_proctoring');
    });

    it('should return empty permissions for null role', () => {
      rbacManager.setUserRole(null);
      expect(rbacManager.getUserPermissions()).toEqual([]);
    });
  });
});
